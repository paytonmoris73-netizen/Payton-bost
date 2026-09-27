#!/usr/bin/env python3
"""
Game Booster - Maximize gaming performance by managing system resources
Requires admin privileges to control process priorities and kill background apps.
"""

import sys
import os
import ctypes
import time
import subprocess
from typing import Optional, Dict, List

# ── Auto-install missing packages ──────────────────────────────────────────────
def _ensure(*packages):
    import importlib
    for pkg, import_name in packages:
        try:
            importlib.import_module(import_name)
        except ImportError:
            print(f"Installing {pkg}...")
            os.system(f"{sys.executable} -m pip install {pkg} -q")

_ensure(("psutil", "psutil"), ("PyQt6", "PyQt6"))

import psutil
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QComboBox, QFrame, QSystemTrayIcon, QMenu,
    QScrollArea, QCheckBox, QProgressBar, QFileDialog
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QPoint, QRect
from PyQt6.QtGui import (
    QColor, QPainter, QBrush, QPen, QFont, QIcon, QPixmap,
    QLinearGradient, QAction
)

# ══════════════════════════════════════════════════════════════════════════════
# PROCESS DATABASE
# ══════════════════════════════════════════════════════════════════════════════

# (exe_name, display_name, category, kill_by_default)
BACKGROUND_PROCESSES: Dict[str, tuple] = {
    "chrome.exe":              ("Google Chrome",      "browser",       True),
    "msedge.exe":              ("Microsoft Edge",     "browser",       True),
    "firefox.exe":             ("Firefox",            "browser",       True),
    "opera.exe":               ("Opera",              "browser",       True),
    "brave.exe":               ("Brave Browser",      "browser",       True),
    "discord.exe":             ("Discord",            "communication", True),
    "teams.exe":               ("MS Teams",           "communication", False),
    "slack.exe":               ("Slack",              "communication", True),
    "zoom.exe":                ("Zoom",               "communication", False),
    "skype.exe":               ("Skype",              "communication", True),
    "telegram.exe":            ("Telegram",           "communication", False),
    "spotify.exe":             ("Spotify",            "media",         True),
    "vlc.exe":                 ("VLC Player",         "media",         False),
    "OneDrive.exe":            ("OneDrive",           "cloud",         True),
    "Dropbox.exe":             ("Dropbox",            "cloud",         True),
    "googledrivesync.exe":     ("Google Drive",       "cloud",         True),
    "Code.exe":                ("VS Code",            "dev",           False),
    "devenv.exe":              ("Visual Studio",      "dev",           False),
    "SearchIndexer.exe":       ("Search Indexer",     "system",        True),
    "wuauclt.exe":             ("Windows Update",     "system",        False),
    "Notion.exe":              ("Notion",             "other",         False),
    "obs64.exe":               ("OBS Studio",         "other",         False),
    "steam.exe":               ("Steam Client",       "launcher",      True),
    "EpicGamesLauncher.exe":   ("Epic Games",         "launcher",      True),
    "upc.exe":                 ("Ubisoft Connect",    "launcher",      True),
}

CATEGORY_COLORS: Dict[str, str] = {
    "browser":       "#00e5ff",
    "communication": "#7c3aed",
    "media":         "#ff6b35",
    "cloud":         "#00ff9d",
    "dev":           "#ff3366",
    "launcher":      "#ffcc00",
    "system":        "#ff6b6b",
    "other":         "#8899cc",
}

# (display_name, exe_name)
KNOWN_GAMES: List[tuple] = [
    ("— Auto-Detect —",               ""),
    ("Counter-Strike 2",              "cs2.exe"),
    ("VALORANT",                      "VALORANT-Win64-Shipping.exe"),
    ("Apex Legends",                  "r5apex.exe"),
    ("Fortnite",                      "FortniteClient-Win64-Shipping.exe"),
    ("Call of Duty: Warzone",         "ModernWarfare.exe"),
    ("Overwatch 2",                   "Overwatch.exe"),
    ("Rainbow Six Siege",             "RainbowSix.exe"),
    ("League of Legends",             "League of Legends.exe"),
    ("Dota 2",                        "dota2.exe"),
    ("PUBG",                          "TslGame.exe"),
    ("Cyberpunk 2077",                "Cyberpunk2077.exe"),
    ("Elden Ring",                    "eldenring.exe"),
    ("The Witcher 3",                 "witcher3.exe"),
    ("GTA V",                         "GTA5.exe"),
    ("Red Dead Redemption 2",         "RDR2.exe"),
    ("Skyrim SE",                     "SkyrimSE.exe"),
    ("Minecraft",                     "javaw.exe"),
    ("Rocket League",                 "RocketLeague.exe"),
    ("Browse for executable…",        "__browse__"),
]

