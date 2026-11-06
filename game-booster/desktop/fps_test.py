"""Real capture test: run PresentMon via FpsTracker and confirm it measures frames on this machine."""

import sys
import time

import frxst_fps as ff

pm = ff.presentmon_path()
print("PresentMon:", pm)
if not pm:
    sys.exit("PresentMon not found")

t = ff.FpsTracker()
# Any app drawing frames will do here: the FRXST window (WebView2) and the desktop compositor.
r = t.start(prefer=["msedgewebview2.exe", "dwm.exe", "frxst.exe"], exclude=set())
print("start:", r)
if not r["ok"]:
    sys.exit(1)
seen = None
for _ in range(20):
    time.sleep(1)
    s = t.stats()
    print({k: v for k, v in s.items() if k != "history"})
    if s.get("state") == "live":
        seen = s
        break
    if s.get("state") == "error":
        break
apps = sorted({k[0] for k in t._frames})
print("apps presenting frames:", apps)
summary = t.stop()
print("summary:", summary)
ok = bool(seen and seen["fps"] > 0) or bool(apps)
if t.running:
    ok = False
    print("PresentMon still running after stop")
print("RESULT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
