"""FRXST desktop app: the FRXST UI in a native window, wired to frxst_engine."""

import atexit
import datetime
import os
import sys
import traceback

import webview

from frxst_engine import DATA_DIR, Engine

LOG_PATH = os.path.join(DATA_DIR, "frxst.log")


def log(msg: str):
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write("%s %s\n" % (datetime.datetime.now().isoformat(timespec="seconds"), msg))
    except OSError:
        pass


def ui_source() -> str:
    if getattr(sys, "frozen", False):
        return os.path.join(sys._MEIPASS, "booster.html")  # type: ignore[attr-defined]
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "booster.html")


def build_ui() -> str:
    """booster.html is authored without a document shell; wrap it so it renders in standards mode."""
    with open(ui_source(), encoding="utf-8") as f:
        body = f.read()
    page = ("<!doctype html>\n<html lang=\"en\">\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n"
            "<style>html,body{margin:0;height:100%;background:#0b0c17}</style>\n" + body + "\n</html>\n")
    out_dir = os.path.join(DATA_DIR, "ui")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "index.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)
    return path


class Api:
    """Methods exposed to the page as window.pywebview.api.*"""

    def __init__(self, engine: Engine):
        self._e = engine
        self._window = None

    def ui_ready(self):
        s = self._e.stats()
        log("ui ready (admin=%s, plan=%s)" % (s.get("admin"), self._e.get_power_plan().get("id")))
        return True

    def stats(self):
        return self._e.stats()

    def get_power_plan(self):
        return self._e.get_power_plan()

    def set_power_plan(self, plan):
        return self._e.set_power_plan(plan)

    def boost(self, game_id, tier, name=""):
        return self._e.boost(game_id or "", int(tier), name or "")

    def unboost(self):
        return self._e.unboost()

    def launch(self, game_id):
        return self._e.launch(game_id)

    def find_game(self, game_id):
        return self._e.find_game(game_id)

    def vpn_list(self):
        return self._e.vpn_list()

    def vpn_add(self, profile):
        return self._e.vpn_add(profile or {})

    def vpn_remove(self, vid):
        return self._e.vpn_remove(vid)

    def vpn_connect(self, vid):
        return self._e.vpn_connect(vid)

    def vpn_disconnect(self):
        return self._e.vpn_disconnect()

    def vpn_status(self):
        return self._e.vpn_status()

    def ping(self, host):
        from frxst_engine import ping_ms
        return ping_ms(str(host)[:253]) if host else None

    def pick_config(self):
        if not self._window:
            return ""
        res = self._window.create_file_dialog(webview.OPEN_DIALOG, allow_multiple=False,
                                              file_types=("VPN config (*.ovpn;*.conf)", "All files (*.*)"))
        return res[0] if res else ""


def main():
    log("starting FRXST")
    engine = Engine()
    atexit.register(engine.shutdown)
    api = Api(engine)
    window = webview.create_window("FRXST Game Booster", url=build_ui(), js_api=api,
                                   width=1320, height=860, min_size=(980, 640),
                                   background_color="#0b0c17", text_select=False)
    api._window = window
    window.events.closing += engine.shutdown
    webview.start(private_mode=False, storage_path=os.path.join(DATA_DIR, "webview"))


if __name__ == "__main__":
    try:
        main()
    except Exception:  # noqa: BLE001 - last-resort report for a windowed exe
        log("crash:\n" + traceback.format_exc())
        if sys.platform == "win32":
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                None, "FRXST couldn't start. Details were saved to:\n" + LOG_PATH +
                "\n\nIf it mentions WebView2, install the Microsoft Edge WebView2 Runtime.",
                "FRXST Game Booster", 0x10)
        raise
