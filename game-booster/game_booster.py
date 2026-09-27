#!/usr/bin/env python3
"""
Game Booster — Performance optimizer with VPN manager.
Run via GameBooster.bat (auto-elevates to admin on Windows).
"""

import sys, os, ctypes, time, json, uuid, socket, subprocess
from typing import Optional, Dict, List

# ── Auto-install deps ──────────────────────────────────────────────────────────
def _ensure(*pairs):
    import importlib
    for pkg, mod in pairs:
        try:
            importlib.import_module(mod)
        except ImportError:
            print(f"Installing {pkg}…")
            os.system(f"{sys.executable} -m pip install {pkg} -q")

_ensure(("psutil", "psutil"), ("PyQt6", "PyQt6"))

import psutil
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QComboBox, QFrame, QSystemTrayIcon, QMenu,
    QScrollArea, QCheckBox, QProgressBar, QFileDialog, QDialog,
    QLineEdit, QFormLayout, QDialogButtonBox, QSizePolicy, QStackedWidget,
    QMessageBox,
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QPoint, QRect, QSize
from PyQt6.QtGui import (
    QColor, QPainter, QBrush, QPen, QFont, QIcon, QPixmap,
    QLinearGradient, QAction,
)

APP_DIR = os.path.dirname(os.path.abspath(__file__))
VPN_STORE = os.path.join(APP_DIR, "vpn_profiles.json")

# ══════════════════════════════════════════════════════════════════════════════
# THEME
# ══════════════════════════════════════════════════════════════════════════════

T = {
    "bg":      "#07070f",
    "card":    "#0e0e1c",
    "hover":   "#14142a",
    "input":   "#0b0b1a",
    "cyan":    "#00d4ff",
    "purple":  "#8b5cf6",
    "red":     "#f43f5e",
    "green":   "#10b981",
    "orange":  "#f59e0b",
    "fg":      "#f0f0ff",
    "fg2":     "#7a8bb0",
    "fg3":     "#3a4466",
    "border":  "#1e1e3a",
    "border2": "#2a2a50",
}

SS = f"""
* {{ font-family: 'Segoe UI', Arial, sans-serif; outline: none; }}
QMainWindow, QWidget {{ background: {T['bg']}; color: {T['fg']}; }}
QLabel {{ background: transparent; color: {T['fg']}; }}
QFrame {{ background: transparent; }}
QPushButton {{
    background: {T['card']}; color: {T['fg']};
    border: 1px solid {T['border2']}; border-radius: 8px;
    padding: 8px 18px; font-size: 13px;
}}
QPushButton:hover {{ background: {T['hover']}; border-color: {T['cyan']}; color: {T['cyan']}; }}
QPushButton:pressed {{ background: {T['cyan']}22; }}
QPushButton:disabled {{ color: {T['fg3']}; border-color: {T['border']}; }}
QComboBox {{
    background: {T['input']}; color: {T['fg']};
    border: 1px solid {T['border2']}; border-radius: 8px;
    padding: 8px 12px; font-size: 13px; min-height: 36px;
}}
QComboBox:hover {{ border-color: {T['cyan']}; }}
QComboBox QAbstractItemView {{
    background: {T['card']}; color: {T['fg']};
    border: 1px solid {T['border2']};
    selection-background-color: {T['cyan']}33;
    padding: 4px;
}}
QComboBox::drop-down {{ border: none; width: 24px; }}
QLineEdit {{
    background: {T['input']}; color: {T['fg']};
    border: 1px solid {T['border2']}; border-radius: 8px;
    padding: 8px 12px; font-size: 13px;
}}
QLineEdit:focus {{ border-color: {T['cyan']}; }}
QScrollBar:vertical {{
    background: {T['card']}; width: 4px; border-radius: 2px; margin: 0;
}}
QScrollBar::handle:vertical {{
    background: {T['border2']}; border-radius: 2px; min-height: 24px;
}}
QScrollBar::handle:vertical:hover {{ background: {T['cyan']}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QCheckBox {{ color: {T['fg']}; spacing: 8px; }}
QCheckBox::indicator {{
    width: 16px; height: 16px;
    border-radius: 4px; border: 1px solid {T['border2']};
    background: {T['input']};
}}
QCheckBox::indicator:checked {{ background: {T['cyan']}; border-color: {T['cyan']}; }}
QProgressBar {{
    background: {T['border']}; border: none;
    border-radius: 3px; max-height: 5px;
}}
QProgressBar::chunk {{
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0,
        stop:0 {T['cyan']}, stop:1 {T['purple']});
    border-radius: 3px;
}}
QMenu {{
    background: {T['card']}; border: 1px solid {T['border2']};
    color: {T['fg']}; padding: 4px; border-radius: 8px;
}}
QMenu::item {{ padding: 7px 20px; border-radius: 4px; }}
QMenu::item:selected {{ background: {T['cyan']}22; color: {T['cyan']}; }}
QScrollArea {{ background: transparent; border: none; }}
QDialog {{
    background: {T['card']};
    border: 1px solid {T['border2']};
    border-radius: 12px;
}}
"""

# ══════════════════════════════════════════════════════════════════════════════
# DATA
# ══════════════════════════════════════════════════════════════════════════════

BG_PROCS: Dict[str, tuple] = {   # exe → (label, category, kill_by_default)
    "chrome.exe":            ("Google Chrome",    "browser",       True),
    "msedge.exe":            ("Microsoft Edge",   "browser",       True),
    "firefox.exe":           ("Firefox",          "browser",       True),
    "opera.exe":             ("Opera",            "browser",       True),
    "brave.exe":             ("Brave",            "browser",       True),
    "discord.exe":           ("Discord",          "social",        True),
    "teams.exe":             ("MS Teams",         "social",        False),
    "slack.exe":             ("Slack",            "social",        True),
    "zoom.exe":              ("Zoom",             "social",        False),
    "skype.exe":             ("Skype",            "social",        True),
    "telegram.exe":          ("Telegram",         "social",        False),
    "spotify.exe":           ("Spotify",          "media",         True),
    "OneDrive.exe":          ("OneDrive",         "cloud",         True),
    "Dropbox.exe":           ("Dropbox",          "cloud",         True),
    "googledrivesync.exe":   ("Google Drive",     "cloud",         True),
    "SearchIndexer.exe":     ("Search Indexer",   "system",        True),
    "wuauclt.exe":           ("Windows Update",   "system",        False),
    "steam.exe":             ("Steam",            "launcher",      True),
    "EpicGamesLauncher.exe": ("Epic Games",       "launcher",      True),
    "upc.exe":               ("Ubisoft Connect",  "launcher",      True),
    "obs64.exe":             ("OBS Studio",       "other",         False),
    "Code.exe":              ("VS Code",          "other",         False),
}

CAT_COLOR = {
    "browser":  T["cyan"],   "social":   T["purple"],
    "media":    "#f97316",   "cloud":    T["green"],
    "launcher": T["orange"], "system":   T["red"],
    "other":    T["fg2"],
}

