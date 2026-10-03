"""FRXST system engine: real Windows tweaks behind the FRXST desktop app.

Everything the engine changes is recorded and undone by unboost()/shutdown().
No GUI imports here so it can be smoke-tested on its own.
"""

import ctypes
import json
import os
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
        self._stop = threading.Event()
        psutil.cpu_percent(None)
        threading.Thread(target=self._ping_loop, daemon=True).start()
        self.user_plan = self.plan_id_of(self.original_scheme) if self.original_scheme else "balanced"
        if self.user_plan == "other":
            self.user_plan = "balanced"
        if self.user_plan == "frxst":
            self._timer(True, "plan")

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
        reopened = []
        for info in self._closed:
            try:
                if info["exe"] and os.path.exists(info["exe"]):
                    subprocess.Popen(info["cmd"] or [info["exe"]], creationflags=NO_WINDOW)
                    reopened.append(info["label"])
            except OSError:
                pass
        self._closed = []
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
        return {"ok": True, "restored": restored}

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
        with self.lock:
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
        with self.lock:
            self._vpn_disconnect_locked()
        return {"ok": True}

    # ── lifecycle ──
    def shutdown(self):
        with self.lock:
            if self.boosting:
                self._unboost_locked()
            self._vpn_disconnect_locked()
            self._timer(False, "plan")
            self._timer(False, "ultra")
        self._stop.set()


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
