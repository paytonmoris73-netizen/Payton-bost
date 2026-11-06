"""Real FPS tracking with Intel PresentMon (MIT licensed, bundled with FRXST.exe).

PresentMon records every Present() a process makes through Windows' ETW events,
which is what the game hands to the screen, so these are measured frames, not
estimates. FRXST captures all processes and locks onto the game it boosted, or
on the busiest non-system app when the game isn't a known one.
"""

import collections
import csv
import os
import shutil
import subprocess
import sys
import threading
import time
from typing import Deque, Dict, List, Optional, Tuple

NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0
SESSION = "FRXST"

# Apps that present frames but are never "the game".
NOT_GAMES = {
    "dwm.exe", "explorer.exe", "msedgewebview2.exe", "frxst.exe", "searchhost.exe",
    "shellexperiencehost.exe", "startmenuexperiencehost.exe", "textinputhost.exe",
    "chrome.exe", "msedge.exe", "firefox.exe", "opera.exe", "brave.exe", "discord.exe",
    "steamwebhelper.exe", "epicwebhelper.exe", "obs64.exe", "spotify.exe", "code.exe",
    "presentmon.exe", "applicationframehost.exe", "lockapp.exe", "nvidia overlay.exe",
}


def presentmon_path() -> Optional[str]:
    env = os.environ.get("FRXST_PRESENTMON")
    if env and os.path.isfile(env):
        return env
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    for p in (os.path.join(base, "PresentMon.exe"), os.path.join(base, "bin", "PresentMon.exe")):
        if os.path.isfile(p):
            return p
    return shutil.which("PresentMon.exe") or shutil.which("PresentMon")


class FpsTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self._proc: Optional[subprocess.Popen] = None
        self._prefer: List[str] = []
        self._exclude = NOT_GAMES
        # (app, pid) -> recent (t, frametime_ms)
        self._frames: Dict[Tuple[str, int], Deque[Tuple[float, float]]] = {}
        self._target: Optional[Tuple[str, int]] = None
        self._history: Deque[int] = collections.deque(maxlen=60)
        self._all_ft: List[float] = []  # whole session, target only
        self._started = 0.0
        self._error = ""
        self._last_second = 0
        self.header: List[str] = []
        self.rows_seen = 0
        self.raw_sample: List[str] = []

    # ── lifecycle ──
    def start(self, prefer: Optional[List[str]] = None, exclude: Optional[set] = None) -> Dict:
        self.stop()
        pm = presentmon_path()
        if not pm:
            self._error = "PresentMon isn't bundled with this build."
            return {"ok": False, "error": self._error}
        if sys.platform != "win32":
            self._error = "FPS tracking needs Windows."
            return {"ok": False, "error": self._error}
        with self._lock:
            self._prefer = [p.lower() for p in (prefer or [])]
            self._exclude = NOT_GAMES if exclude is None else {e.lower() for e in exclude}
            self._frames.clear()
            self._target = None
            self._history.clear()
            self._all_ft = []
            self._error = ""
            self._started = time.monotonic()
            self._last_second = int(self._started)
        args = [pm, "--output_stdout", "--no_console_stats", "--session_name", SESSION,
                "--stop_existing_session"]
        try:
            self._proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                          text=True, bufsize=1, creationflags=NO_WINDOW,
                                          errors="replace")
        except OSError as e:
            self._error = "Couldn't start PresentMon: %s" % e
            return {"ok": False, "error": self._error}
        threading.Thread(target=self._read, args=(self._proc,), daemon=True).start()
        threading.Thread(target=self._read_err, args=(self._proc,), daemon=True).start()
        return {"ok": True}

    def stop(self) -> Optional[Dict]:
        proc, self._proc = self._proc, None
        summary = self.summary() if proc else None
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except (OSError, subprocess.TimeoutExpired):
                try:
                    proc.kill()
                except OSError:
                    pass
            pm = presentmon_path()
            if pm:  # an ETW session outlives a killed PresentMon; close it explicitly
                try:
                    subprocess.run([pm, "--terminate_existing_session", "--session_name", SESSION],
                                   capture_output=True, timeout=5, creationflags=NO_WINDOW)
                except (OSError, subprocess.TimeoutExpired):
                    pass
        return summary

    @property
    def running(self) -> bool:
        return bool(self._proc and self._proc.poll() is None)

    # ── capture ──
    def _read_err(self, proc):
        for line in proc.stderr:
            line = line.strip()
            if line and ("error" in line.lower() or "access" in line.lower()):
                self._error = line[:200]

    def _read(self, proc):
        reader = csv.reader(proc.stdout)
        cols = None
        ft_col = None
        for row in reader:
            if proc is not self._proc and self._proc is not None:
                break
            if len(self.raw_sample) < 6:
                self.raw_sample.append(",".join(row)[:300])
            if cols is None:
                if "Application" in row:
                    self.header = row
                    cols = {name: i for i, name in enumerate(row)}
                    # 1.x/2.x default name first, then the newer v2 metric names
                    ft_col = next((cols[c] for c in ("MsBetweenPresents", "FrameTime", "MsBetweenAppStart",
                                                     "MsBetweenSimulationStart") if c in cols), None)
                    if ft_col is None:
                        self._error = "Unrecognised PresentMon output columns."
                continue
            self.rows_seen += 1
            try:
                app = row[cols["Application"]].lower()
                pid = int(row[cols["ProcessID"]])
                ft = float(row[ft_col])
            except (KeyError, ValueError, IndexError, TypeError):
                continue
            if ft <= 0 or ft > 2000 or app in self._exclude:
                continue
            self._add(app, pid, ft)
        if proc is self._proc and not self._error:
            self._error = "PresentMon stopped unexpectedly."

    def _add(self, app: str, pid: int, ft: float):
        now = time.monotonic()
        with self._lock:
            q = self._frames.setdefault((app, pid), collections.deque())
            q.append((now, ft))
            while q and now - q[0][0] > 10:
                q.popleft()
            if (app, pid) == self._target:
                self._all_ft.append(ft)
                if len(self._all_ft) > 200000:
                    self._all_ft = self._all_ft[-100000:]

    def _pick_target(self, now: float):
        """Known game exes win; otherwise the busiest app, with hysteresis so we don't flap."""
        live = {k: q for k, q in self._frames.items() if q and now - q[-1][0] < 2}
        if not live:
            return
        rate = {k: sum(1 for t, _ in q if now - t < 2) for k, q in live.items()}
        preferred = [k for k in live if k[0] in self._prefer]
        best = max(preferred or live, key=rate.get)
        cur = self._target
        if cur in live:
            if preferred and cur in preferred:
                return
            if not preferred and rate[best] <= 1.5 * rate[cur]:
                return
        self._target = best
        self._all_ft = [ft for _, ft in live[best]]
        self._history.clear()
        self._last_second = int(now)

    # ── readings ──
    def stats(self) -> Dict:
        now = time.monotonic()
        with self._lock:
            for k in [k for k, q in self._frames.items() if not q or now - q[-1][0] > 15]:
                del self._frames[k]
            self._pick_target(now)
            if self._error and not self._target:
                return {"state": "error", "error": self._error}
            if not self.running and not self._target:
                return {"state": "off"}
            if not self._target:
                return {"state": "waiting", "seconds": int(now - self._started)}
            q = self._frames.get(self._target)
            recent = [ft for t, ft in q if now - t <= 1.0] if q else []
            window = [ft for _, ft in q] if q else []
            if not recent:
                return {"state": "waiting", "app": self._target[0], "seconds": int(now - self._started)}
            fps = 1000.0 * len(recent) / sum(recent)
            sec = int(now)
            while self._last_second < sec:
                self._history.append(round(fps))
                self._last_second += 1
            return {"state": "live", "app": self._target[0], "pid": self._target[1],
                    "fps": round(fps), "low1": low_fps(window, 0.01), "frametime": round(sum(recent) / len(recent), 2),
                    "avg": avg_fps(self._all_ft), "history": list(self._history)}

    def summary(self) -> Optional[Dict]:
        with self._lock:
            if not self._target or len(self._all_ft) < 30:
                return None
            return {"app": self._target[0], "avg": avg_fps(self._all_ft), "low1": low_fps(self._all_ft, 0.01),
                    "frames": len(self._all_ft), "seconds": round(sum(self._all_ft) / 1000)}


def avg_fps(ft: List[float]) -> int:
    return round(1000.0 * len(ft) / sum(ft)) if ft else 0


def low_fps(ft: List[float], pct: float) -> int:
    """'1% low' as reviewers use it: average FPS of the slowest pct of frames."""
    if not ft:
        return 0
    worst = sorted(ft, reverse=True)[:max(1, int(len(ft) * pct))]
    return round(1000.0 * len(worst) / sum(worst))