GAMES = [
    ("— Auto-Detect —",            ""),
    ("Counter-Strike 2",           "cs2.exe"),
    ("VALORANT",                   "VALORANT-Win64-Shipping.exe"),
    ("Apex Legends",               "r5apex.exe"),
    ("Fortnite",                   "FortniteClient-Win64-Shipping.exe"),
    ("Warzone",                    "ModernWarfare.exe"),
    ("Overwatch 2",                "Overwatch.exe"),
    ("Rainbow Six Siege",          "RainbowSix.exe"),
    ("League of Legends",          "League of Legends.exe"),
    ("Dota 2",                     "dota2.exe"),
    ("PUBG",                       "TslGame.exe"),
    ("Cyberpunk 2077",             "Cyberpunk2077.exe"),
    ("Elden Ring",                 "eldenring.exe"),
    ("The Witcher 3",              "witcher3.exe"),
    ("GTA V",                      "GTA5.exe"),
    ("Red Dead Redemption 2",      "RDR2.exe"),
    ("Rocket League",              "RocketLeague.exe"),
    ("Minecraft",                  "javaw.exe"),
    ("Browse for executable…",     "__browse__"),
]

VPN_TYPES = ["IKEv2", "L2TP/IPsec", "SSTP", "OpenVPN", "WireGuard"]

# ══════════════════════════════════════════════════════════════════════════════
# VPN ENGINE
# ══════════════════════════════════════════════════════════════════════════════

def _ping_ms(host: str, port: int = 443, timeout: float = 2.0) -> Optional[int]:
    """TCP connect latency in ms, or None on failure."""
    try:
        t0 = time.monotonic()
        s = socket.create_connection((host, port), timeout=timeout)
        s.close()
        return int((time.monotonic() - t0) * 1000)
    except Exception:
        try:
            t0 = time.monotonic()
            s = socket.create_connection((host, 80), timeout=timeout)
            s.close()
            return int((time.monotonic() - t0) * 1000)
        except Exception:
            return None


def _ps(cmd: str) -> str:
    """Run a PowerShell command, return stdout."""
    try:
        r = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", cmd],
            capture_output=True, text=True, timeout=15
        )
        return r.stdout.strip()
    except Exception as e:
        return str(e)


