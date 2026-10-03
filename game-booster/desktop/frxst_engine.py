"""FRXST system engine: real Windows tweaks behind the FRXST desktop app.

Everything the engine changes is recorded and undone by unboost()/shutdown().
No GUI imports here so it can be smoke-tested on its own.
"""

import ctypes
import json
import os
import platform
import re
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from typing import Dict, List, Optional

import psutil

IS_WIN = sys.platform == "win32"
NO_WINDOW = 0x08000000 if IS_WIN else 0

DATA_DIR = os.path.join(os.environ.get("APPDATA") or os.path.expanduser("~"), "FRXST")
os.makedirs(DATA_DIR, exist_ok=True)
CFG_PATH = os.path.join(DATA_DIR, "config.json")

GUID_BALANCED = "381b4222-f694-41f0-9685-ff5bb260df2e"
GUID_HIGH = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
GUID_ULTIMATE = "e9a42b02-d5df-448d-aa00-03f14749eb61"
GUID_RE = re.compile(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", re.I)
PLAN_RANK = {"balanced": 0, "high": 1, "frxst": 2}
TIER_PLAN = {1: "high", 2: "frxst", 3: "frxst"}
TIER_NAME = {1: "Free Boost", 2: "Pro Boost", 3: "Ultra Boost"}

# (subgroup, setting, AC value) applied to the FRXST Ultimate plan
FRXST_SETTINGS = [
    ("SUB_PROCESSOR", "PROCTHROTTLEMIN", 100),
    ("SUB_PROCESSOR", "PROCTHROTTLEMAX", 100),
    ("SUB_PROCESSOR", "CPMINCORES", 100),
    ("2a737441-1930-4402-8d77-b2bebba308a3", "48e6b7a6-50f5-4782-a5d4-53bb8f07e226", 0),
    ("SUB_PCIEXPRESS", "ASPM", 0),
    ("SUB_DISK", "DISKIDLE", 0),
    ("SUB_VIDEO", "VIDEOIDLE", 0),
    ("SUB_SLEEP", "STANDBYIDLE", 0),
]

GAME_EXES = {
    "cs2": ["cs2.exe"],
    "fortnite": ["FortniteClient-Win64-Shipping.exe"],
    "minecraft": ["Minecraft.Windows.exe", "javaw.exe"],
    "valorant": ["VALORANT-Win64-Shipping.exe"],
    "apex": ["r5apex.exe", "r5apex_dx12.exe"],
    "warzone": ["cod.exe", "ModernWarfare.exe"],
}
GAME_URLS = {
    "cs2": "steam://rungameid/730",
    "apex": "steam://rungameid/1172470",
    "warzone": "steam://rungameid/1938090",
    "fortnite": "com.epicgames.launcher://apps/Fortnite?action=launch&silent=true",
    "minecraft": "minecraft://",
}
RIOT_CLIENT = r"C:\Riot Games\Riot Client\RiotClientServices.exe"

# Pro/Ultra close these (and reopen them on stop). Launchers, browsers and
# voice chat are never closed: games and players depend on them.
CLOSE_APPS = {
    "onedrive.exe": "OneDrive", "dropbox.exe": "Dropbox", "googledrivefs.exe": "Google Drive",
    "teams.exe": "Teams", "ms-teams.exe": "Teams", "slack.exe": "Slack", "skype.exe": "Skype",
    "adobearm.exe": "Adobe Updater", "creative cloud.exe": "Creative Cloud",
}
# Every tier lowers these to below-normal priority (Ultra: idle) instead of closing them.
LOWER_APPS = {
    "chrome.exe": "Chrome", "msedge.exe": "Edge", "firefox.exe": "Firefox", "opera.exe": "Opera",
    "brave.exe": "Brave", "discord.exe": "Discord", "spotify.exe": "Spotify", "code.exe": "VS Code",
    "searchindexer.exe": "Windows Search", "searchprotocolhost.exe": "Windows Search",
}


def run(args: List[str], timeout: int = 25):
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                           creationflags=NO_WINDOW, errors="replace")
        return r.returncode, ((r.stdout or "") + (r.stderr or "")).strip()
    except Exception as e:  # noqa: BLE001 - surfaced to the UI as text
        return -1, str(e)


