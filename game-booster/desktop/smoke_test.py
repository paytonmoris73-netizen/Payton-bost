"""Runs the real engine on Windows and checks every change is applied and then undone."""

import sys
import time

import frxst_engine as fe

fails = []


def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + (" -- " + str(extra) if extra else ""))
    if not cond:
        fails.append(name)


def dvr_values():
    import winreg
    out = []
    for path, name in [(r"System\GameConfigStore", "GameDVR_Enabled"),
                       (r"Software\Microsoft\Windows\CurrentVersion\GameDVR", "AppCaptureEnabled")]:
        try:
            k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, path)
            out.append(winreg.QueryValueEx(k, name)[0])
        except OSError:
            out.append(None)
    return out


orig = fe.active_scheme()
print("original scheme", orig, "admin", fe.is_admin())
e = fe.Engine()
time.sleep(1.5)
s = e.stats()
check("stats", all(k in s for k in ("cpu", "ram", "dl", "ul")), s)

r = e.set_power_plan("high")
check("switch to High Performance", r.get("ok") and e.plan_id_of(fe.active_scheme()) == "high", r)
r = e.set_power_plan("frxst")
check("create + switch to FRXST Ultimate", r.get("ok") and e.plan_id_of(fe.active_scheme()) == "frxst", r)
rc, names = fe.run(["powercfg", "/list"])
check("FRXST plan visible in Windows", "FRXST Ultimate" in names, names[-300:])
r = e.set_power_plan("frxst")
check("FRXST plan reused, not duplicated", names.count("FRXST Ultimate") == fe.run(["powercfg", "/list"])[1].count("FRXST Ultimate"))
e.set_power_plan("balanced")

dvr_before = dvr_values()
r = e.boost("cs2", 3, "CS2")
labels = [x["label"] for x in r["steps"]]
print("boost steps:", *r["steps"], sep="\n  ")
check("boost forces FRXST plan", e.plan_id_of(fe.active_scheme()) == "frxst")
check("Game DVR off during boost", dvr_values() == [0, 0], dvr_values())
qos = fe.ps("Get-NetQosPolicy -PolicyStore ActiveStore | Select-Object -ExpandProperty Name")[1]
check("QoS policy created", "frxst-cs2.exe" in qos.lower(), qos)
r = e.unboost()
check("unboost restores Balanced", e.plan_id_of(fe.active_scheme()) == "balanced", r)
check("Game DVR restored", dvr_values() == dvr_before, (dvr_before, dvr_values()))
qos = fe.ps("Get-NetQosPolicy -PolicyStore ActiveStore | Select-Object -ExpandProperty Name")[1]
check("QoS policy removed", "frxst-" not in qos.lower(), qos)

r = e.vpn_add({"name": "FRXST Smoke 'Test'", "server": "vpn.example.invalid", "type": "IKEv2"})
check("add Windows VPN profile (quotes in name)", r.get("ok"), r)
lst = e.vpn_list()
check("profile listed", any(v["name"] == "FRXST Smoke 'Test'" and v["own"] for v in lst["list"]), lst)
r = e.vpn_connect("w:FRXST Smoke 'Test'")
check("bad server fails cleanly", not r.get("ok") and r.get("error"), r)
r = e.vpn_remove("w:FRXST Smoke 'Test'")
check("profile removed", r.get("ok") and not any(v["name"].startswith("FRXST Smoke") for v in e.vpn_list()["list"]), r)

check("ping works", fe.ping_ms("1.1.1.1") is not None)

# crash recovery: boost, then a fresh engine (as after a crash) must undo it
dvr_before = dvr_values()
e.boost("cs2", 2, "CS2")
check("journal written while boosting", "journal" in fe.Engine._load_cfg(e))
e2 = fe.Engine()
check("recovery restores Game DVR", "Game DVR" in e2.recovered and dvr_values() == dvr_before, e2.recovered)
check("recovery restores power plan", e2.plan_id_of(fe.active_scheme()) == e2.user_plan, e2.user_plan)
e.boosting = False
e._dvr_saved = None

# display modes
check("DEVMODE struct size", fe.ctypes.sizeof(fe.DEVMODEW) == 220, fe.ctypes.sizeof(fe.DEVMODEW))
info = e2.resolution_info()
print("display", info["current"], "modes", info["modes"][:12])
check("read current display mode", info["ok"], info)
smaller = [m for m in info["modes"] if m[0] < info["current"][0]]
if smaller:
    w, h = smaller[-1]
    r = e2.set_resolution(w, h)
    check("switch resolution to %dx%d" % (w, h), r.get("ok") and fe.current_mode()[:2] == [w, h], r)
    e2.restore_resolution()
    check("restore resolution", fe.current_mode()[:2] == info["current"], fe.current_mode())
r = e2.set_resolution(123, 45)
check("unsupported resolution rejected", not r["ok"], r)

# monitor
si = e2.system_info()
print("system", si)
check("system info", si["cpu"] and si["ram_gb"] > 0 and si["os"].startswith("Windows"), si)
e2.monitor()
time.sleep(5)
m = e2.monitor()
print("monitor", {k: m[k] for k in ("cpu", "gpu", "temp", "ram_pct", "disk")}, m["top"][:3])
check("monitor top processes", len(m["top"]) > 0 and len(m["cores"]) > 0, m)
e2.shutdown()
e.shutdown()
if orig:
    fe.run(["powercfg", "/setactive", orig])
print("\n%d failure(s)" % len(fails), fails)
sys.exit(1 if fails else 0)