class VPNEngine:
    def __init__(self):
        self.profiles: List[Dict] = []
        self._active_id: Optional[str] = None
        self._openvpn_proc = None
        self._load()

    def _load(self):
        if os.path.exists(VPN_STORE):
            try:
                self.profiles = json.loads(open(VPN_STORE).read()).get("vpns", [])
            except Exception:
                self.profiles = []

    def _save(self):
        with open(VPN_STORE, "w") as f:
            json.dump({"vpns": self.profiles}, f, indent=2)

    def add(self, name: str, server: str, vpn_type: str,
            username: str = "", password: str = "",
            config_path: str = "") -> str:
        vid = str(uuid.uuid4())[:8]
        self.profiles.append({
            "id": vid, "name": name, "server": server,
            "type": vpn_type, "username": username,
            "config_path": config_path,
        })
        self._save()
        return vid

    def remove(self, vid: str):
        self.profiles = [p for p in self.profiles if p["id"] != vid]
        self._save()

    def connect(self, vid: str) -> tuple[bool, str]:
        """Connect a VPN. Returns (success, message)."""
        p = next((x for x in self.profiles if x["id"] == vid), None)
        if not p:
            return False, "Profile not found"

        vtype = p["type"]
        name  = p["name"]
        server = p["server"]

        try:
            if vtype in ("IKEv2", "L2TP/IPsec", "SSTP"):
                tunnel = {"IKEv2": "IKEv2", "L2TP/IPsec": "L2tp", "SSTP": "Sstp"}[vtype]
                # Register connection (idempotent)
                _ps(f'Add-VpnConnection -Name "{name}" -ServerAddress "{server}" '
                    f'-TunnelType {tunnel} -Force -PassThru 2>$null')
                if p.get("username") and p.get("username") != "":
                    out = _ps(f'rasdial "{name}" {p["username"]} {p.get("password","")}')
                else:
                    out = _ps(f'rasdial "{name}"')
                if "error" in out.lower() or "failed" in out.lower():
                    return False, out[:120]
                self._active_id = vid
                return True, "Connected"

            elif vtype == "OpenVPN":
                cfg = p.get("config_path", "")
                if not cfg or not os.path.exists(cfg):
                    return False, "OpenVPN config file not found"
                # Find openvpn.exe
                candidates = [
                    r"C:\Program Files\OpenVPN\bin\openvpn.exe",
                    r"C:\Program Files (x86)\OpenVPN\bin\openvpn.exe",
                    "openvpn",
                ]
                exe = next((c for c in candidates if os.path.exists(c)), "openvpn")
                self._openvpn_proc = subprocess.Popen(
                    [exe, "--config", cfg],
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                self._active_id = vid
                return True, "OpenVPN started"

            elif vtype == "WireGuard":
                cfg = p.get("config_path", "")
                if not cfg or not os.path.exists(cfg):
                    return False, "WireGuard config file not found"
                candidates = [
                    r"C:\Program Files\WireGuard\wireguard.exe",
                    "wireguard",
                ]
                exe = next((c for c in candidates if os.path.exists(c)), "wireguard")
                subprocess.Popen(
                    [exe, "/installtunnelservice", cfg],
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                self._active_id = vid
                return True, "WireGuard tunnel started"

        except Exception as ex:
            return False, str(ex)[:120]

        return False, "Unknown VPN type"

    def disconnect(self):
        """Disconnect the active VPN."""
        if not self._active_id:
            return
        p = next((x for x in self.profiles if x["id"] == self._active_id), None)
        if p:
            vtype = p["type"]
            if vtype in ("IKEv2", "L2TP/IPsec", "SSTP"):
                _ps(f'rasdial "{p["name"]}" /DISCONNECT')
            elif vtype == "OpenVPN" and self._openvpn_proc:
                self._openvpn_proc.terminate()
                self._openvpn_proc = None
            elif vtype == "WireGuard":
                cfg = p.get("config_path", "")
                if cfg:
                    tunnel_name = os.path.splitext(os.path.basename(cfg))[0]
                    _ps(f'wireguard /uninstalltunnelservice {tunnel_name}')
        self._active_id = None

    @property
    def active_id(self):
        return self._active_id


# ══════════════════════════════════════════════════════════════════════════════
# BOOST ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class BoostEngine:
    def __init__(self):
        self.is_boosting = False
        self._killed: List[Dict] = []
        self._game_pid: Optional[int] = None

    def get_bg_procs(self) -> List[Dict]:
        out, seen = [], set()
        for p in psutil.process_iter(["pid", "name", "memory_info"]):
            try:
                nl = p.info["name"].lower()
                if nl in seen:
                    continue
                for exe, (label, cat, default) in BG_PROCS.items():
                    if exe.lower() == nl:
                        seen.add(nl)
                        out.append({
                            "pid": p.info["pid"], "exe": exe, "label": label,
                            "cat": cat, "mem": p.info["memory_info"].rss / 1024**2,
                            "default": default,
                        })
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return out

    def detect_game(self) -> Optional[str]:
        names = {p.info["name"].lower() for p in psutil.process_iter(["name"])}
        for _, exe in GAMES:
            if exe and exe not in ("__browse__",) and exe.lower() in names:
                return exe
        return None

    def _priority(self, pid: int, level: str):
        try:
            pmap = {"high": -10, "realtime": -20, "normal": 0, "low": 19}
            psutil.Process(pid).nice(pmap.get(level, 0))
        except Exception:
            pass

    def boost(self, game_exe: str, pids: List[int], level: int) -> Dict:
        self.is_boosting = True
        killed = lowered = 0
        mem_freed = 0.0
        for pid in pids:
            try:
                proc = psutil.Process(pid)
                mem = proc.memory_info().rss / 1024**2
                if level >= 2:
                    try:
                        self._killed.append({"exe": proc.exe(), "cmdline": proc.cmdline(), "name": proc.name()})
                    except Exception:
                        pass
                    proc.terminate()
                    killed += 1; mem_freed += mem
                else:
                    self._priority(pid, "low")
                    lowered += 1; mem_freed += mem * 0.15
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        game_found = False
        if game_exe:
            for p in psutil.process_iter(["pid", "name"]):
                try:
                    if p.info["name"].lower() == game_exe.lower():
                        self._game_pid = p.info["pid"]
                        self._priority(self._game_pid, "realtime" if level == 3 else "high")
                        game_found = True; break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

        return {"killed": killed, "lowered": lowered, "mem_freed": mem_freed, "game_found": game_found}

    def unboost(self) -> int:
        self.is_boosting = False
        if self._game_pid:
            self._priority(self._game_pid, "normal")
            self._game_pid = None
        restarted = 0
        for info in self._killed:
            try:
                if info.get("exe") and os.path.exists(info["exe"]):
                    subprocess.Popen(info["cmdline"])
                    restarted += 1
            except Exception:
                pass
        self._killed.clear()
        return restarted

    def sys_stats(self) -> Dict:
        vm = psutil.virtual_memory()
        return {"cpu": psutil.cpu_percent(), "ram_pct": vm.percent,
                "ram_used": vm.used / 1024**3, "ram_avail": vm.available / 1024**3}


# ══════════════════════════════════════════════════════════════════════════════
# BACKGROUND THREADS
# ══════════════════════════════════════════════════════════════════════════════

class StatsThread(QThread):
    stats_ready = pyqtSignal(dict)
    procs_ready = pyqtSignal(list)

    def __init__(self, engine: BoostEngine):
        super().__init__()
        self._e = engine
        self._go = True

    def run(self):
        while self._go:
            self.stats_ready.emit(self._e.sys_stats())
            if not self._e.is_boosting:
                self.procs_ready.emit(self._e.get_bg_procs())
            time.sleep(2)

    def stop(self): self._go = False


class PingThread(QThread):
    done = pyqtSignal(str, object)   # vpn_id, ms_or_None

    def __init__(self, vid: str, host: str):
        super().__init__()
        self._vid = vid; self._host = host

    def run(self):
        self.done.emit(self._vid, _ping_ms(self._host))


# ══════════════════════════════════════════════════════════════════════════════
# CUSTOM WIDGETS
# ══════════════════════════════════════════════════════════════════════════════

def _card(radius: int = 12) -> QFrame:
    f = QFrame()
    f.setStyleSheet(f"""
        QFrame {{
            background: {T['card']};
            border: 1px solid {T['border2']};
            border-radius: {radius}px;
        }}
    """)
    return f


def _label(text: str, size: int = 13, color: str = T["fg"],
           bold: bool = False, spacing: str = "") -> QLabel:
    l = QLabel(text)
    style = f"color:{color}; font-size:{size}px;"
    if bold:   style += " font-weight:bold;"
    if spacing: style += f" letter-spacing:{spacing};"
    l.setStyleSheet(style)
    return l


class NavButton(QPushButton):
    def __init__(self, text: str, parent=None):
        super().__init__(text, parent)
        self._active = False
        self.setMinimumHeight(40)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._refresh()

    def set_active(self, v: bool):
        self._active = v
        self._refresh()

    def _refresh(self):
        if self._active:
            self.setStyleSheet(f"""
                QPushButton {{
                    background: {T['cyan']}18; color: {T['cyan']};
                    border: 1px solid {T['cyan']}44; border-radius: 8px;
                    padding: 8px 20px; font-size: 13px; font-weight: bold;
                    letter-spacing: 1px;
                }}
            """)
        else:
            self.setStyleSheet(f"""
                QPushButton {{
                    background: transparent; color: {T['fg2']};
                    border: 1px solid transparent; border-radius: 8px;
                    padding: 8px 20px; font-size: 13px;
                }}
                QPushButton:hover {{
                    background: {T['hover']}; color: {T['fg']};
                    border-color: {T['border2']};
                }}
            """)


class BoostButton(QPushButton):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._active = False
        self._t = 0.0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)
        self.setMinimumHeight(58)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setText("⚡   START BOOST")

    def set_active(self, v: bool):
        self._active = v
        if v:
            self._timer.start(28)
            self.setText("⚡   BOOSTING  ·  CLICK TO STOP")
        else:
            self._timer.stop(); self._t = 0.0
            self.setText("⚡   START BOOST")
        self.update()

    def _tick(self):
        self._t = (self._t + 0.022) % 1.0
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        r = self.rect().adjusted(3, 3, -3, -3)

        if self._active:
            pulse = abs(self._t * 2 - 1)
            for i in range(4, 0, -1):
                g = QColor(T["cyan"]); g.setAlpha(int(12 * i * (0.3 + 0.7 * pulse)))
                p.setPen(QPen(g, i * 2)); p.drawRoundedRect(r.adjusted(-i,-i,i,i), 12, 12)
            grad = QLinearGradient(0, 0, self.width(), 0)
            c1 = QColor(T["cyan"]); c1.setAlpha(55)
            c2 = QColor(T["purple"]); c2.setAlpha(55)
            grad.setColorAt(0, c1); grad.setColorAt(1, c2)
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(T["cyan"]), 1))
            tc = T["cyan"]
        else:
            col = T["hover"] if self.underMouse() else T["card"]
            border = T["cyan"] if self.underMouse() else T["border2"]
            p.setBrush(QBrush(QColor(col)))
            p.setPen(QPen(QColor(border), 1))
            tc = T["fg"]

        p.drawRoundedRect(r, 12, 12)
        p.setPen(QPen(QColor(tc)))
        p.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        p.drawText(r, Qt.AlignmentFlag.AlignCenter, self.text())