def ps(script: str, timeout: int = 30):
    return run(["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                "-Command", script], timeout)


def ps_q(s) -> str:
    """Quote a value as a PowerShell single-quoted literal."""
    return "'" + str(s).replace("'", "''") + "'"


def ping_ms(host: str) -> Optional[int]:
    """ICMP ping via ping.exe, falling back to TCP connect time."""
    if IS_WIN:
        rc, out = run(["ping", "-n", "1", "-w", "1500", host], timeout=6)
        m = re.search(r"[=<]\s*(\d+)\s*ms", out)
        if rc == 0 and m:
            return max(1, int(m.group(1)))
    for port in (443, 80):
        try:
            t0 = time.monotonic()
            socket.create_connection((host, port), timeout=2).close()
            return max(1, int((time.monotonic() - t0) * 1000))
        except OSError:
            continue
    return None


def is_admin() -> bool:
    if not IS_WIN:
        return os.geteuid() == 0 if hasattr(os, "geteuid") else False
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:  # noqa: BLE001
        return False


class Engine:
    def __init__(self):
        self.lock = threading.RLock()
        self.cfg = self._load_cfg()
        self.boosting = False
        self.tier = 0
        self.game_id = ""
        self.user_plan = "balanced"
        self.original_scheme = active_scheme()
        self._lowered: Dict[int, int] = {}        # pid -> original priority class
        self._closed: List[Dict] = []             # apps to reopen
        self._game_pids: Dict[int, int] = {}      # pid -> original priority class
        self._dvr_saved: Optional[List] = None
        self._qos: List[str] = []
        self._timer_holders = set()
        self._net_prev = None
        self._ping = None
        self._ping_host = "1.1.1.1"
        self._vpn_proc = None
        self._vpn_active: Optional[Dict] = None
        self._pending_pass: Dict[str, str] = {}
        self.vpn_lock = threading.Lock()
        self._res_orig: Optional[List[int]] = None
        self._stop = threading.Event()
        self._mon = Monitor(self._stop)
        psutil.cpu_percent(None)
        threading.Thread(target=self._ping_loop, daemon=True).start()
        self.user_plan = self.plan_id_of(self.original_scheme) if self.original_scheme else "balanced"
        if self.user_plan == "other":
            self.user_plan = "balanced"
        self.recovered = self._recover()
        if self.user_plan == "frxst":
            self._timer(True, "plan")

    # ── crash journal: what to undo if FRXST dies while changes are active ──
    def _journal_save(self):
        if self.boosting or self._res_orig:
            self.cfg["journal"] = {"user_plan": self.user_plan, "dvr": self._dvr_saved,
                                   "closed": self._closed, "qos": self._qos, "res": self._res_orig}
        else:
            self.cfg.pop("journal", None)
        self._save_cfg()

    def _recover(self) -> List[str]:
        j = self.cfg.get("journal")
        if not j:
            return []
        done = []
        if j.get("dvr"):
            self._dvr_saved = j["dvr"]
            self._dvr_restore()
            done.append("Game DVR")
        if j.get("qos"):
            self._qos = list(j["qos"])
            self._qos_off()
            done.append("QoS")
        if j.get("closed"):
            self._closed = list(j["closed"])
            self._reopen_closed()
            done.append("closed apps")
        if j.get("res"):
            self._res_orig = j["res"]
            self.restore_resolution()
            done.append("screen resolution")
        if j.get("user_plan") in PLAN_RANK:
            self.user_plan = j["user_plan"]
            if self._apply_plan(self.user_plan)["ok"]:
                done.append("power plan")
        self.cfg.pop("journal", None)
        self._save_cfg()
        return done

    # ── config ──
    def _load_cfg(self) -> Dict:
        try:
            with open(CFG_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:  # noqa: BLE001
            return {}

    def _save_cfg(self):
        try:
            with open(CFG_PATH, "w", encoding="utf-8") as f:
                json.dump(self.cfg, f, indent=2)
        except OSError:
            pass

    # ── stats ──
    def _ping_loop(self):
        while not self._stop.is_set():
            self._ping = ping_ms(self._ping_host)
            self._stop.wait(3)

    def stats(self) -> Dict:
        vm = psutil.virtual_memory()
        now = time.monotonic()
        io = psutil.net_io_counters()
        dl = ul = 0.0
        if self._net_prev:
            t, rx, tx = self._net_prev
            dt = max(0.1, now - t)
            dl = (io.bytes_recv - rx) * 8 / dt / 1e6
            ul = (io.bytes_sent - tx) * 8 / dt / 1e6
        self._net_prev = (now, io.bytes_recv, io.bytes_sent)
        return {"cpu": round(psutil.cpu_percent(None)), "ram": round(vm.percent),
                "ram_used_gb": round(vm.used / 1024 ** 3, 1), "ping": self._ping,
                "dl": round(dl, 1), "ul": round(ul, 1), "admin": is_admin()}

    # ── power plans ──
    def plan_id_of(self, guid: Optional[str]) -> str:
        if not guid:
            return "other"
        g = guid.lower()
        if g == self.cfg.get("frxst_guid", "").lower():
            return "frxst"
        if g in (GUID_HIGH, self.cfg.get("high_guid", "").lower()):
            return "high"
        if g == GUID_BALANCED:
            return "balanced"
        return "other"

    def _ensure_high(self) -> Optional[str]:
        schemes = list_schemes()
        if GUID_HIGH in schemes:
            return GUID_HIGH
        g = self.cfg.get("high_guid")
        if g and g.lower() in schemes:
            return g
        g = duplicate_scheme(GUID_HIGH)
        if g:
            self.cfg["high_guid"] = g
            self._save_cfg()
        return g

    def _ensure_frxst(self) -> Optional[str]:
        g = self.cfg.get("frxst_guid")
        if g and g.lower() in list_schemes():
            return g
        for base in (GUID_ULTIMATE, GUID_HIGH, GUID_BALANCED):
            g = duplicate_scheme(base)
            if g:
                break
        if not g:
            return None
        run(["powercfg", "-changename", g, "FRXST Ultimate", "Gaming power plan by FRXST"])
        for sub, setting, val in FRXST_SETTINGS:
            run(["powercfg", "-setacvalueindex", g, sub, setting, str(val)])
        self.cfg["frxst_guid"] = g
        self._save_cfg()
        return g

    def _guid_for(self, plan: str) -> Optional[str]:
        if plan == "balanced":
            return GUID_BALANCED
        if plan == "high":
            return self._ensure_high()
        if plan == "frxst":
            return self._ensure_frxst()
        return None

    def _apply_plan(self, plan: str) -> Dict:
        g = self._guid_for(plan)
        if not g:
            return {"ok": False, "error": "Windows wouldn't create that power plan on this PC."}
        rc, out = run(["powercfg", "/setactive", g])
        if rc != 0 or (active_scheme() or "").lower() != g.lower():
            return {"ok": False, "error": "Windows refused to switch power plan: " + out[:120]}
        self._timer(plan == "frxst", "plan")
        return {"ok": True, "id": plan}

    def effective_plan(self) -> str:
        if self.boosting:
            forced = TIER_PLAN.get(self.tier, "balanced")
            if PLAN_RANK[forced] > PLAN_RANK[self.user_plan]:
                return forced
        return self.user_plan

    def get_power_plan(self) -> Dict:
        with self.lock:
            return {"ok": True, "id": self.effective_plan(), "user": self.user_plan,
                    "windows": self.plan_id_of(active_scheme())}

    def set_power_plan(self, plan: str) -> Dict:
        if plan not in PLAN_RANK:
            return {"ok": False, "error": "Unknown power plan"}
        with self.lock:
            prev = self.user_plan
            self.user_plan = plan
            res = self._apply_plan(self.effective_plan())
            if not res["ok"]:
                self.user_plan = prev
                return res
            return {"ok": True, "id": self.effective_plan(), "user": plan}

    # ── timer resolution (0.5 ms while FRXST plan or Ultra is active) ──
    def _timer(self, on: bool, holder: str):
        if on:
            self._timer_holders.add(holder)
        else:
            self._timer_holders.discard(holder)
        want = bool(self._timer_holders)
        if not IS_WIN:
            return want
        try:
            cur = ctypes.c_ulong()
            st = ctypes.windll.ntdll.NtSetTimerResolution(ctypes.c_ulong(5000), ctypes.c_bool(want),
                                                         ctypes.byref(cur))
            return st == 0
        except Exception:  # noqa: BLE001
            return False

    # ── Game DVR ──
    def _dvr_off(self) -> bool:
        if not IS_WIN:
            return False
        import winreg
        keys = [(r"System\GameConfigStore", "GameDVR_Enabled"),
                (r"Software\Microsoft\Windows\CurrentVersion\GameDVR", "AppCaptureEnabled")]
        saved = []
        try:
            for path, name in keys:
                k = winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, path, 0,
                                       winreg.KEY_READ | winreg.KEY_SET_VALUE)
                try:
                    old = winreg.QueryValueEx(k, name)[0]
                except FileNotFoundError:
                    old = None
                saved.append((path, name, old))
                winreg.SetValueEx(k, name, 0, winreg.REG_DWORD, 0)
                winreg.CloseKey(k)
            if self._dvr_saved is None:
                self._dvr_saved = saved
            return True
        except OSError:
            return False

    def _dvr_restore(self):
        if not IS_WIN or self._dvr_saved is None:
            return
        import winreg
        for path, name, old in self._dvr_saved:
            try:
                k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, path, 0, winreg.KEY_SET_VALUE)
                if old is None:
                    try:
                        winreg.DeleteValue(k, name)
                    except FileNotFoundError:
                        pass
                else:
                    winreg.SetValueEx(k, name, 0, winreg.REG_DWORD, int(old))
                winreg.CloseKey(k)
            except OSError:
                pass
        self._dvr_saved = None

    # ── processes ──
    @staticmethod
    def _prio(name: str):
        if not IS_WIN:
            return {"high": -10, "below": 10, "idle": 19, "normal": 0}[name]
        return {"high": psutil.HIGH_PRIORITY_CLASS, "below": psutil.BELOW_NORMAL_PRIORITY_CLASS,
                "idle": psutil.IDLE_PRIORITY_CLASS, "normal": psutil.NORMAL_PRIORITY_CLASS}[name]

    def _find(self, names) -> List[psutil.Process]:
        want = {n.lower() for n in names}
        out = []
        for p in psutil.process_iter(["pid", "name"]):
            if (p.info.get("name") or "").lower() in want:
                out.append(p)
        return out

    def _boost_game_procs(self, game_id: str) -> List[int]:
        pids = []
        for p in self._find(GAME_EXES.get(game_id, [])):
            try:
                if p.pid not in self._game_pids:
                    self._game_pids[p.pid] = p.nice()
                p.nice(self._prio("high"))
                pids.append(p.pid)
            except (psutil.Error, OSError):
                pass
        return pids

    def _lower_bg(self, level: str):
        n, mem = 0, 0.0
        for p in self._find(LOWER_APPS):
            try:
                if p.pid not in self._lowered:
                    self._lowered[p.pid] = p.nice()
                p.nice(self._prio(level))
                n += 1
                if IS_WIN and level == "idle":
                    before = p.memory_info().rss
                    k32 = ctypes.windll.kernel32
                    k32.OpenProcess.restype = ctypes.c_void_p
                    h = k32.OpenProcess(0x0400 | 0x0100, False, p.pid)
                    if h:
                        ctypes.windll.psapi.EmptyWorkingSet(ctypes.c_void_p(h))
                        k32.CloseHandle(ctypes.c_void_p(h))
                        mem += max(0, before - p.memory_info().rss) / 1024 ** 2
            except (psutil.Error, OSError):
                pass
        return n, mem

    def _close_bg(self):
        names, mem = [], 0.0
        for p in self._find(CLOSE_APPS):
            try:
                info = {"exe": p.exe(), "cmd": p.cmdline(), "label": CLOSE_APPS[p.name().lower()]}
                # Store (MSIX) apps can't be relaunched from their exe path, so leave them running.
                if "\\windowsapps\\" in info["exe"].lower():
                    continue
                mem += p.memory_info().rss / 1024 ** 2
                p.terminate()
                if not any(c["exe"].lower() == info["exe"].lower() for c in self._closed):
                    self._closed.append(info)
                if info["label"] not in names:
                    names.append(info["label"])
            except (psutil.Error, OSError):
                pass
        return names, mem

    def _qos_on(self, game_id: str) -> bool:
        exes = GAME_EXES.get(game_id)
        if not exes or not IS_WIN:
            return False
        ok = False
        for exe in exes:
            name = "FRXST-" + exe
            rc, _ = ps("New-NetQosPolicy -Name %s -AppPathNameMatchCondition %s -DSCPAction 46 "
                       "-NetworkProfile All -PolicyStore ActiveStore -ErrorAction Stop | Out-Null"
                       % (ps_q(name), ps_q(exe)))
            if rc == 0:
                self._qos.append(name)
                ok = True
        return ok

    def _qos_off(self):
        for name in self._qos:
            ps("Remove-NetQosPolicy -Name %s -PolicyStore ActiveStore -Confirm:$false "
               "-ErrorAction SilentlyContinue" % ps_q(name))
        self._qos = []

    # ── boost ──
    def boost(self, game_id: str, tier: int, game_name: str = "") -> Dict:
        tier = tier if tier in (1, 2, 3) else 1
        with self.lock:
            if self.boosting:
                self._unboost_locked()
            self.boosting, self.tier, self.game_id = True, tier, game_id or ""
            steps, freed = [], 0.0

            def step(label, ok, detail=""):
                steps.append({"label": label, "ok": bool(ok), "detail": detail})

            plan = self.effective_plan()
            r = self._apply_plan(plan)
            step("Power plan → " + {"high": "High Performance", "frxst": "FRXST Ultimate",
                                     "balanced": "Balanced"}[plan], r["ok"], r.get("error", ""))

            gp = self._boost_game_procs(self.game_id)
            if gp:
                step("Game priority → High (%d process%s)" % (len(gp), "es" if len(gp) > 1 else ""), True)
            elif self.game_id in GAME_EXES:
                step("Game priority → High when %s starts" % (game_name or "the game"), True,
                     "Not running yet. Applied automatically after launch.")
            else:
                step("Game priority", False, "FRXST can't detect custom games. Start it normally.")

            n, mem = self._lower_bg("idle" if tier == 3 else "below")
            freed += mem
            step(("Background apps → idle priority + memory trimmed" if tier == 3
                  else "Background apps → lower priority") + " (%d)" % n, True,
                 "" if n else "None of the usual background apps were running.")

            if tier >= 2:
                names, mem = self._close_bg()
                freed += mem
                step("Closed: " + ", ".join(names) if names else "Close background sync & chat apps", True,
                     "They reopen when you stop boosting." if names else "Nothing to close.")
                step("Game DVR / Xbox capture off", self._dvr_off(),
                     "" if IS_WIN else "Windows only")
            if tier == 3:
                step("Timer resolution → 0.5 ms", self._timer(True, "ultra"))
                if self.game_id in GAME_EXES:
                    ok = self._qos_on(self.game_id)
                    step("Game traffic prioritized (QoS DSCP 46)", ok,
                         "" if ok else "Needs admin rights. Run FRXST as administrator.")
                else:
                    step("Game traffic prioritized (QoS)", False, "Only for the listed games.")

            self._journal_save()
            return {"ok": True, "steps": steps, "freed_mb": round(freed),
                    "freed_cpu": round(min(30, len(self._lowered) * 1.5 + len(self._closed) * 2)),
                    "game_running": bool(gp), "tier": TIER_NAME[tier]}

    def _unboost_locked(self) -> Dict:
        restored = []
        for pid, prio in list(self._game_pids.items()):
            try:
                psutil.Process(pid).nice(prio)
            except (psutil.Error, OSError):
                pass
        self._game_pids.clear()
        for pid, prio in list(self._lowered.items()):
            try:
                psutil.Process(pid).nice(prio)
            except (psutil.Error, OSError):
                pass
        if self._lowered:
            restored.append("app priorities")
        self._lowered.clear()
        reopened = self._reopen_closed()
        if reopened:
            restored.append("reopened " + ", ".join(dict.fromkeys(reopened)))
        if self._dvr_saved is not None:
            self._dvr_restore()
            restored.append("Game DVR")
        if self._qos:
            self._qos_off()
            restored.append("QoS")
        self._timer(False, "ultra")
        self.boosting, self.tier = False, 0
        r = self._apply_plan(self.user_plan)
        if r["ok"]:
            restored.append("power plan")
        self._journal_save()
        return {"ok": True, "restored": restored}

    def _reopen_closed(self) -> List[str]:
        reopened = []
        for info in self._closed:
            try:
                if info.get("exe") and os.path.exists(info["exe"]):
                    subprocess.Popen(info.get("cmd") or [info["exe"]], creationflags=NO_WINDOW)
                    reopened.append(info["label"])
            except OSError:
                pass
        self._closed = []
        return reopened

    def unboost(self) -> Dict:
        with self.lock:
            if not self.boosting:
                return {"ok": True, "restored": []}
            return self._unboost_locked()

    # ── games ──
    def launch(self, game_id: str) -> Dict:
        url = GAME_URLS.get(game_id)
        try:
            if url:
                os.startfile(url)  # type: ignore[attr-defined]
                return {"ok": True}
            if game_id == "valorant" and os.path.exists(RIOT_CLIENT):
                subprocess.Popen([RIOT_CLIENT, "--launch-product=valorant", "--launch-patchline=live"])
                return {"ok": True}
        except (OSError, AttributeError) as e:
            return {"ok": False, "error": "Couldn't open the launcher: %s" % e}
        return {"ok": False, "error": "No launcher link for this game. Start it yourself; FRXST will detect it."}

    def find_game(self, game_id: str) -> Dict:
        with self.lock:
            procs = self._find(GAME_EXES.get(game_id, []))
            if not procs:
                return {"found": False}
            pids = self._boost_game_procs(game_id) if self.boosting else []
            return {"found": True, "pid": procs[0].pid, "boosted": bool(pids)}

    # ── VPN (Windows built-in IKEv2 / L2TP / SSTP, plus OpenVPN / WireGuard configs) ──
    def vpn_list(self) -> Dict:
        out = []
        if IS_WIN:
            rc, txt = ps("Get-VpnConnection | Select-Object Name,ServerAddress,TunnelType,"
                         "ConnectionStatus | ConvertTo-Json -Compress")
            try:
                data = json.loads(txt) if txt.strip().startswith(("[", "{")) else []
            except ValueError:
                data = []
            if isinstance(data, dict):
                data = [data]
            own = set(self.cfg.get("vpn_owned", []))
            for v in data:
                t = str(v.get("TunnelType") or "Automatic")
                out.append({"id": "w:" + v["Name"], "name": v["Name"], "server": v.get("ServerAddress") or "",
                            "type": {"L2tp": "L2TP/IPsec", "Sstp": "SSTP", "Ikev2": "IKEv2"}.get(t, t),
                            "connected": str(v.get("ConnectionStatus")) == "Connected",
                            "own": v["Name"] in own})
        for v in self.cfg.get("vpn_files", []):
            out.append({"id": "f:" + v["name"], "name": v["name"], "server": v.get("server", ""),
                        "type": v["type"], "connected": bool(self._vpn_active and
                                                             self._vpn_active["id"] == "f:" + v["name"]),
                        "own": True})
        active = next((v["id"] for v in out if v["connected"]), None)
        return {"ok": True, "list": out, "active": active}

    def vpn_add(self, p: Dict) -> Dict:
        name, server, vtype = (p.get("name") or "").strip(), (p.get("server") or "").strip(), p.get("type")
        if not name or not server:
            return {"ok": False, "error": "Name and server are required."}
        if vtype in ("OpenVPN", "WireGuard"):
            cfg = p.get("config") or ""
            if not os.path.isfile(cfg):
                return {"ok": False, "error": "Choose the .ovpn / .conf file from your VPN provider."}
            files = [v for v in self.cfg.get("vpn_files", []) if v["name"] != name]
            files.append({"name": name, "server": server, "type": vtype, "config": cfg})
            self.cfg["vpn_files"] = files
            self._save_cfg()
            return {"ok": True}
        tunnel = {"IKEv2": "Ikev2", "L2TP/IPsec": "L2tp", "SSTP": "Sstp"}.get(vtype)
        if not tunnel:
            return {"ok": False, "error": "Unsupported VPN type."}
        if not IS_WIN:
            return {"ok": False, "error": "VPN profiles need Windows."}
        rc, out = ps("Add-VpnConnection -Name %s -ServerAddress %s -TunnelType %s -RememberCredential "
                     "-Force -ErrorAction Stop" % (ps_q(name), ps_q(server), tunnel))
        if rc != 0:
            return {"ok": False, "error": "Windows rejected the VPN profile: " + out[:160]}
        own = set(self.cfg.get("vpn_owned", []))
        own.add(name)
        self.cfg["vpn_owned"] = sorted(own)
        creds = self.cfg.get("vpn_users", {})
        if p.get("user"):
            creds[name] = p["user"]
        self.cfg["vpn_users"] = creds
        self._save_cfg()
        if p.get("user"):
            self._pending_pass[name] = p.get("pass") or ""
        return {"ok": True}

    def vpn_remove(self, vid: str) -> Dict:
        name = vid[2:]
        if vid.startswith("f:"):
            self.cfg["vpn_files"] = [v for v in self.cfg.get("vpn_files", []) if v["name"] != name]
            self._save_cfg()
            return {"ok": True}
        if name not in self.cfg.get("vpn_owned", []):
            return {"ok": False, "error": "This VPN was set up outside FRXST. Remove it in Windows Settings → VPN."}
        rc, out = ps("Remove-VpnConnection -Name %s -Force -ErrorAction Stop" % ps_q(name))
        if rc != 0:
            return {"ok": False, "error": out[:160]}
        self.cfg["vpn_owned"] = [n for n in self.cfg.get("vpn_owned", []) if n != name]
        self._save_cfg()
        return {"ok": True}

    def vpn_connect(self, vid: str) -> Dict:
        name = vid[2:]
        with self.vpn_lock:
            self._vpn_disconnect_locked()
            if vid.startswith("f:"):
                p = next((v for v in self.cfg.get("vpn_files", []) if v["name"] == name), None)
                if not p or not os.path.isfile(p["config"]):
                    return {"ok": False, "error": "Config file is missing. Re-add this VPN."}
                if p["type"] == "OpenVPN":
                    exe = next((c for c in (r"C:\Program Files\OpenVPN\bin\openvpn.exe",
                                            r"C:\Program Files (x86)\OpenVPN\bin\openvpn.exe")
                                if os.path.exists(c)), None)
                    if not exe:
                        return {"ok": False, "error": "Install OpenVPN first (openvpn.net)."}
                    self._vpn_proc = subprocess.Popen([exe, "--config", p["config"]], creationflags=NO_WINDOW)
                    time.sleep(6)
                    if self._vpn_proc.poll() is not None:
                        return {"ok": False, "error": "OpenVPN exited. Check your config or credentials."}
                else:
                    exe = r"C:\Program Files\WireGuard\wireguard.exe"
                    if not os.path.exists(exe):
                        return {"ok": False, "error": "Install WireGuard first (wireguard.com)."}
                    rc, out = run([exe, "/installtunnelservice", p["config"]])
                    if rc != 0:
                        return {"ok": False, "error": out[:160] or "WireGuard refused the tunnel."}
                    time.sleep(3)
                self._vpn_active = {"id": vid, "name": name, "type": p["type"], "config": p["config"]}
            else:
                # Credentials go on the first connect only; -RememberCredential lets
                # Windows reuse them afterwards without FRXST storing the password.
                args = ["rasdial", name]
                user = self.cfg.get("vpn_users", {}).get(name)
                pw = self._pending_pass.get(name)
                if user and pw is not None:
                    args += [user, pw]
                rc, out = run(args, timeout=60)
                if rc == 0:
                    self._pending_pass.pop(name, None)
                if rc != 0:
                    m = re.search(r"(\d{3,4})", out)
                    return {"ok": False, "error": "Windows couldn't connect%s. %s" % (
                        " (error %s)" % m.group(1) if m else "", out.splitlines()[-1][:140] if out else "")}
                self._vpn_active = {"id": vid, "name": name, "type": "ras"}
            return {"ok": True, "public_ip": public_ip(), "tunnel_ip": self._tunnel_ip(name)}

    def _tunnel_ip(self, name: str) -> str:
        for nic, addrs in psutil.net_if_addrs().items():
            if name.lower() in nic.lower() or "wireguard" in nic.lower() or "tap" in nic.lower():
                for a in addrs:
                    if a.family == socket.AF_INET:
                        return a.address
        return "—"

    def vpn_status(self) -> Dict:
        a = self._vpn_active
        if not a:
            return {"on": False}
        mb = 0.0
        for nic, c in psutil.net_io_counters(pernic=True).items():
            if a["name"].lower() in nic.lower():
                mb = (c.bytes_recv + c.bytes_sent) / 1024 ** 2
        return {"on": True, "mb": round(mb, 1)}

    def _vpn_disconnect_locked(self):
        a = self._vpn_active
        if not a:
            return
        if a["type"] == "ras":
            run(["rasdial", a["name"], "/DISCONNECT"])
        elif a["type"] == "OpenVPN" and self._vpn_proc:
            self._vpn_proc.terminate()
            self._vpn_proc = None
        elif a["type"] == "WireGuard":
            run([r"C:\Program Files\WireGuard\wireguard.exe", "/uninstalltunnelservice",
                 os.path.splitext(os.path.basename(a["config"]))[0]])
        self._vpn_active = None

    def vpn_disconnect(self) -> Dict:
        with self.vpn_lock:
            self._vpn_disconnect_locked()
        return {"ok": True}

    # ── lifecycle ──
    def shutdown(self):
        with self.lock:
            if self.boosting:
                self._unboost_locked()
            if self._res_orig:
                self.restore_resolution()
            self._timer(False, "plan")
            self._timer(False, "ultra")
        if self.vpn_lock.acquire(timeout=3):
            try:
                self._vpn_disconnect_locked()
            finally:
                self.vpn_lock.release()
        self._stop.set()

    # ── display resolution (dynamic change: Windows resets it on reboot) ──
    def resolution_info(self) -> Dict:
        cur = current_mode()
        orig = self._res_orig or ([cur[0], cur[1]] if cur else None)
        return {"ok": bool(cur), "current": cur[:2] if cur else None, "hz": cur[2] if cur else None,
                "original": orig, "active": bool(self._res_orig), "modes": list_modes()}

    def set_resolution(self, w: int, h: int) -> Dict:
        w, h = int(w), int(h)
        with self.lock:
            cur = current_mode()
            if not cur:
                return {"ok": False, "error": "Couldn't read your display settings."}
            modes = list_modes()
            if [w, h] not in modes:
                alts = [m for m in modes if abs(m[0] / m[1] - w / h) < 0.02 and m[0] < cur[0]]
                hint = (" Supported at this shape: " + ", ".join("%d×%d" % tuple(m) for m in alts[-4:])) if alts else ""
                return {"ok": False, "error": "Your display doesn't support %d×%d.%s" % (w, h, hint)}
            if not self._res_orig:
                self._res_orig = [cur[0], cur[1]]
            rc = change_mode(w, h, cur[2])
            if rc != 0:
                return {"ok": False, "error": "Windows refused %d×%d (code %d)." % (w, h, rc)}
            self._journal_save()
            return {"ok": True, "current": [w, h], "original": self._res_orig}

    def restore_resolution(self) -> Dict:
        if IS_WIN:
            ctypes.windll.user32.ChangeDisplaySettingsW(None, 0)
        orig = self._res_orig
        self._res_orig = None
        self._journal_save()
        return {"ok": True, "original": orig}

    # ── PC monitor ──
    def system_info(self) -> Dict:
        return self._mon.info()

    def monitor(self) -> Dict:
        return self._mon.sample()


class DEVMODEW(ctypes.Structure):
    _fields_ = [("dmDeviceName", ctypes.c_wchar * 32), ("dmSpecVersion", ctypes.c_ushort),
                ("dmDriverVersion", ctypes.c_ushort), ("dmSize", ctypes.c_ushort),
                ("dmDriverExtra", ctypes.c_ushort), ("dmFields", ctypes.c_ulong),
                ("dmPositionX", ctypes.c_long), ("dmPositionY", ctypes.c_long),
                ("dmDisplayOrientation", ctypes.c_ulong), ("dmDisplayFixedOutput", ctypes.c_ulong),
                ("dmColor", ctypes.c_short), ("dmDuplex", ctypes.c_short), ("dmYResolution", ctypes.c_short),
                ("dmTTOption", ctypes.c_short), ("dmCollate", ctypes.c_short),
                ("dmFormName", ctypes.c_wchar * 32), ("dmLogPixels", ctypes.c_ushort),
                ("dmBitsPerPel", ctypes.c_ulong), ("dmPelsWidth", ctypes.c_ulong),
                ("dmPelsHeight", ctypes.c_ulong), ("dmDisplayFlags", ctypes.c_ulong),
                ("dmDisplayFrequency", ctypes.c_ulong), ("dmICMMethod", ctypes.c_ulong),
                ("dmICMIntent", ctypes.c_ulong), ("dmMediaType", ctypes.c_ulong),
                ("dmDitherType", ctypes.c_ulong), ("dmReserved1", ctypes.c_ulong),
                ("dmReserved2", ctypes.c_ulong), ("dmPanningWidth", ctypes.c_ulong),
                ("dmPanningHeight", ctypes.c_ulong)]


def _devmode():
    dm = DEVMODEW()
    dm.dmSize = ctypes.sizeof(DEVMODEW)
    return dm


def current_mode() -> Optional[List[int]]:
    if not IS_WIN:
        return None
    dm = _devmode()
    if not ctypes.windll.user32.EnumDisplaySettingsW(None, -1, ctypes.byref(dm)):
        return None
    return [dm.dmPelsWidth, dm.dmPelsHeight, dm.dmDisplayFrequency]


def list_modes() -> List[List[int]]:
    if not IS_WIN:
        return []
    seen, i = set(), 0
    dm = _devmode()
    while ctypes.windll.user32.EnumDisplaySettingsW(None, i, ctypes.byref(dm)):
        if dm.dmBitsPerPel >= 32:
            seen.add((dm.dmPelsWidth, dm.dmPelsHeight))
        i += 1
    return [list(m) for m in sorted(seen)]


def change_mode(w: int, h: int, hz: int) -> int:
    """Switches the main display; picks the highest refresh rate up to the current one."""
    best, i = None, 0
    dm = _devmode()
    while ctypes.windll.user32.EnumDisplaySettingsW(None, i, ctypes.byref(dm)):
        if dm.dmPelsWidth == w and dm.dmPelsHeight == h and dm.dmBitsPerPel >= 32:
            if best is None or (best < dm.dmDisplayFrequency <= hz):
                best = dm.dmDisplayFrequency
        i += 1
    target = _devmode()
    target.dmPelsWidth, target.dmPelsHeight = w, h
    target.dmFields = 0x80000 | 0x100000
    if best:
        target.dmDisplayFrequency = best
        target.dmFields |= 0x400000
    user32 = ctypes.windll.user32
    rc = user32.ChangeDisplaySettingsW(ctypes.byref(target), 2)  # CDS_TEST
    if rc != 0:
        return rc
    return user32.ChangeDisplaySettingsW(ctypes.byref(target), 0)


class _PdhItem(ctypes.Structure):
    class _Val(ctypes.Structure):
        _fields_ = [("CStatus", ctypes.c_ulong), ("doubleValue", ctypes.c_double)]
    _fields_ = [("szName", ctypes.c_wchar_p), ("FmtValue", _Val)]


class Monitor:
    """Hardware readings for the PC Monitor page. Process sampling runs only while the page polls."""

    def __init__(self, stop: threading.Event):
        self._stop = stop
        self._info: Optional[Dict] = None
        self._last_poll = 0.0
        self._procs: Dict[int, psutil.Process] = {}
        self._top: List[Dict] = []
        self._gpu: Optional[float] = None
        self._temp: Optional[float] = None
        self._temp_supported = True
        self._disk_prev = None
        self._pdh = None
        threading.Thread(target=self._loop, daemon=True).start()

    def info(self) -> Dict:
        if self._info is None:
            self._info = _system_info()
        return self._info

    def _loop(self):
        tick = 0
        while not self._stop.is_set():
            if time.monotonic() - self._last_poll < 6:
                self._sample_procs()
                self._gpu = self._read_gpu()
                if tick % 5 == 0 and self._temp_supported:
                    self._temp = _read_temp()
                    if self._temp is None:
                        self._temp_supported = False
                tick += 1
            self._stop.wait(2)

    def _sample_procs(self):
        alive, rows = {}, []
        ncpu = psutil.cpu_count() or 1
        for p in psutil.process_iter(["name", "memory_info"]):
            try:
                proc = self._procs.get(p.pid) or p
                cpu = proc.cpu_percent(None) / ncpu
                alive[p.pid] = proc
                name = p.info.get("name") or ""
                if p.pid in (0, 4) or name.lower() in ("system idle process", "idle", "registry"):
                    continue
                rows.append({"name": name, "pid": p.pid, "cpu": round(cpu, 1),
                             "mb": round((p.info["memory_info"].rss if p.info.get("memory_info") else 0) / 1024 ** 2)})
            except (psutil.Error, OSError):
                pass
        self._procs = alive
        merged: Dict[str, Dict] = {}
        for r in rows:
            m = merged.setdefault(r["name"], {"name": r["name"], "cpu": 0.0, "mb": 0, "n": 0})
            m["cpu"] += r["cpu"]
            m["mb"] += r["mb"]
            m["n"] += 1
        top = sorted(merged.values(), key=lambda x: (x["cpu"], x["mb"]), reverse=True)[:8]
        for t in top:
            t["cpu"] = round(t["cpu"], 1)
        self._top = top

    def _read_gpu(self) -> Optional[float]:
        if not IS_WIN:
            return None
        try:
            pdh = ctypes.windll.pdh
            if self._pdh is None:
                q, c = ctypes.c_void_p(), ctypes.c_void_p()
                if pdh.PdhOpenQueryW(None, None, ctypes.byref(q)) != 0:
                    self._pdh = False
                    return None
                if pdh.PdhAddEnglishCounterW(q, "\\GPU Engine(*engtype_3D)\\Utilization Percentage",
                                             None, ctypes.byref(c)) != 0:
                    self._pdh = False
                    return None
                pdh.PdhCollectQueryData(q)
                self._pdh = (q, c)
                return None
            if self._pdh is False:
                return None
            q, c = self._pdh
            pdh.PdhCollectQueryData(q)
            size, count = ctypes.c_ulong(0), ctypes.c_ulong(0)
            pdh.PdhGetFormattedCounterArrayW(c, 0x200, ctypes.byref(size), ctypes.byref(count), None)
            if not size.value:
                return 0.0
            buf = (ctypes.c_byte * size.value)()
            if pdh.PdhGetFormattedCounterArrayW(c, 0x200, ctypes.byref(size), ctypes.byref(count), buf) != 0:
                return None
            items = ctypes.cast(buf, ctypes.POINTER(_PdhItem))
            total = sum(items[i].FmtValue.doubleValue for i in range(count.value) if items[i].FmtValue.CStatus in (0, 1))
            return round(min(100.0, total), 1)
        except (OSError, AttributeError, ValueError):
            self._pdh = False
            return None

    def sample(self) -> Dict:
        self._last_poll = time.monotonic()
        vm = psutil.virtual_memory()
        freq = psutil.cpu_freq()
        now = time.monotonic()
        dio = psutil.disk_io_counters()
        rd = wr = 0.0
        if dio and self._disk_prev:
            t, r0, w0 = self._disk_prev
            dt = max(0.1, now - t)
            rd, wr = (dio.read_bytes - r0) / dt / 1024 ** 2, (dio.write_bytes - w0) / dt / 1024 ** 2
        if dio:
            self._disk_prev = (now, dio.read_bytes, dio.write_bytes)
        try:
            du = psutil.disk_usage(os.environ.get("SystemDrive", "C:") + "\\" if IS_WIN else "/")
            disk = {"pct": round(du.percent), "free_gb": round(du.free / 1024 ** 3)}
        except OSError:
            disk = {"pct": None, "free_gb": None}
        bat = None
        try:
            b = psutil.sensors_battery()
            if b:
                bat = {"pct": round(b.percent), "plugged": bool(b.power_plugged)}
        except (AttributeError, OSError):
            pass
        return {"cpu": round(psutil.cpu_percent(None)), "cores": [round(x) for x in psutil.cpu_percent(None, percpu=True)],
                "mhz": round(freq.current) if freq else None, "gpu": self._gpu, "temp": self._temp,
                "ram_used": round(vm.used / 1024 ** 3, 1), "ram_total": round(vm.total / 1024 ** 3, 1),
                "ram_pct": round(vm.percent), "disk": disk, "disk_rd": round(rd, 1), "disk_wr": round(wr, 1),
                "battery": bat, "uptime_s": int(time.time() - psutil.boot_time()), "top": self._top}


def _system_info() -> Dict:
    cpu = platform.processor() or "CPU"
    os_name = platform.platform()
    gpus: List[str] = []
    if IS_WIN:
        try:
            import winreg
            k = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            cpu = winreg.QueryValueEx(k, "ProcessorNameString")[0].strip()
            k = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
            build = int(winreg.QueryValueEx(k, "CurrentBuildNumber")[0])
            try:
                ver = winreg.QueryValueEx(k, "DisplayVersion")[0]
            except OSError:
                ver = ""
            os_name = ("Windows 11 " if build >= 22000 else "Windows 10 ") + ver + " (build %d)" % build
        except (OSError, ValueError):
            pass
        rc, out = ps("(Get-CimInstance Win32_VideoController).Name")
        gpus = [l.strip() for l in out.splitlines() if l.strip()] if rc == 0 else []
    freq = psutil.cpu_freq()
    mode = current_mode()
    return {"cpu": cpu, "cores": psutil.cpu_count(logical=False), "threads": psutil.cpu_count(),
            "max_mhz": round(freq.max) if freq and freq.max else None,
            "ram_gb": round(psutil.virtual_memory().total / 1024 ** 3), "gpus": gpus or ["Unknown GPU"],
            "os": os_name, "display": ("%d×%d @ %d Hz" % tuple(mode)) if mode else "—"}


def _read_temp() -> Optional[float]:
    """ACPI thermal zone in °C; many PCs don't expose it, then None."""
    if not IS_WIN:
        return None
    rc, out = ps("(Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature "
                 "-ErrorAction Stop | Measure-Object CurrentTemperature -Maximum).Maximum", timeout=10)
    try:
        k = float(out.strip().splitlines()[-1])
        c = k / 10 - 273.15
        return round(c, 1) if 0 < c < 120 else None
    except (ValueError, IndexError):
        return None


def list_schemes() -> List[str]:
    rc, out = run(["powercfg", "/list"])
    return [g.lower() for g in GUID_RE.findall(out)] if rc == 0 else []


def active_scheme() -> Optional[str]:
    rc, out = run(["powercfg", "/getactivescheme"])
    m = GUID_RE.search(out) if rc == 0 else None
    return m.group(1).lower() if m else None


def duplicate_scheme(base: str) -> Optional[str]:
    rc, out = run(["powercfg", "-duplicatescheme", base])
    found = [g.lower() for g in GUID_RE.findall(out) if g.lower() != base.lower()] if rc == 0 else []
    return found[0] if found else None


def public_ip() -> str:
    try:
        with urllib.request.urlopen("https://api.ipify.org", timeout=5) as r:
            ip = r.read().decode().strip()
            return ip if re.fullmatch(r"[0-9a-fA-F:.]{3,45}", ip) else "—"
    except Exception:  # noqa: BLE001
        return "—"