# ══════════════════════════════════════════════════════════════════════════════
# THEME
# ══════════════════════════════════════════════════════════════════════════════

T = {
    "bg":       "#060611",
    "card":     "#0d0d1f",
    "hover":    "#151530",
    "input":    "#0a0a1e",
    "cyan":     "#00e5ff",
    "purple":   "#7c3aed",
    "red":      "#ff3366",
    "green":    "#00ff9d",
    "fg":       "#ffffff",
    "fg2":      "#8899cc",
    "fg3":      "#445577",
    "border":   "#1a1a3e",
}

STYLESHEET = f"""
* {{ font-family: 'Segoe UI', Arial, sans-serif; }}
QMainWindow, QWidget {{ background: {T['bg']}; color: {T['fg']}; }}
QLabel {{ background: transparent; color: {T['fg']}; }}
QPushButton {{
    background: {T['card']}; color: {T['fg']};
    border: 1px solid {T['border']}; border-radius: 8px;
    padding: 8px 16px; font-size: 13px;
}}
QPushButton:hover {{ background: {T['hover']}; border-color: {T['cyan']}; }}
QPushButton:pressed {{ background: {T['cyan']}33; }}
QComboBox {{
    background: {T['input']}; color: {T['fg']};
    border: 1px solid {T['border']}; border-radius: 8px;
    padding: 8px 12px; font-size: 13px; min-height: 40px;
}}
QComboBox:hover {{ border-color: {T['cyan']}; }}
QComboBox QAbstractItemView {{
    background: {T['card']}; color: {T['fg']};
    border: 1px solid {T['border']};
    selection-background-color: {T['cyan']}44;
}}
QComboBox::drop-down {{ border: none; width: 24px; }}
QScrollBar:vertical {{
    background: {T['card']}; width: 5px; border-radius: 2px;
}}
QScrollBar::handle:vertical {{
    background: {T['border']}; border-radius: 2px; min-height: 20px;
}}
QScrollBar::handle:vertical:hover {{ background: {T['cyan']}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QCheckBox {{ color: {T['fg']}; spacing: 8px; }}
QCheckBox::indicator {{
    width: 16px; height: 16px;
    border-radius: 4px; border: 1px solid {T['border']};
    background: {T['input']};
}}
QCheckBox::indicator:checked {{ background: {T['cyan']}; border-color: {T['cyan']}; }}
QProgressBar {{
    background: {T['border']}; border: none;
    border-radius: 3px; height: 6px;
}}
QProgressBar::chunk {{
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0,
        stop:0 {T['cyan']}, stop:1 {T['purple']});
    border-radius: 3px;
}}
QMenu {{
    background: {T['card']}; border: 1px solid {T['border']};
    color: {T['fg']}; padding: 4px;
}}
QMenu::item {{ padding: 6px 20px; border-radius: 4px; }}
QMenu::item:selected {{ background: {T['cyan']}33; }}
QScrollArea {{ background: transparent; border: none; }}
"""