class BoostMeter(QWidget):
    _COLORS = ["", T["cyan"], T["purple"], T["red"]]
    _LABELS = ["", "LIGHT", "MEDIUM", "EXTREME"]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._level = 1; self._t = 0.0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)
        self._timer.start(30)
        self.setMinimumHeight(52)

    def set_level(self, v: int): self._level = max(0, min(3, v)); self.update()
    def _tick(self): self._t = (self._t + 0.02) % 1.0; self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        ty = h // 2 - 4

        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(QBrush(QColor(T["border"])))
        p.drawRoundedRect(0, ty, w, 8, 4, 4)

        if self._level > 0:
            fw = int(w * self._level / 3)
            grad = QLinearGradient(0, 0, fw, 0)
            grad.setColorAt(0, QColor(T["cyan"]))
            grad.setColorAt(1, QColor(self._COLORS[self._level]))
            p.setBrush(QBrush(grad))
            p.drawRoundedRect(0, ty, fw, 8, 4, 4)

            pulse = abs(self._t * 2 - 1)
            dc = QColor(self._COLORS[self._level])
            for i in range(3, 0, -1):
                g = QColor(dc); g.setAlpha(int(28 * i * (0.4 + 0.6 * pulse)))
                p.setBrush(QBrush(g))
                p.drawEllipse(QPoint(fw, ty + 4), 3 + i * 2, 3 + i * 2)
            p.setBrush(QBrush(dc))
            p.drawEllipse(QPoint(fw, ty + 4), 5, 5)

        for i in range(1, 4):
            x = int(w * i / 3)
            active = i <= self._level
            p.setPen(QPen(QColor(self._COLORS[i] if active else T["fg3"])))
            f = QFont("Segoe UI", 8)
            if active and i == self._level: f.setBold(True)
            p.setFont(f)
            p.drawText(QRect(x - 36, ty + 14, 72, 18),
                       Qt.AlignmentFlag.AlignCenter, self._LABELS[i])


class ProcessRow(QWidget):
    toggled = pyqtSignal(int, bool)

    def __init__(self, info: Dict, checked: bool, parent=None):
        super().__init__(parent)
        self._pid = info["pid"]
        h = QHBoxLayout(self)
        h.setContentsMargins(12, 0, 12, 0); h.setSpacing(10)
        self.setFixedHeight(42)
        self.setStyleSheet(f"""
            QWidget {{ background: {T['input']}; border-radius: 8px; }}
            QWidget:hover {{ background: {T['hover']}; }}
        """)
        cb = QCheckBox(); cb.setChecked(checked)
        cb.stateChanged.connect(lambda s: self.toggled.emit(self._pid, bool(s)))
        h.addWidget(cb)

        dot = QLabel("●")
        dot.setStyleSheet(f"color:{CAT_COLOR.get(info['cat'],T['fg3'])}; font-size:9px;")
        h.addWidget(dot)

        nm = QLabel(info["label"])
        nm.setStyleSheet(f"font-size:13px; color:{T['fg']};")
        h.addWidget(nm, 1)

        mem = QLabel(f"{info['mem']:.0f} MB")
        mem.setStyleSheet(f"font-size:11px; color:{T['fg2']};")
        h.addWidget(mem)

        tag = QLabel("FREE")
        tag.setStyleSheet(f"font-size:10px; font-weight:bold; color:{T['green']};")
        h.addWidget(tag)


class VPNCard(QWidget):
    connect_clicked    = pyqtSignal(str)
    disconnect_clicked = pyqtSignal(str)
    remove_clicked     = pyqtSignal(str)

    def __init__(self, profile: Dict, is_active: bool = False, ping: Optional[int] = None, parent=None):
        super().__init__(parent)
        self._vid = profile["id"]
        self._active = is_active
        self._build(profile, ping)

    def _build(self, p: Dict, ping: Optional[int]):
        self.setStyleSheet(f"""
            QWidget {{
                background: {T['card']};
                border: 1px solid {T['border2']};
                border-radius: 10px;
            }}
        """)
        if self._active:
            self.setStyleSheet(f"""
                QWidget {{
                    background: {T['card']};
                    border: 1px solid {T['cyan']}55;
                    border-radius: 10px;
                }}
            """)
        h = QHBoxLayout(self)
        h.setContentsMargins(16, 12, 16, 12); h.setSpacing(14)
        self.setFixedHeight(64)

        # Status dot
        dot_col = T["green"] if self._active else T["fg3"]
        dot = QLabel("●")
        dot.setStyleSheet(f"color:{dot_col}; font-size:11px;")
        h.addWidget(dot)

        # Info
        info = QVBoxLayout(); info.setSpacing(2)
        name_lbl = QLabel(p["name"])
        name_lbl.setStyleSheet(f"color:{T['fg']}; font-size:13px; font-weight:bold;")
        info.addWidget(name_lbl)

        ping_str = f"{ping} ms" if ping is not None else "—"
        ping_col = T["green"] if ping and ping < 60 else (T["orange"] if ping and ping < 120 else T["red"]) if ping else T["fg3"]
        sub = QLabel(f"{p['type']}  ·  {p['server']}  ·  {ping_str}")
        sub.setStyleSheet(f"color:{T['fg2']}; font-size:11px;")
        info.addWidget(sub)
        h.addLayout(info, 1)

        # Ping color dot
        if ping is not None:
            pdot = QLabel("●")
            pdot.setStyleSheet(f"color:{ping_col}; font-size:11px;")
            h.addWidget(pdot)

        # Buttons
        if self._active:
            dc = QPushButton("Disconnect")
            dc.setStyleSheet(f"""
                QPushButton {{
                    background: {T['red']}18; color: {T['red']};
                    border: 1px solid {T['red']}44; border-radius: 7px;
                    padding: 6px 14px; font-size: 12px;
                }}
                QPushButton:hover {{ background: {T['red']}33; }}
            """)
            dc.clicked.connect(lambda: self.disconnect_clicked.emit(self._vid))
            h.addWidget(dc)
        else:
            cc = QPushButton("Connect")
            cc.setStyleSheet(f"""
                QPushButton {{
                    background: {T['cyan']}18; color: {T['cyan']};
                    border: 1px solid {T['cyan']}44; border-radius: 7px;
                    padding: 6px 14px; font-size: 12px;
                }}
                QPushButton:hover {{ background: {T['cyan']}33; }}
            """)
            cc.clicked.connect(lambda: self.connect_clicked.emit(self._vid))
            h.addWidget(cc)

            rm = QPushButton("✕")
            rm.setFixedSize(30, 30)
            rm.setStyleSheet(f"""
                QPushButton {{
                    background: transparent; color: {T['fg3']};
                    border: 1px solid {T['border2']}; border-radius: 7px;
                    font-size: 12px; padding: 0;
                }}
                QPushButton:hover {{ color: {T['red']}; border-color: {T['red']}55; }}
            """)
            rm.clicked.connect(lambda: self.remove_clicked.emit(self._vid))
            h.addWidget(rm)


# ══════════════════════════════════════════════════════════════════════════════
# ADD VPN DIALOG
# ══════════════════════════════════════════════════════════════════════════════

class AddVPNDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add VPN")
        self.setModal(True)
        self.setMinimumWidth(420)
        self.setStyleSheet(SS + f"""
            QDialog {{
                background: {T['card']};
                border: 1px solid {T['border2']};
                border-radius: 14px;
            }}
            QFormLayout QLabel {{ color: {T['fg2']}; font-size: 12px; }}
        """)
        self._cfg_path = ""
        self._build()

    def _build(self):
        v = QVBoxLayout(self)
        v.setContentsMargins(28, 24, 28, 24); v.setSpacing(16)

        title = _label("Add VPN Profile", 16, T["fg"], bold=True)
        v.addWidget(title)

        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(f"background: {T['border2']}; max-height: 1px;")
        v.addWidget(sep)

        form = QFormLayout(); form.setSpacing(12); form.setLabelAlignment(Qt.AlignmentFlag.AlignRight)

        def field(placeholder=""):
            e = QLineEdit(); e.setPlaceholderText(placeholder)
            return e

        self.name_e   = field("e.g. My Gaming VPN")
        self.server_e = field("e.g. vpn.example.com")
        self.user_e   = field("(optional)")
        self.pass_e   = field("(optional)")
        self.pass_e.setEchoMode(QLineEdit.EchoMode.Password)

        self.type_c = QComboBox()
        for t in VPN_TYPES: self.type_c.addItem(t)
        self.type_c.currentTextChanged.connect(self._on_type)

        form.addRow("Name",     self.name_e)
        form.addRow("Server",   self.server_e)
        form.addRow("Type",     self.type_c)
        form.addRow("Username", self.user_e)
        form.addRow("Password", self.pass_e)
        v.addLayout(form)

        # Config file import (shown for OpenVPN/WireGuard)
        self._cfg_row = QWidget()
        cr = QHBoxLayout(self._cfg_row); cr.setContentsMargins(0,0,0,0)
        self._cfg_lbl = QLabel("No file selected")
        self._cfg_lbl.setStyleSheet(f"color:{T['fg3']}; font-size:12px;")
        browse_btn = QPushButton("📂  Browse")
        browse_btn.setFixedWidth(110)
        browse_btn.clicked.connect(self._browse_cfg)
        cr.addWidget(self._cfg_lbl, 1)
        cr.addWidget(browse_btn)
        form.addRow("Config file", self._cfg_row)
        self._cfg_row.hide()

        # Buttons
        btns = QHBoxLayout(); btns.setSpacing(10)
        cancel = QPushButton("Cancel"); cancel.clicked.connect(self.reject)
        add    = QPushButton("Add VPN")
        add.setStyleSheet(f"""
            QPushButton {{
                background: {T['cyan']}22; color: {T['cyan']};
                border: 1px solid {T['cyan']}55; border-radius: 8px;
                padding: 9px 24px; font-size: 13px; font-weight: bold;
            }}
            QPushButton:hover {{ background: {T['cyan']}44; }}
        """)
        add.clicked.connect(self._accept)
        btns.addStretch(); btns.addWidget(cancel); btns.addWidget(add)
        v.addLayout(btns)

    def _on_type(self, t: str):
        needs_file = t in ("OpenVPN", "WireGuard")
        # Show/hide config row label
        layout = self.layout().itemAt(3).layout()  # form layout
        for r in range(layout.rowCount()):
            item = layout.itemAt(r, QFormLayout.ItemRole.LabelRole)
            if item and item.widget() and item.widget().text() == "Config file":
                item.widget().setVisible(needs_file)
        self._cfg_row.setVisible(needs_file)
        needs_creds = t not in ("OpenVPN", "WireGuard")
        self.user_e.setEnabled(needs_creds)
        self.pass_e.setEnabled(needs_creds)

    def _browse_cfg(self):
        t = self.type_c.currentText()
        if t == "OpenVPN":
            f, _ = QFileDialog.getOpenFileName(self, "Select .ovpn file", "", "OpenVPN (*.ovpn)")
        else:
            f, _ = QFileDialog.getOpenFileName(self, "Select .conf file", "", "WireGuard (*.conf)")
        if f:
            self._cfg_path = f
            self._cfg_lbl.setText(os.path.basename(f))
            self._cfg_lbl.setStyleSheet(f"color:{T['fg']}; font-size:12px;")

    def _accept(self):
        if not self.name_e.text().strip() or not self.server_e.text().strip():
            self.name_e.setStyleSheet(f"border-color:{T['red']};")
            return
        self.accept()

    def result_data(self) -> Dict:
        return {
            "name":     self.name_e.text().strip(),
            "server":   self.server_e.text().strip(),
            "type":     self.type_c.currentText(),
            "username": self.user_e.text().strip(),
            "password": self.pass_e.text(),
            "config":   self._cfg_path,
        }


# ══════════════════════════════════════════════════════════════════════════════
# PAGES
# ══════════════════════════════════════════════════════════════════════════════

