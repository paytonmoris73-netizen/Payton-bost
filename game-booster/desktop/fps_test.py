"""Real capture test: run PresentMon via FpsTracker and confirm it measures frames on this machine."""

import os
import subprocess
import sys
import tempfile
import time

import frxst_fps as ff

pm = ff.presentmon_path()
print("PresentMon:", pm)
if not pm:
    sys.exit("PresentMon not found")
subprocess.run([pm, "--help"], timeout=10)

# Something that definitely draws frames: an Edge window running a requestAnimationFrame loop.
page = os.path.join(tempfile.gettempdir(), "frxst_anim.html")
with open(page, "w") as f:
    f.write("<canvas id=c width=800 height=600></canvas><script>const x=c.getContext('2d');let i=0;"
            "(function f(){x.fillStyle='hsl('+(i++%360)+',80%,50%)';x.fillRect(0,0,800,600);"
            "requestAnimationFrame(f)})()</script>")
edge = next((p for p in (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                         r"C:\Program Files\Microsoft\Edge\Application\msedge.exe") if os.path.exists(p)), None)
print("Edge:", edge)
browser = subprocess.Popen([edge, "--new-window", "--no-first-run", "--user-data-dir=" + tempfile.mkdtemp(),
                            "file:///" + page.replace("\\", "/")]) if edge else None
time.sleep(4)

t = ff.FpsTracker()
r = t.start(prefer=["msedge.exe", "msedgewebview2.exe", "dwm.exe"], exclude=set())
print("start:", r)
seen = None
for _ in range(20):
    time.sleep(1)
    s = t.stats()
    print({k: v for k, v in s.items() if k != "history"}, "rows:", t.rows_seen)
    if s.get("state") == "live" and s["fps"] > 0:
        seen = s
        if len(s.get("history", [])) >= 3:
            break
print("header:", t.header)
print("raw sample:", *t.raw_sample, sep="\n  ")
print("apps presenting frames:", sorted({k[0] for k in t._frames}))
print("summary:", t.stop())
if browser:
    browser.terminate()
ok = bool(seen) and not t.running
print("RESULT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