# ══════════════════════════════════════════════════════════════════════════════
# BOOSTER ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class BoosterEngine:
    def __init__(self):
        self.is_boosting = False
        self._killed: List[Dict] = []   # info to restart later
        self._game_pid: Optional[int] = None

    def get_running_background(self) -> List[Dict]:
        results = []
        seen_names: set = set()
        for proc in psutil.process_iter(["pid", "name", "memory_info"]):
            try:
                name_lower = proc.info["name"].lower()
                if name_lower in seen_names:
                    continue
                for exe, (display, cat, default) in BACKGROUND_PROCESSES.items():
                    if exe.lower() == name_lower:
                        seen_names.add(name_lower)
                        mem = proc.info["memory_info"].rss / 1024 / 1024
                        results.append({
                            "pid":     proc.info["pid"],
                            "exe":     exe,
                            "display": display,
                            "cat":     cat,
                            "mem_mb":  mem,
                            "default": default,
                        })
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return results

    def detect_game(self) -> Optional[str]:
        running_names = {p.info["name"].lower() for p in psutil.process_iter(["name"])}
        for _, exe in KNOWN_GAMES:
            if exe and exe not in ("__browse__",) and exe.lower() in running_names:
                return exe
        return None

    def _set_priority(self, pid: int, level: str):
        try:
            p = psutil.Process(pid)
            map_ = {
                "realtime":     (getattr(psutil, "REALTIME_PRIORITY_CLASS",  -20)),
                "high":         (getattr(psutil, "HIGH_PRIORITY_CLASS",      -10)),
                "normal":       (getattr(psutil, "NORMAL_PRIORITY_CLASS",      0)),
                "low":          (getattr(psutil, "IDLE_PRIORITY_CLASS",       19)),
            }
            p.nice(map_[level])
        except Exception:
            pass

    def boost(self, game_exe: str, pids_to_affect: List[int], level: int) -> Dict:
        self.is_boosting = True
        killed = lowered = 0
        mem_freed = 0.0

        for pid in pids_to_affect:
            try:
                p = psutil.Process(pid)
                mem = p.memory_info().rss / 1024 / 1024
                if level >= 2:
                    # Save info to restart later
                    try:
                        info = {"exe": p.exe(), "cmdline": p.cmdline(), "name": p.name()}
                        self._killed.append(info)
                    except Exception:
                        pass
                    p.terminate()
                    killed += 1
                    mem_freed += mem
                else:
                    self._set_priority(pid, "low")
                    lowered += 1
                    mem_freed += mem * 0.1  # estimate headroom
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Elevate game process
        game_found = False
        if game_exe:
            for p in psutil.process_iter(["pid", "name"]):
                try:
                    if p.info["name"].lower() == game_exe.lower():
                        self._game_pid = p.info["pid"]
                        self._set_priority(self._game_pid, "realtime" if level == 3 else "high")
                        game_found = True
                        break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

        return {
            "killed":    killed,
            "lowered":   lowered,
            "mem_freed": mem_freed,
            "game_found": game_found,
        }

    def unboost(self) -> int:
        self.is_boosting = False
        if self._game_pid:
            self._set_priority(self._game_pid, "normal")
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

    def stats(self) -> Dict:
        vm = psutil.virtual_memory()
        return {
            "cpu":       psutil.cpu_percent(interval=None),
            "ram_pct":   vm.percent,
            "ram_used":  vm.used / 1024**3,
            "ram_avail": vm.available / 1024**3,
        }


# ══════════════════════════════════════════════════════════════════════════════
# CUSTOM WIDGETS
# ══════════════════════════════════════════════════════════════════════════════