class BoostPage(QWidget):
    def __init__(self, engine: BoostEngine, tray: QSystemTrayIcon, parent=None):
        super().__init__(parent)
        self._engine = engine
        self._tray   = tray
        self._boosting = False
        self._level    = 1
        self._game_exe = ""
        self._sel: Dict[int, bool] = {}
        self._build()

    def _build(self):
        v = QVBoxLayout(self)
        v.setContentsMargins(28, 24, 28, 24); v.setSpacing(14)

        # Game selector
        gc = _card()
        gh = QHBoxLayout(gc); gh.setContentsMargins(18,14,18,14)
        gh.addWidget(_label("🎮", 16))
        gh.addWidget(_label("Game", 12, T["fg2"], spacing="2px"))
        gh.addSpacing(6)

        self._game_combo = QComboBox()
        for name, exe in GAMES: self._game_combo.addItem(name, exe)
        self._game_combo.currentIndexChanged.connect(self._on_game)
        gh.addWidget(self._game_combo, 1)

        db = QPushButton("Detect")
        db.setFixedWidth(80)
        db.clicked.connect(self._detect)
        gh.addWidget(db)
        v.addWidget(gc)

        # Level card
        lc = _card()
        lv = QVBoxLayout(lc); lv.setContentsMargins(18,14,18,14); lv.setSpacing(10)

        lh = QHBoxLayout()
        lh.addWidget(_label("Boost Intensity", 12, T["fg2"], spacing="2px"))
        lh.addStretch()
        self._badge = _label("LIGHT", 12, T["cyan"], bold=True)
        self._badge.setStyleSheet(f"""
            color:{T['cyan']}; font-size:12px; font-weight:bold;
            padding:2px 10px; background:{T['cyan']}18;
            border:1px solid {T['cyan']}44; border-radius:10px;
        """)
        lh.addWidget(self._badge)
        lv.addLayout(lh)

        br = QHBoxLayout(); br.setSpacing(8)
        self._lvl_btns = []
        for lvl, nm, col, desc in [
            (1, "LIGHT",   T["cyan"],   "Lower priority of background apps"),
            (2, "MEDIUM",  T["purple"], "Terminate non-essential processes"),
            (3, "EXTREME", T["red"],    "Kill everything except the game"),
        ]:
            b = QPushButton(nm)
            b.setMinimumHeight(34)
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.setProperty("l", lvl); b.setProperty("c", col)
            b.clicked.connect(lambda _, l=lvl: self._set_level(l))
            self._lvl_btns.append(b)
            br.addWidget(b)
        lv.addLayout(br)

        self._meter = BoostMeter()
        lv.addWidget(self._meter)

        self._desc = _label("Lower priority of background apps", 11, T["fg3"])
        lv.addWidget(self._desc)
        v.addWidget(lc)

        # Process list
        pc = _card()
        pv = QVBoxLayout(pc); pv.setContentsMargins(18,14,18,14); pv.setSpacing(10)

        ph = QHBoxLayout()
        ph.addWidget(_label("Background Processes", 12, T["fg2"], spacing="2px"))
        ph.addStretch()
        self._proc_cnt = _label("Scanning…", 11, T["fg3"])
        ph.addWidget(self._proc_cnt)
        pv.addLayout(ph)

        scroll = QScrollArea(); scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setMinimumHeight(120); scroll.setMaximumHeight(190)
        self._proc_box = QWidget(); self._proc_box.setStyleSheet("background:transparent;")
        self._proc_vbox = QVBoxLayout(self._proc_box)
        self._proc_vbox.setSpacing(4); self._proc_vbox.setContentsMargins(0,0,0,0)
        self._proc_vbox.addStretch()
        scroll.setWidget(self._proc_box)
        pv.addWidget(scroll)

        self._mem_lbl = _label("Select processes above to estimate savings", 11, T["green"])
        pv.addWidget(self._mem_lbl)
        v.addWidget(pc, 1)

        # Boost button
        self._btn = BoostButton()
        self._btn.clicked.connect(self._toggle)
        v.addWidget(self._btn)

        self._set_level(1)

    # ── slots ──────────────────────────────────────────────────────────────────

    def on_procs(self, procs: List[Dict]):
        while self._proc_vbox.count() > 1:
            item = self._proc_vbox.takeAt(0)
            if item.widget(): item.widget().deleteLater()

        for info in procs:
            pid = info["pid"]
            if pid not in self._sel: self._sel[pid] = info["default"]
            row = ProcessRow(info, self._sel.get(pid, False))
            row.toggled.connect(self._on_toggle)
            self._proc_vbox.insertWidget(self._proc_vbox.count() - 1, row)

        n = len(procs)
        self._proc_cnt.setText(f"{n} running" if n else "None detected")
        if n == 0:
            e = _label("No known background apps detected", 12, T["fg3"])
            e.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self._proc_vbox.insertWidget(0, e)
        self._refresh_mem()

    def _on_game(self, idx: int):
        exe = self._game_combo.itemData(idx)
        if exe == "__browse__":
            path, _ = QFileDialog.getOpenFileName(self, "Select game .exe", "", "Executables (*.exe)")
            if path:
                n = os.path.basename(path)
                self._game_combo.insertItem(1, f"Custom: {n}", n)
                self._game_combo.setCurrentIndex(1)
            else:
                self._game_combo.setCurrentIndex(0)
        else:
            self._game_exe = exe or ""

    def _detect(self):
        found = self._engine.detect_game()
        if found:
            for i in range(self._game_combo.count()):
                if self._game_combo.itemData(i) == found:
                    self._game_combo.setCurrentIndex(i); return
            self._game_combo.insertItem(1, f"Detected: {found}", found)
            self._game_combo.setCurrentIndex(1)
        else:
            self._tray.showMessage("Game Booster", "No game detected — launch your game first.",
                                   QSystemTrayIcon.MessageIcon.Information, 2500)

    def _set_level(self, lvl: int):
        self._level = lvl
        cfgs = {1: ("LIGHT", T["cyan"], "Lower priority of background apps"),
                2: ("MEDIUM", T["purple"], "Terminate non-essential processes"),
                3: ("EXTREME", T["red"],   "Kill everything except the game")}
        nm, col, desc = cfgs[lvl]
        self._badge.setText(nm)
        self._badge.setStyleSheet(f"""
            color:{col}; font-size:12px; font-weight:bold;
            padding:2px 10px; background:{col}18;
            border:1px solid {col}44; border-radius:10px;
        """)
        self._desc.setText(desc)
        self._meter.set_level(lvl)
        for b in self._lvl_btns:
            l, c = b.property("l"), b.property("c")
            if l == lvl:
                b.setStyleSheet(f"""
                    QPushButton {{
                        background:{c}20; color:{c};
                        border:1px solid {c}; border-radius:8px;
                        font-weight:bold; font-size:12px;
                    }}
                """)
            else:
                b.setStyleSheet(f"""
                    QPushButton {{
                        background:{T['input']}; color:{T['fg3']};
                        border:1px solid {T['border2']}; border-radius:8px; font-size:12px;
                    }}
                    QPushButton:hover {{ border-color:{c}; color:{c}; }}
                """)

    def _on_toggle(self, pid: int, checked: bool):
        self._sel[pid] = checked
        self._refresh_mem()

    def _refresh_mem(self):
        total = 0.0
        for pid, kill in self._sel.items():
            if kill:
                try: total += psutil.Process(pid).memory_info().rss / 1024**2
                except Exception: pass
        self._mem_lbl.setText(
            f"~{total:.0f} MB will be freed on boost" if total > 0
            else "Select processes above to estimate savings"
        )

    def _toggle(self):
        if not self._boosting:
            pids = [pid for pid, k in self._sel.items() if k]
            r = self._engine.boost(self._game_exe, pids, self._level)
            self._boosting = True
            self._btn.set_active(True)
            msg = (f"Boost active! {r['killed']} closed, {r['lowered']} deprioritized, "
                   f"~{r['mem_freed']:.0f} MB freed")
            if r["game_found"]: msg += " · Game elevated"
            self._tray.showMessage("Game Booster", msg, QSystemTrayIcon.MessageIcon.Information, 3000)
            return r
        else:
            n = self._engine.unboost()
            self._boosting = False
            self._btn.set_active(False)
            self._tray.showMessage("Game Booster", f"Boost ended. {n} apps restarted.",
                                   QSystemTrayIcon.MessageIcon.Information, 2500)
            return None

    @property
    def boosting(self): return self._boosting

    def boost_color(self):
        return [None, T["cyan"], T["purple"], T["red"]][self._level]


class VPNPage(QWidget):
    status_changed = pyqtSignal(bool)   # True = connected

    def __init__(self, engine: VPNEngine, tray: QSystemTrayIcon, parent=None):
        super().__init__(parent)
        self._engine = engine
        self._tray   = tray
        self._pings: Dict[str, Optional[int]] = {}
        self._ping_threads: List[PingThread] = []
        self._build()
        self._reload()

    def _build(self):
        v = QVBoxLayout(self)
        v.setContentsMargins(28, 24, 28, 24); v.setSpacing(14)

        # Header row
        hdr = QHBoxLayout()
        hdr.addWidget(_label("VPN Manager", 15, T["fg"], bold=True, spacing="1px"))
        hdr.addStretch()
        add_btn = QPushButton("＋  Add VPN")
        add_btn.setStyleSheet(f"""
            QPushButton {{
                background: {T['cyan']}18; color: {T['cyan']};
                border: 1px solid {T['cyan']}44; border-radius: 8px;
                padding: 7px 16px; font-size: 12px; font-weight: bold;
            }}
            QPushButton:hover {{ background: {T['cyan']}33; }}
        """)
        add_btn.clicked.connect(self._add_vpn)
        hdr.addWidget(add_btn)
        v.addLayout(hdr)

        # Status banner
        self._banner = _card(10)
        bh = QHBoxLayout(self._banner); bh.setContentsMargins(18,12,18,12)
        self._banner_dot = QLabel("●")
        self._banner_dot.setStyleSheet(f"color:{T['fg3']}; font-size:13px;")
        bh.addWidget(self._banner_dot)
        self._banner_lbl = _label("Not connected", 13, T["fg2"])
        bh.addWidget(self._banner_lbl, 1)
        self._banner_detail = _label("", 11, T["fg3"])
        bh.addWidget(self._banner_detail)
        v.addWidget(self._banner)

        # VPN list
        scroll = QScrollArea(); scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        self._vpn_container = QWidget()
        self._vpn_container.setStyleSheet("background:transparent;")
        self._vpn_vbox = QVBoxLayout(self._vpn_container)
        self._vpn_vbox.setSpacing(8); self._vpn_vbox.setContentsMargins(0,0,0,0)
        self._vpn_vbox.addStretch()
        scroll.setWidget(self._vpn_container)
        v.addWidget(scroll, 1)

        # Help text
        help_lbl = _label(
            "Supports IKEv2 / L2TP / SSTP (Windows built-in),  OpenVPN (.ovpn),  WireGuard (.conf)",
            11, T["fg3"]
        )
        help_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        v.addWidget(help_lbl)

    def _reload(self):
        while self._vpn_vbox.count() > 1:
            item = self._vpn_vbox.takeAt(0)
            if item.widget(): item.widget().deleteLater()

        profiles = self._engine.profiles
        if not profiles:
            e = _label("No VPN profiles yet — click  ＋ Add VPN  to get started", 12, T["fg3"])
            e.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self._vpn_vbox.insertWidget(0, e)
            return

        for p in profiles:
            is_active = p["id"] == self._engine.active_id
            card = VPNCard(p, is_active, self._pings.get(p["id"]))
            card.connect_clicked.connect(self._connect)
            card.disconnect_clicked.connect(self._disconnect)
            card.remove_clicked.connect(self._remove)
            self._vpn_vbox.insertWidget(self._vpn_vbox.count() - 1, card)

            # Fire ping test if not done
            if p["id"] not in self._pings and p.get("server"):
                t = PingThread(p["id"], p["server"])
                t.done.connect(self._on_ping)
                t.start()
                self._ping_threads.append(t)

        self._update_banner()

    def _update_banner(self):
        aid = self._engine.active_id
        if aid:
            p = next((x for x in self._engine.profiles if x["id"] == aid), None)
            name = p["name"] if p else "Unknown"
            self._banner_dot.setStyleSheet(f"color:{T['green']}; font-size:13px;")
            self._banner_lbl.setText(f"Connected to  {name}")
            self._banner_lbl.setStyleSheet(f"color:{T['green']}; font-size:13px; font-weight:bold;")
            ping = self._pings.get(aid)
            self._banner_detail.setText(f"{ping} ms" if ping else "")
            self.status_changed.emit(True)
        else:
            self._banner_dot.setStyleSheet(f"color:{T['fg3']}; font-size:13px;")
            self._banner_lbl.setText("Not connected")
            self._banner_lbl.setStyleSheet(f"color:{T['fg2']}; font-size:13px;")
            self._banner_detail.setText("")
            self.status_changed.emit(False)

    def _on_ping(self, vid: str, ms):
        self._pings[vid] = ms
        self._reload()

    def _add_vpn(self):
        dlg = AddVPNDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            d = dlg.result_data()
            self._engine.add(d["name"], d["server"], d["type"],
                             d["username"], d["password"], d["config"])
            self._reload()

    def _connect(self, vid: str):
        ok, msg = self._engine.connect(vid)
        if ok:
            self._tray.showMessage("Game Booster VPN", f"Connected!", QSystemTrayIcon.MessageIcon.Information, 2500)
        else:
            QMessageBox.warning(self, "VPN Error", f"Could not connect:\n{msg}")
        self._reload()

    def _disconnect(self, _vid: str = ""):
        self._engine.disconnect()
        self._tray.showMessage("Game Booster VPN", "VPN disconnected.", QSystemTrayIcon.MessageIcon.Information, 2000)
        self._reload()

    def _remove(self, vid: str):
        if vid == self._engine.active_id:
            self._engine.disconnect()
        self._engine.remove(vid)
        self._pings.pop(vid, None)
        self._reload()