class BoostButton(QPushButton):
    """Big glowing boost toggle"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._active = False
        self._anim = 0.0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)
        self.setMinimumHeight(64)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setText("⚡  START BOOST")

    def set_active(self, v: bool):
        self._active = v
        if v:
            self._timer.start(30)
            self.setText("⚡  BOOSTING  —  CLICK TO STOP")
        else:
            self._timer.stop()
            self._anim = 0.0
            self.setText("⚡  START BOOST")
        self.update()

    def _tick(self):
        self._anim = (self._anim + 0.025) % 1.0
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        r = self.rect().adjusted(3, 3, -3, -3)

        if self._active:
            pulse = abs(self._anim * 2 - 1)  # 0→1→0
            for i in range(4, 0, -1):
                glow = QColor(T["cyan"])
                glow.setAlpha(int(15 * i * (0.4 + 0.6 * pulse)))
                p.setPen(QPen(glow, i * 2))
                p.drawRoundedRect(r.adjusted(-i, -i, i, i), 12, 12)
            grad = QLinearGradient(0, 0, self.width(), 0)
            c1 = QColor(T["cyan"]); c1.setAlpha(60)
            c2 = QColor(T["purple"]); c2.setAlpha(60)
            grad.setColorAt(0, c1); grad.setColorAt(1, c2)
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(T["cyan"]), 1))
            text_color = T["cyan"]
        else:
            if self.underMouse():
                p.setBrush(QBrush(QColor(T["hover"])))
                p.setPen(QPen(QColor(T["cyan"]), 1))
            else:
                p.setBrush(QBrush(QColor(T["card"])))
                p.setPen(QPen(QColor(T["border"]), 1))
            text_color = T["fg"]

        p.drawRoundedRect(r, 12, 12)
        p.setPen(QPen(QColor(text_color)))
        f = QFont("Segoe UI", 15, QFont.Weight.Bold)
        p.setFont(f)
        p.drawText(r, Qt.AlignmentFlag.AlignCenter, self.text())


class BoostMeter(QWidget):
    """Animated intensity bar"""

    _LEVEL_COLORS = ["", T["cyan"], T["purple"], T["red"]]
    _LEVEL_LABELS = ["", "LIGHT", "MEDIUM", "EXTREME"]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._level = 1
        self._anim = 0.0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)
        self._timer.start(30)
        self.setMinimumHeight(60)

    def set_level(self, level: int):
        self._level = max(0, min(3, level))
        self.update()

    def _tick(self):
        self._anim = (self._anim + 0.02) % 1.0
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        track_y = h // 2 - 5

        # Background track
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(QBrush(QColor(T["border"])))
        p.drawRoundedRect(0, track_y, w, 10, 5, 5)

        if self._level > 0:
            fill_w = int(w * self._level / 3)
            c1 = QColor(T["cyan"])
            c2 = QColor(self._LEVEL_COLORS[self._level])
            grad = QLinearGradient(0, 0, fill_w, 0)
            grad.setColorAt(0, c1)
            grad.setColorAt(1, c2)
            p.setBrush(QBrush(grad))
            p.drawRoundedRect(0, track_y, fill_w, 10, 5, 5)

            # Pulse dot
            pulse = abs(self._anim * 2 - 1)
            dot_x = fill_w
            dot_col = QColor(self._LEVEL_COLORS[self._level])
            for i in range(3, 0, -1):
                g = QColor(dot_col); g.setAlpha(int(30 * i * (0.5 + 0.5 * pulse)))
                p.setBrush(QBrush(g))
                p.drawEllipse(QPoint(dot_x, track_y + 5), 4 + i * 2, 4 + i * 2)
            p.setBrush(QBrush(dot_col))
            p.drawEllipse(QPoint(dot_x, track_y + 5), 5, 5)

        # Labels
        for i in range(1, 4):
            x = int(w * i / 3)
            col = QColor(self._LEVEL_COLORS[i] if i <= self._level else T["fg3"])
            p.setPen(QPen(col))
            p.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold if i == self._level else QFont.Weight.Normal))
            p.drawText(QRect(x - 35, track_y + 15, 70, 20),
                       Qt.AlignmentFlag.AlignCenter, self._LEVEL_LABELS[i])


class ProcessRow(QWidget):
    toggled = pyqtSignal(int, bool)  # pid, checked

    def __init__(self, info: Dict, checked: bool, parent=None):
        super().__init__(parent)
        self._pid = info["pid"]
        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 6, 12, 6)
        layout.setSpacing(10)
        self.setFixedHeight(44)
        self.setStyleSheet(f"""
            QWidget {{ background: {T['card']}; border-radius: 8px; }}
            QWidget:hover {{ background: {T['hover']}; }}
        """)

        cb = QCheckBox()
        cb.setChecked(checked)
        cb.stateChanged.connect(lambda s: self.toggled.emit(self._pid, bool(s)))
        layout.addWidget(cb)

        dot = QLabel("●")
        color = CATEGORY_COLORS.get(info["cat"], T["fg3"])
        dot.setStyleSheet(f"color: {color}; font-size: 9px;")
        layout.addWidget(dot)

        name = QLabel(info["display"])
        name.setStyleSheet(f"font-size: 13px; color: {T['fg']};")
        layout.addWidget(name, 1)

        mem = QLabel(f"{info['mem_mb']:.0f} MB")
        mem.setStyleSheet(f"font-size: 11px; color: {T['fg2']};")
        layout.addWidget(mem)

        tag = QLabel("FREE")
        tag.setStyleSheet(f"font-size: 10px; font-weight: bold; color: {T['green']};")
        layout.addWidget(tag)


# ══════════════════════════════════════════════════════════════════════════════
# BACKGROUND STATS THREAD
# ══════════════════════════════════════════════════════════════════════════════

class StatsThread(QThread):
    stats_ready    = pyqtSignal(dict)
    procs_ready    = pyqtSignal(list)

    def __init__(self, engine: BoosterEngine):
        super().__init__()
        self._engine = engine
        self._running = True

    def run(self):
        while self._running:
            self.stats_ready.emit(self._engine.stats())
            if not self._engine.is_boosting:
                self.procs_ready.emit(self._engine.get_running_background())
            time.sleep(2)

    def stop(self):
        self._running = False


# ══════════════════════════════════════════════════════════════════════════════
# MAIN WINDOW
# ══════════════════════════════════════════════════════════════════════════════

class GameBoosterWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self._engine    = BoosterEngine()
        self._boosting  = False
        self._level     = 1
        self._game_exe  = ""
        self._selection: Dict[int, bool] = {}   # pid → kill?

        self._build_window()
        self._build_tray()

        self._thread = StatsThread(self._engine)
        self._thread.stats_ready.connect(self._on_stats)
        self._thread.procs_ready.connect(self._on_procs)
        self._thread.start()

        # seed cpu percent
        psutil.cpu_percent(interval=None)

    # ── Window layout ──────────────────────────────────────────────────────────

    def _build_window(self):
        self.setWindowTitle("Game Booster")
        self.setMinimumSize(960, 680)
        self.resize(1020, 720)
        self.setStyleSheet(STYLESHEET)

        screen = QApplication.primaryScreen().availableGeometry()
        self.move((screen.width() - 1020) // 2, (screen.height() - 720) // 2)

        root = QWidget()
        self.setCentralWidget(root)
        row = QHBoxLayout(root)
        row.setContentsMargins(0, 0, 0, 0)
        row.setSpacing(0)
        row.addWidget(self._build_sidebar(), 0)
        row.addWidget(self._build_main(), 1)

    def _build_sidebar(self):
        side = QFrame()
        side.setFixedWidth(230)
        side.setStyleSheet(f"QFrame {{ background: {T['card']}; border-right: 1px solid {T['border']}; }}")
        v = QVBoxLayout(side)
        v.setContentsMargins(0, 0, 0, 0)
        v.setSpacing(0)

        # Logo
        logo_w = QWidget()
        logo_w.setFixedHeight(80)
        logo_w.setStyleSheet(f"background: {T['card']}; border-bottom: 1px solid {T['border']};")
        lv = QVBoxLayout(logo_w)
        t1 = QLabel("⚡ GAME BOOSTER")
        t1.setAlignment(Qt.AlignmentFlag.AlignCenter)
        t1.setStyleSheet(f"color: {T['cyan']}; font-size: 15px; font-weight: bold; letter-spacing: 2px;")
        t2 = QLabel("Performance Optimizer")
        t2.setAlignment(Qt.AlignmentFlag.AlignCenter)
        t2.setStyleSheet(f"color: {T['fg3']}; font-size: 10px;")
        lv.addWidget(t1); lv.addWidget(t2)
        v.addWidget(logo_w)

        # Status
        sw = QWidget()
        sw.setStyleSheet("background: transparent;")
        sv = QVBoxLayout(sw)
        sv.setContentsMargins(20, 20, 20, 10)
        sl = QLabel("STATUS")
        sl.setStyleSheet(f"color: {T['fg3']}; font-size: 10px; letter-spacing: 2px;")
        sv.addWidget(sl)
        self._status_lbl = QLabel("● IDLE")
        self._status_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 16px; font-weight: bold;")
        sv.addWidget(self._status_lbl)
        v.addWidget(sw)

        # System stats card
        sc = QFrame()
        sc.setStyleSheet(f"""
            QFrame {{
                background: {T['bg']};
                border-radius: 10px;
                margin: 0 14px;
            }}
        """)
        scv = QVBoxLayout(sc)
        scv.setContentsMargins(14, 14, 14, 14)
        scv.setSpacing(6)
        sys_hdr = QLabel("SYSTEM")
        sys_hdr.setStyleSheet(f"color: {T['fg3']}; font-size: 10px; letter-spacing: 2px;")
        scv.addWidget(sys_hdr)

        self._cpu_lbl = QLabel("CPU    0%")
        self._cpu_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 12px;")
        scv.addWidget(self._cpu_lbl)
        self._cpu_bar = QProgressBar(); self._cpu_bar.setRange(0,100)
        self._cpu_bar.setTextVisible(False); self._cpu_bar.setFixedHeight(4)
        scv.addWidget(self._cpu_bar)

        self._ram_lbl = QLabel("RAM    0%")
        self._ram_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 12px;")
        scv.addWidget(self._ram_lbl)
        self._ram_bar = QProgressBar(); self._ram_bar.setRange(0,100)
        self._ram_bar.setTextVisible(False); self._ram_bar.setFixedHeight(4)
        scv.addWidget(self._ram_bar)
        v.addWidget(sc)

        v.addStretch()

        # Admin badge
        adm = QLabel("🔐 ADMIN MODE ACTIVE")
        adm.setAlignment(Qt.AlignmentFlag.AlignCenter)
        adm.setStyleSheet(f"""
            color: {T['green']}; font-size: 10px; font-weight: bold;
            background: {T['bg']}; border-radius: 6px;
            padding: 8px; margin: 0 14px 14px 14px;
        """)
        v.addWidget(adm)
        return side

    def _build_main(self):
        w = QWidget()
        w.setStyleSheet(f"background: {T['bg']};")
        v = QVBoxLayout(w)
        v.setContentsMargins(28, 28, 28, 28)
        v.setSpacing(16)

        # Title row
        tr = QHBoxLayout()
        title = QLabel("BOOST YOUR GAME")
        title.setStyleSheet(f"color: {T['fg']}; font-size: 22px; font-weight: bold; letter-spacing: 3px;")
        tr.addWidget(title); tr.addStretch()
        v.addLayout(tr)

        # Game selector
        v.addWidget(self._build_game_card())

        # Boost level
        v.addWidget(self._build_level_card())

        # Process list
        v.addWidget(self._build_proc_card(), 1)

        # Big boost button
        self._boost_btn = BoostButton()
        self._boost_btn.clicked.connect(self._toggle_boost)
        v.addWidget(self._boost_btn)

        return w

    def _build_game_card(self):
        card = QFrame()
        card.setStyleSheet(f"QFrame {{ background: {T['card']}; border: 1px solid {T['border']}; border-radius: 12px; }}")
        h = QHBoxLayout(card)
        h.setContentsMargins(20, 14, 20, 14)

        lbl = QLabel("🎮  SELECT GAME")
        lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 11px; letter-spacing: 2px; font-weight: bold;")
        h.addWidget(lbl)

        self._game_combo = QComboBox()
        self._game_combo.setMinimumWidth(280)
        for name, exe in KNOWN_GAMES:
            self._game_combo.addItem(name, exe)
        self._game_combo.currentIndexChanged.connect(self._on_game_changed)
        h.addWidget(self._game_combo, 1)

        detect = QPushButton("🔍  Auto-Detect")
        detect.clicked.connect(self._auto_detect)
        h.addWidget(detect)

        return card

    def _build_level_card(self):
        card = QFrame()
        card.setStyleSheet(f"QFrame {{ background: {T['card']}; border: 1px solid {T['border']}; border-radius: 12px; }}")
        v = QVBoxLayout(card)
        v.setContentsMargins(20, 14, 20, 14)
        v.setSpacing(10)

        # Header
        hdr = QHBoxLayout()
        hdr_lbl = QLabel("BOOST INTENSITY")
        hdr_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 11px; letter-spacing: 2px; font-weight: bold;")
        hdr.addWidget(hdr_lbl)
        self._badge = QLabel("LIGHT")
        self._badge.setStyleSheet(f"""
            color: {T['cyan']}; font-size: 12px; font-weight: bold;
            padding: 2px 10px;
            background: {T['cyan']}22; border: 1px solid {T['cyan']}44;
            border-radius: 10px;
        """)
        hdr.addWidget(self._badge); hdr.addStretch()
        v.addLayout(hdr)

        # Level buttons
        levels = [
            (1, "LIGHT",   T["cyan"],   "Lower priority of browsers & light apps"),
            (2, "MEDIUM",  T["purple"], "Terminate most non-essential processes"),
            (3, "EXTREME", T["red"],    "Kill everything except game & system"),
        ]
        btn_row = QHBoxLayout(); btn_row.setSpacing(10)
        self._level_btns = []
        for lvl, name, col, _ in levels:
            b = QPushButton(name)
            b.setMinimumHeight(36)
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.setProperty("lvl", lvl); b.setProperty("col", col)
            b.clicked.connect(lambda _, l=lvl: self._set_level(l))
            btn_row.addWidget(b)
            self._level_btns.append(b)
        v.addLayout(btn_row)

        # Meter
        self._meter = BoostMeter()
        v.addWidget(self._meter)

        self._level_desc = QLabel("Lower priority of browsers & light apps")
        self._level_desc.setStyleSheet(f"color: {T['fg3']}; font-size: 11px;")
        v.addWidget(self._level_desc)

        self._set_level(1)
        return card

    def _build_proc_card(self):
        card = QFrame()
        card.setStyleSheet(f"QFrame {{ background: {T['card']}; border: 1px solid {T['border']}; border-radius: 12px; }}")
        v = QVBoxLayout(card)
        v.setContentsMargins(20, 14, 20, 14)
        v.setSpacing(10)

        hdr = QHBoxLayout()
        hdr_lbl = QLabel("BACKGROUND PROCESSES")
        hdr_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 11px; letter-spacing: 2px; font-weight: bold;")
        hdr.addWidget(hdr_lbl); hdr.addStretch()
        self._proc_count = QLabel("Scanning…")
        self._proc_count.setStyleSheet(f"color: {T['fg3']}; font-size: 11px;")
        hdr.addWidget(self._proc_count)
        v.addLayout(hdr)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setMinimumHeight(140); scroll.setMaximumHeight(210)

        self._proc_container = QWidget()
        self._proc_container.setStyleSheet("background: transparent;")
        self._proc_vbox = QVBoxLayout(self._proc_container)
        self._proc_vbox.setSpacing(4)
        self._proc_vbox.setContentsMargins(0, 0, 0, 0)
        self._proc_vbox.addStretch()
        scroll.setWidget(self._proc_container)
        v.addWidget(scroll)

        self._mem_lbl = QLabel("Select processes to estimate memory savings")
        self._mem_lbl.setStyleSheet(f"color: {T['green']}; font-size: 11px;")
        v.addWidget(self._mem_lbl)

        return card

    # ── Tray ───────────────────────────────────────────────────────────────────

    def _build_tray(self):
        px = QPixmap(64, 64)
        px.fill(Qt.GlobalColor.transparent)
        pr = QPainter(px)
        pr.setRenderHint(QPainter.RenderHint.Antialiasing)
        pr.setBrush(QBrush(QColor(T["cyan"])))
        pr.setPen(Qt.PenStyle.NoPen)
        pr.drawEllipse(4, 4, 56, 56)
        pr.setPen(QPen(QColor("#000000"), 1))
        pr.setFont(QFont("Arial", 30, QFont.Weight.Bold))
        pr.drawText(px.rect(), Qt.AlignmentFlag.AlignCenter, "⚡")
        pr.end()

        self._tray = QSystemTrayIcon(QIcon(px), self)
        m = QMenu()
        show_a = QAction("Show Window", self); show_a.triggered.connect(self._show)
        boost_a = QAction("⚡ Toggle Boost", self); boost_a.triggered.connect(self._toggle_boost)
        quit_a  = QAction("Quit", self);  quit_a.triggered.connect(self._quit)
        m.addAction(show_a); m.addSeparator()
        m.addAction(boost_a); m.addSeparator()
        m.addAction(quit_a)
        self._tray.setContextMenu(m)
        self._tray.activated.connect(
            lambda r: self._show() if r == QSystemTrayIcon.ActivationReason.DoubleClick else None
        )
        self._tray.setToolTip("Game Booster — Running in background")
        self._tray.show()

    # ── Slots ──────────────────────────────────────────────────────────────────

    def _on_game_changed(self, idx: int):
        exe = self._game_combo.itemData(idx)
        if exe == "__browse__":
            path, _ = QFileDialog.getOpenFileName(self, "Select Game Executable", "", "Executables (*.exe)")
            if path:
                name = os.path.basename(path)
                self._game_combo.insertItem(1, f"Custom: {name}", name)
                self._game_combo.setCurrentIndex(1)
            else:
                self._game_combo.setCurrentIndex(0)
        else:
            self._game_exe = exe or ""

    def _auto_detect(self):
        detected = self._engine.detect_game()
        if detected:
            for i in range(self._game_combo.count()):
                if self._game_combo.itemData(i) == detected:
                    self._game_combo.setCurrentIndex(i)
                    return
            self._game_combo.insertItem(1, f"Detected: {detected}", detected)
            self._game_combo.setCurrentIndex(1)
        else:
            self._tray.showMessage("Game Booster", "No game detected — launch your game first!",
                                   QSystemTrayIcon.MessageIcon.Information, 2500)

    def _set_level(self, level: int):
        self._level = level
        cfgs = {
            1: ("LIGHT",   T["cyan"],   "Lower priority of browsers & light apps"),
            2: ("MEDIUM",  T["purple"], "Terminate most non-essential processes"),
            3: ("EXTREME", T["red"],    "Kill everything except game & system"),
        }
        name, col, desc = cfgs[level]
        self._badge.setText(name)
        self._badge.setStyleSheet(f"""
            color: {col}; font-size: 12px; font-weight: bold;
            padding: 2px 10px;
            background: {col}22; border: 1px solid {col}44;
            border-radius: 10px;
        """)
        self._level_desc.setText(desc)
        self._meter.set_level(level)

        for btn in self._level_btns:
            l = btn.property("lvl")
            c = btn.property("col")
            if l == level:
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background: {c}22; color: {c};
                        border: 1px solid {c}; border-radius: 8px;
                        font-weight: bold; font-size: 12px;
                    }}
                """)
            else:
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background: {T['input']}; color: {T['fg3']};
                        border: 1px solid {T['border']}; border-radius: 8px; font-size: 12px;
                    }}
                    QPushButton:hover {{ border-color: {c}; color: {c}; }}
                """)

    def _toggle_boost(self):
        if not self._boosting:
            pids = [pid for pid, kill in self._selection.items() if kill]
            r = self._engine.boost(self._game_exe, pids, self._level)
            self._boosting = True
            self._boost_btn.set_active(True)
            self._status_lbl.setText("● BOOSTING")
            cols = ["", T["cyan"], T["purple"], T["red"]]
            self._status_lbl.setStyleSheet(f"color: {cols[self._level]}; font-size: 16px; font-weight: bold;")
            msg = (f"Boost active! {r['killed']} apps closed, {r['lowered']} deprioritized, "
                   f"~{r['mem_freed']:.0f} MB freed")
            if r["game_found"]:
                msg += " · Game priority elevated"
            self._tray.showMessage("Game Booster", msg, QSystemTrayIcon.MessageIcon.Information, 3500)
        else:
            restarted = self._engine.unboost()
            self._boosting = False
            self._boost_btn.set_active(False)
            self._status_lbl.setText("● IDLE")
            self._status_lbl.setStyleSheet(f"color: {T['fg2']}; font-size: 16px; font-weight: bold;")
            self._tray.showMessage("Game Booster", f"Boost ended. {restarted} apps restarted.",
                                   QSystemTrayIcon.MessageIcon.Information, 2500)

    def _on_stats(self, s: Dict):
        self._cpu_lbl.setText(f"CPU   {s['cpu']:.0f}%")
        self._ram_lbl.setText(f"RAM   {s['ram_pct']:.0f}%  ({s['ram_used']:.1f} GB)")
        self._cpu_bar.setValue(int(s["cpu"]))
        self._ram_bar.setValue(int(s["ram_pct"]))

    def _on_procs(self, procs: List[Dict]):
        # Remove all rows (leave stretch)
        while self._proc_vbox.count() > 1:
            item = self._proc_vbox.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for info in procs:
            pid = info["pid"]
            if pid not in self._selection:
                self._selection[pid] = info["default"]
            row = ProcessRow(info, self._selection.get(pid, False))
            row.toggled.connect(self._on_proc_toggle)
            self._proc_vbox.insertWidget(self._proc_vbox.count() - 1, row)

        count = len(procs)
        self._proc_count.setText(f"{count} running" if count else "None detected")

        if count == 0:
            empty = QLabel("No known background apps detected")
            empty.setAlignment(Qt.AlignmentFlag.AlignCenter)
            empty.setStyleSheet(f"color: {T['fg3']}; font-size: 12px;")
            self._proc_vbox.insertWidget(0, empty)

        self._refresh_mem_lbl()

    def _on_proc_toggle(self, pid: int, checked: bool):
        self._selection[pid] = checked
        self._refresh_mem_lbl()

    def _refresh_mem_lbl(self):
        total = 0.0
        for pid, kill in self._selection.items():
            if kill:
                try:
                    total += psutil.Process(pid).memory_info().rss / 1024 / 1024
                except Exception:
                    pass
        if total > 0:
            self._mem_lbl.setText(f"~{total:.0f} MB will be freed on boost")
        else:
            self._mem_lbl.setText("Select processes to estimate memory savings")

    def _show(self):
        self.show(); self.raise_(); self.activateWindow()

    def closeEvent(self, e):
        e.ignore()
        self.hide()
        self._tray.showMessage("Game Booster",
                               "Still running in background. Right-click tray icon to quit.",
                               QSystemTrayIcon.MessageIcon.Information, 2000)

    def _quit(self):
        if self._boosting:
            self._engine.unboost()
        self._thread.stop()
        self._thread.wait(2000)
        QApplication.quit()


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ELEVATION & ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def is_admin() -> bool:
    try:
        if sys.platform == "win32":
            return bool(ctypes.windll.shell32.IsUserAnAdmin())
        return os.getuid() == 0
    except Exception:
        return False


def elevate():
    if sys.platform == "win32":
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable,
            " ".join(f'"{a}"' for a in sys.argv),
            None, 1
        )
    else:
        os.execvp("sudo", ["sudo", sys.executable] + sys.argv)


if __name__ == "__main__":
    if not is_admin():
        print("Game Booster needs admin rights to control process priorities.")
        choice = input("Relaunch as administrator? [Y/n]: ").strip().lower()
        if choice in ("", "y", "yes"):
            elevate()
            sys.exit(0)
        print("Continuing without admin — some features will be limited.\n")

    app = QApplication(sys.argv)
    app.setApplicationName("Game Booster")
    app.setQuitOnLastWindowClosed(False)

    win = GameBoosterWindow()
    win.show()
    sys.exit(app.exec())