# ══════════════════════════════════════════════════════════════════════════════
# MAIN WINDOW
# ══════════════════════════════════════════════════════════════════════════════

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self._boost_engine = BoostEngine()
        self._vpn_engine   = VPNEngine()
        self._build_window()
        self._build_tray()
        self._thread = StatsThread(self._boost_engine)
        self._thread.stats_ready.connect(self._on_stats)
        self._thread.procs_ready.connect(self._boost_page.on_procs)
        self._thread.start()
        psutil.cpu_percent()   # seed

    def _build_window(self):
        self.setWindowTitle("Game Booster")
        self.setMinimumSize(980, 680)
        self.resize(1040, 730)
        self.setStyleSheet(SS)
        scr = QApplication.primaryScreen().availableGeometry()
        self.move((scr.width()-1040)//2, (scr.height()-730)//2)

        root = QWidget(); self.setCentralWidget(root)
        row = QHBoxLayout(root); row.setContentsMargins(0,0,0,0); row.setSpacing(0)
        row.addWidget(self._build_sidebar())
        row.addWidget(self._build_content(), 1)

    def _build_sidebar(self):
        side = QFrame()
        side.setFixedWidth(220)
        side.setStyleSheet(f"QFrame {{ background:{T['card']}; border-right:1px solid {T['border']}; }}")
        v = QVBoxLayout(side); v.setContentsMargins(0,0,0,0); v.setSpacing(0)

        # Logo
        logo = QWidget(); logo.setFixedHeight(76)
        logo.setStyleSheet(f"background:{T['card']}; border-bottom:1px solid {T['border']};")
        lv = QVBoxLayout(logo); lv.setContentsMargins(0,0,0,0)
        t1 = QLabel("⚡ GAME BOOSTER")
        t1.setAlignment(Qt.AlignmentFlag.AlignCenter)
        t1.setStyleSheet(f"color:{T['cyan']}; font-size:14px; font-weight:bold; letter-spacing:2px;")
        t2 = QLabel("Performance Optimizer")
        t2.setAlignment(Qt.AlignmentFlag.AlignCenter)
        t2.setStyleSheet(f"color:{T['fg3']}; font-size:10px;")
        lv.addWidget(t1); lv.addWidget(t2)
        v.addWidget(logo)

        # Status
        sw = QWidget()
        sv = QVBoxLayout(sw); sv.setContentsMargins(18,16,18,8)
        sv.addWidget(_label("STATUS", 10, T["fg3"], spacing="2px"))
        self._status_lbl = QLabel("● IDLE")
        self._status_lbl.setStyleSheet(f"color:{T['fg2']}; font-size:15px; font-weight:bold;")
        sv.addWidget(self._status_lbl)
        v.addWidget(sw)

        # Stats card
        sc = QFrame()
        sc.setStyleSheet(f"QFrame {{ background:{T['bg']}; border-radius:10px; margin:0 14px; }}")
        scv = QVBoxLayout(sc); scv.setContentsMargins(14,12,14,12); scv.setSpacing(6)
        scv.addWidget(_label("SYSTEM", 10, T["fg3"], spacing="2px"))
        self._cpu_lbl = QLabel("CPU   0%")
        self._cpu_lbl.setStyleSheet(f"color:{T['fg2']}; font-size:12px;")
        scv.addWidget(self._cpu_lbl)
        self._cpu_bar = QProgressBar(); self._cpu_bar.setRange(0,100)
        self._cpu_bar.setTextVisible(False); self._cpu_bar.setFixedHeight(4)
        scv.addWidget(self._cpu_bar)
        self._ram_lbl = QLabel("RAM   0%")
        self._ram_lbl.setStyleSheet(f"color:{T['fg2']}; font-size:12px;")
        scv.addWidget(self._ram_lbl)
        self._ram_bar = QProgressBar(); self._ram_bar.setRange(0,100)
        self._ram_bar.setTextVisible(False); self._ram_bar.setFixedHeight(4)
        scv.addWidget(self._ram_bar)
        v.addWidget(sc)

        v.addStretch()

        # Admin badge
        adm = QLabel("🔐  ADMIN MODE")
        adm.setAlignment(Qt.AlignmentFlag.AlignCenter)
        adm.setStyleSheet(f"""
            color:{T['green']}; font-size:10px; font-weight:bold;
            background:{T['bg']}; border-radius:6px;
            padding:7px; margin:0 14px 14px 14px;
        """)
        v.addWidget(adm)
        return side

    def _build_content(self):
        w = QWidget()
        v = QVBoxLayout(w); v.setContentsMargins(0,0,0,0); v.setSpacing(0)

        # Nav bar
        nav = QWidget()
        nav.setFixedHeight(60)
        nav.setStyleSheet(f"background:{T['bg']}; border-bottom:1px solid {T['border']};")
        nh = QHBoxLayout(nav); nh.setContentsMargins(28,10,28,10); nh.setSpacing(8)

        self._nav_boost = NavButton("⚡  Boost")
        self._nav_vpn   = NavButton("🔒  VPN")
        self._nav_boost.clicked.connect(lambda: self._switch(0))
        self._nav_vpn.clicked.connect(lambda: self._switch(1))
        nh.addWidget(self._nav_boost); nh.addWidget(self._nav_vpn); nh.addStretch()
        v.addWidget(nav)

        # Pages
        self._stack = QStackedWidget()
        self._boost_page = BoostPage(self._boost_engine, None)   # tray set after
        self._vpn_page   = VPNPage(self._vpn_engine,   None)
        self._vpn_page.status_changed.connect(self._on_vpn_status)
        self._stack.addWidget(self._boost_page)
        self._stack.addWidget(self._vpn_page)
        v.addWidget(self._stack, 1)

        self._switch(0)
        return w

    def _switch(self, idx: int):
        self._stack.setCurrentIndex(idx)
        self._nav_boost.set_active(idx == 0)
        self._nav_vpn.set_active(idx == 1)

    def _build_tray(self):
        px = QPixmap(64, 64); px.fill(Qt.GlobalColor.transparent)
        pr = QPainter(px)
        pr.setRenderHint(QPainter.RenderHint.Antialiasing)
        pr.setBrush(QBrush(QColor(T["cyan"]))); pr.setPen(Qt.PenStyle.NoPen)
        pr.drawEllipse(4, 4, 56, 56)
        pr.setPen(QPen(QColor("#000"), 1))
        pr.setFont(QFont("Arial", 28, QFont.Weight.Bold))
        pr.drawText(px.rect(), Qt.AlignmentFlag.AlignCenter, "⚡")
        pr.end()

        self._tray = QSystemTrayIcon(QIcon(px), self)
        m = QMenu()
        show_a  = QAction("Open Game Booster", self); show_a.triggered.connect(self._show)
        boost_a = QAction("⚡  Toggle Boost",   self); boost_a.triggered.connect(self._boost_page._toggle)
        quit_a  = QAction("Quit",               self); quit_a.triggered.connect(self._quit)
        m.addAction(show_a); m.addSeparator()
        m.addAction(boost_a); m.addSeparator(); m.addAction(quit_a)
        self._tray.setContextMenu(m)
        self._tray.activated.connect(
            lambda r: self._show() if r == QSystemTrayIcon.ActivationReason.DoubleClick else None)
        self._tray.setToolTip("Game Booster")
        self._tray.show()

        # Inject tray into pages
        self._boost_page._tray = self._tray
        self._vpn_page._tray   = self._tray

    def _on_stats(self, s: Dict):
        self._cpu_lbl.setText(f"CPU   {s['cpu']:.0f}%")
        self._ram_lbl.setText(f"RAM   {s['ram_pct']:.0f}%  ({s['ram_used']:.1f} GB)")
        self._cpu_bar.setValue(int(s["cpu"]))
        self._ram_bar.setValue(int(s["ram_pct"]))

        # Update status label from boost page
        if self._boost_page.boosting:
            col = self._boost_page.boost_color()
            self._status_lbl.setText("● BOOSTING")
            self._status_lbl.setStyleSheet(f"color:{col}; font-size:15px; font-weight:bold;")
        else:
            self._status_lbl.setText("● IDLE")
            self._status_lbl.setStyleSheet(f"color:{T['fg2']}; font-size:15px; font-weight:bold;")

    def _on_vpn_status(self, connected: bool):
        pass  # sidebar doesn't show VPN status separately, handled in page banner

    def _show(self):
        self.show(); self.raise_(); self.activateWindow()

    def closeEvent(self, e):
        e.ignore(); self.hide()
        self._tray.showMessage("Game Booster",
                               "Minimized to tray. Right-click the icon to quit.",
                               QSystemTrayIcon.MessageIcon.Information, 2000)

    def _quit(self):
        if self._boost_page.boosting: self._boost_page._toggle()
        if self._vpn_engine.active_id: self._vpn_engine.disconnect()
        self._thread.stop(); self._thread.wait(2000)
        QApplication.quit()


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN & ENTRY
# ══════════════════════════════════════════════════════════════════════════════

def is_admin() -> bool:
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin()) if sys.platform == "win32" else os.getuid() == 0
    except Exception:
        return False

def elevate():
    if sys.platform == "win32":
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable,
            " ".join(f'"{a}"' for a in sys.argv), None, 1)
    else:
        os.execvp("sudo", ["sudo", sys.executable] + sys.argv)


if __name__ == "__main__":
    if not is_admin():
        choice = input("Game Booster needs admin rights.\nRelaunch as administrator? [Y/n]: ").strip().lower()
        if choice in ("", "y", "yes"):
            elevate(); sys.exit(0)
        print("Continuing without admin — some features will be limited.\n")

    app = QApplication(sys.argv)
    app.setApplicationName("Game Booster")
    app.setQuitOnLastWindowClosed(False)

    win = MainWindow()
    win.show()
    sys.exit(app.exec())
