import { Router } from "express";
import { execSync, spawn, type ChildProcess } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { cpus, freemem, totalmem } from "os";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VPN_STORE = path.join(__dirname, "..", "vpn_profiles.json");

// ── Known background processes ────────────────────────────────────────────────
const KNOWN_PROCS = [
  { exe: "chrome.exe",            label: "Google Chrome",   cat: "browser",  def: true  },
  { exe: "msedge.exe",            label: "Microsoft Edge",  cat: "browser",  def: true  },
  { exe: "firefox.exe",           label: "Firefox",         cat: "browser",  def: true  },
  { exe: "opera.exe",             label: "Opera",           cat: "browser",  def: true  },
  { exe: "brave.exe",             label: "Brave",           cat: "browser",  def: true  },
  { exe: "discord.exe",           label: "Discord",         cat: "social",   def: true  },
  { exe: "teams.exe",             label: "MS Teams",        cat: "social",   def: false },
  { exe: "slack.exe",             label: "Slack",           cat: "social",   def: true  },
  { exe: "zoom.exe",              label: "Zoom",            cat: "social",   def: false },
  { exe: "skype.exe",             label: "Skype",           cat: "social",   def: true  },
  { exe: "telegram.exe",          label: "Telegram",        cat: "social",   def: false },
  { exe: "spotify.exe",           label: "Spotify",         cat: "media",    def: true  },
  { exe: "OneDrive.exe",          label: "OneDrive",        cat: "cloud",    def: true  },
  { exe: "Dropbox.exe",           label: "Dropbox",         cat: "cloud",    def: true  },
  { exe: "SearchIndexer.exe",     label: "Search Indexer",  cat: "system",   def: true  },
  { exe: "steam.exe",             label: "Steam",           cat: "launcher", def: true  },
  { exe: "EpicGamesLauncher.exe", label: "Epic Games",      cat: "launcher", def: true  },
  { exe: "obs64.exe",             label: "OBS Studio",      cat: "other",    def: false },
  { exe: "Code.exe",              label: "VS Code",         cat: "other",    def: false },
];

// Linux-side equivalents for dev/testing
const LINUX_PROCS = [
  { exe: "chrome",         label: "Google Chrome",  cat: "browser",  def: true  },
  { exe: "firefox",        label: "Firefox",        cat: "browser",  def: true  },
  { exe: "discord",        label: "Discord",        cat: "social",   def: true  },
  { exe: "slack",          label: "Slack",          cat: "social",   def: true  },
  { exe: "spotify",        label: "Spotify",        cat: "media",    def: true  },
  { exe: "code",           label: "VS Code",        cat: "other",    def: false },
  { exe: "obs",            label: "OBS Studio",     cat: "other",    def: false },
  { exe: "steam",          label: "Steam",          cat: "launcher", def: true  },
  { exe: "dropbox",        label: "Dropbox",        cat: "cloud",    def: true  },
];

// ── State ─────────────────────────────────────────────────────────────────────
let boosting = false;
let killedPids: number[] = [];
let gamePid: number | null = null;
let vpnProc: ChildProcess | null = null;
let activeVpnId: string | null = null;
let originalDisplay: { width: number; height: number; refresh: number } | null = null;
let stretchActive = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
function isWindows() { return process.platform === "win32"; }

function getCpuPercent(): number {
  const before = cpus().map((c) => c.times);
  // busy-wait 80ms sample
  const start = Date.now();
  while (Date.now() - start < 80) { /* spin */ }
  const after = cpus().map((c) => c.times);
  let totalIdle = 0, totalTick = 0;
  for (let i = 0; i < before.length; i++) {
    for (const k of Object.keys(after[i]) as (keyof typeof after[0])[]) {
      const delta = (after[i][k] as number) - (before[i][k] as number);
      totalTick += delta;
      if (k === "idle") totalIdle += delta;
    }
  }
  return Math.round(100 - (totalIdle / totalTick) * 100);
}

function getRunningProcesses(): Array<{ pid: number; exe: string; label: string; cat: string; def: boolean; memMb: number }> {
  const db = isWindows() ? KNOWN_PROCS : LINUX_PROCS;
  const result = [];

  if (isWindows()) {
    try {
      const raw = execSync("tasklist /FO CSV /NH", { encoding: "utf8" });
      const seen = new Set<string>();
      for (const line of raw.split("\n")) {
        const parts = line.trim().replace(/"/g, "").split(",");
        if (parts.length < 5) continue;
        const [name, pidStr, , , memStr] = parts;
        const nameLower = name.trim().toLowerCase();
        if (seen.has(nameLower)) continue;
        const match = db.find((d) => d.exe.toLowerCase() === nameLower);
        if (!match) continue;
        seen.add(nameLower);
        const pid = parseInt(pidStr.trim(), 10);
        const mem = parseFloat(memStr.replace(/[^\d.]/g, "")) / 1024;
        result.push({ pid, exe: match.exe, label: match.label, cat: match.cat, def: match.def, memMb: Math.round(mem) });
      }
    } catch (_) { /* ignore */ }
  } else {
    try {
      const raw = execSync("ps aux --no-header", { encoding: "utf8" });
      const seen = new Set<string>();
      for (const line of raw.split("\n")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 11) continue;
        const pid = parseInt(parts[1], 10);
        const rss = parseInt(parts[5], 10); // kB
        const cmd = path.basename(parts[10]).toLowerCase().split(" ")[0];
        if (seen.has(cmd)) continue;
        const match = db.find((d) => d.exe.toLowerCase() === cmd || cmd.includes(d.exe.toLowerCase()));
        if (!match) continue;
        seen.add(cmd);
        result.push({ pid, exe: match.exe, label: match.label, cat: match.cat, def: match.def, memMb: Math.round(rss / 1024) });
      }
    } catch (_) { /* ignore */ }
  }
  return result;
}

function killPid(pid: number): boolean {
  try {
    if (isWindows()) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    } else {
      execSync(`kill -15 ${pid}`, { stdio: "ignore" });
    }
    killedPids.push(pid);
    return true;
  } catch { return false; }
}

function setPriority(pid: number, level: "high" | "normal" | "low"): void {
  try {
    if (isWindows()) {
      const map = { high: "High", normal: "Normal", low: "Idle" };
      execSync(`powershell -c "(Get-Process -Id ${pid}).PriorityClass = '${map[level]}'"`, { stdio: "ignore" });
    } else {
      const map = { high: -10, normal: 0, low: 15 };
      execSync(`renice -n ${map[level]} -p ${pid}`, { stdio: "ignore" });
    }
  } catch { /* ignore permission errors */ }
}

// ── Display / stretch resolution helpers ─────────────────────────────────────
function getDisplayInfo(): { width: number; height: number; refresh: number } {
  try {
    if (isWindows()) {
      const raw = execSync(
        `powershell -c "Add-Type -AssemblyName System.Windows.Forms; $s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Write-Output \"$($s.Width) $($s.Height) 60\""`,
        { encoding: "utf8" }
      ).trim();
      const [w, h, r] = raw.split(/\s+/).map(Number);
      return { width: w || 1920, height: h || 1080, refresh: r || 60 };
    } else {
      const raw = execSync("xrandr --current | grep '\\*' | head -1", { encoding: "utf8" }).trim();
      const m = raw.match(/(\d+)x(\d+)\s+([\d.]+)\*/);
      if (m) return { width: parseInt(m[1]), height: parseInt(m[2]), refresh: Math.round(parseFloat(m[3])) };
    }
  } catch { /* fallback */ }
  return { width: 1920, height: 1080, refresh: 60 };
}

function applyResolution(width: number, height: number): boolean {
  try {
    if (isWindows()) {
      const ps = [
        "Add-Type -TypeDefinition @'",
        "using System;using System.Runtime.InteropServices;",
        "public class RC {",
        "  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Ansi)]",
        "  public struct DM {",
        "    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)]public string dmDeviceName;",
        "    public short dmSpecVersion,dmDriverVersion,dmSize,dmDriverExtra;",
        "    public int dmFields,dmPositionX,dmPositionY,dmDisplayOrientation,dmDisplayFixedOutput;",
        "    public short dmColor,dmDuplex,dmYResolution,dmTTOption,dmCollate;",
        "    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)]public string dmFormName;",
        "    public short dmLogPixels;public int dmBitsPerPel,dmPelsWidth,dmPelsHeight,dmDisplayFlags,dmDisplayFrequency;",
        "    public int dmICMMethod,dmICMIntent,dmMediaType,dmDitherType,dmReserved1,dmReserved2,dmPanningWidth,dmPanningHeight;",
        "  }",
        "  [DllImport(\"user32.dll\")]public static extern int ChangeDisplaySettings(ref DM d,int f);",
        "  [DllImport(\"user32.dll\")]public static extern bool EnumDisplaySettings(string n,int m,ref DM d);",
        "  public static int Set(int w,int h){",
        "    var d=new DM();d.dmSize=(short)System.Runtime.InteropServices.Marshal.SizeOf(d);",
        "    EnumDisplaySettings(null,-1,ref d);d.dmPelsWidth=w;d.dmPelsHeight=h;d.dmFields=0x180000;",
        "    return ChangeDisplaySettings(ref d,1);",
        "  }",
        "}",
        "'@ -Language CSharp",
        `[RC]::Set(${width}, ${height})`,
      ].join("\n");
      const tmpPs = path.join(__dirname, "..", "~res_change.ps1");
      writeFileSync(tmpPs, ps, "utf8");
      execSync(`powershell -ExecutionPolicy Bypass -File "${tmpPs}"`, { stdio: "ignore" });
      try { (existsSync(tmpPs)) && execSync(`del "${tmpPs}"`, { stdio: "ignore" }); } catch { /* */ }
      return true;
    } else {
      execSync(`xrandr -s ${width}x${height}`, { stdio: "ignore" });
      return true;
    }
  } catch { return false; }
}

// ── VPN helpers ───────────────────────────────────────────────────────────────
function loadVpns(): any[] {
  if (!existsSync(VPN_STORE)) return [];
  try { return JSON.parse(readFileSync(VPN_STORE, "utf8")).vpns || []; } catch { return []; }
}

function saveVpns(vpns: any[]) {
  writeFileSync(VPN_STORE, JSON.stringify({ vpns }, null, 2));
}

// ── Router ────────────────────────────────────────────────────────────────────
export const boosterRouter = Router();

boosterRouter.get("/stats", (_req, res) => {
  const total = totalmem(), free = freemem(), used = total - free;
  res.json({
    cpu: getCpuPercent(),
    ramPct: Math.round((used / total) * 100),
    ramUsed: +(used / 1024 ** 3).toFixed(1),
    ramTotal: +(total / 1024 ** 3).toFixed(1),
    boosting,
    vpnActive: activeVpnId,
  });
});

boosterRouter.get("/processes", (_req, res) => {
  res.json(boosting ? [] : getRunningProcesses());
});

boosterRouter.post("/boost", (req, res) => {
  const { pids = [] as number[], level = 1, gameExe = "" } = req.body;
  let killed = 0, lowered = 0, memFreed = 0;

  for (const pid of pids) {
    const procs = getRunningProcesses();
    const info = procs.find((p) => p.pid === pid);
    const mem = info?.memMb || 0;
    if (level >= 2) {
      if (killPid(pid)) { killed++; memFreed += mem; }
    } else {
      setPriority(pid, "low");
      lowered++; memFreed += Math.round(mem * 0.15);
    }
  }

  // Boost game process
  let gameFound = false;
  if (gameExe) {
    try {
      let gpid: number | null = null;
      if (isWindows()) {
        const raw = execSync(`tasklist /FI "IMAGENAME eq ${gameExe}" /FO CSV /NH`, { encoding: "utf8" });
        const parts = raw.split("\n")[0].replace(/"/g, "").split(",");
        if (parts.length >= 2) gpid = parseInt(parts[1], 10);
      } else {
        const raw = execSync(`pgrep -x "${path.basename(gameExe, ".exe")}"`, { encoding: "utf8" });
        gpid = parseInt(raw.trim().split("\n")[0], 10);
      }
      if (gpid && !isNaN(gpid)) {
        gamePid = gpid;
        setPriority(gpid, "high");
        gameFound = true;
      }
    } catch { /* game not running */ }
  }

  boosting = true;
  res.json({ killed, lowered, memFreed, gameFound });
});

boosterRouter.post("/unboost", (_req, res) => {
  if (gamePid) { setPriority(gamePid, "normal"); gamePid = null; }
  killedPids = [];
  boosting = false;
  res.json({ ok: true });
});

// Display / Stretch Resolution
boosterRouter.get("/display", (_req, res) => {
  const current = getDisplayInfo();
  res.json({ current, original: originalDisplay, stretchActive });
});

boosterRouter.post("/display/apply", (req, res) => {
  const { width, height } = req.body;
  if (!width || !height || isNaN(width) || isNaN(height)) {
    res.status(400).json({ error: "width and height required" }); return;
  }
  if (!originalDisplay) {
    originalDisplay = getDisplayInfo();
  }
  const ok = applyResolution(Number(width), Number(height));
  if (ok) {
    stretchActive = true;
    res.json({ ok: true, applied: { width, height }, original: originalDisplay });
  } else {
    res.status(500).json({ error: "Failed to apply resolution — admin rights required" });
  }
});

boosterRouter.post("/display/restore", (_req, res) => {
  if (!originalDisplay) { res.json({ ok: true, note: "nothing to restore" }); return; }
  const ok = applyResolution(originalDisplay.width, originalDisplay.height);
  if (ok) {
    stretchActive = false;
    const restored = originalDisplay;
    originalDisplay = null;
    res.json({ ok: true, restored });
  } else {
    res.status(500).json({ error: "Failed to restore resolution" });
  }
});

// VPN
boosterRouter.get("/vpn", (_req, res) => {
  res.json({ vpns: loadVpns(), activeId: activeVpnId });
});

boosterRouter.post("/vpn", (req, res) => {
  const { name, server, type, username, password, configPath } = req.body;
  if (!name || !server) { res.status(400).json({ error: "name and server required" }); return; }
  const vpns = loadVpns();
  const id = crypto.randomBytes(4).toString("hex");
  vpns.push({ id, name, server, type: type || "IKEv2", username, password, configPath });
  saveVpns(vpns);
  res.json({ id });
});

boosterRouter.delete("/vpn/:id", (req, res) => {
  if (req.params.id === activeVpnId) {
    // disconnect first
    if (isWindows()) {
      const vpns = loadVpns();
      const p = vpns.find((v: any) => v.id === req.params.id);
      if (p) { try { execSync(`rasdial "${p.name}" /DISCONNECT`, { stdio: "ignore" }); } catch { /* */ } }
    }
    if (vpnProc) { vpnProc.kill(); vpnProc = null; }
    activeVpnId = null;
  }
  saveVpns(loadVpns().filter((v: any) => v.id !== req.params.id));
  res.json({ ok: true });
});

boosterRouter.post("/vpn/:id/connect", (req, res) => {
  const vpns = loadVpns();
  const p = vpns.find((v: any) => v.id === req.params.id);
  if (!p) { res.status(404).json({ error: "not found" }); return; }

  // Disconnect existing
  if (activeVpnId) {
    if (vpnProc) { vpnProc.kill(); vpnProc = null; }
    activeVpnId = null;
  }

  try {
    if (isWindows()) {
      if (p.type === "OpenVPN") {
        const exe = existsSync("C:\\Program Files\\OpenVPN\\bin\\openvpn.exe")
          ? "C:\\Program Files\\OpenVPN\\bin\\openvpn.exe" : "openvpn";
        vpnProc = spawn(exe, ["--config", p.configPath], { detached: true });
      } else if (p.type === "WireGuard") {
        vpnProc = spawn("wireguard", ["/installtunnelservice", p.configPath], { detached: true });
      } else {
        const tunnel = p.type === "L2TP/IPsec" ? "L2tp" : p.type === "SSTP" ? "Sstp" : "IKEv2";
        execSync(`powershell -c "Add-VpnConnection -Name '${p.name}' -ServerAddress '${p.server}' -TunnelType ${tunnel} -Force"`, { stdio: "ignore" });
        if (p.username) {
          execSync(`rasdial "${p.name}" ${p.username} ${p.password || ""}`, { stdio: "ignore" });
        } else {
          execSync(`rasdial "${p.name}"`, { stdio: "ignore" });
        }
      }
    }
    activeVpnId = p.id;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message?.slice(0, 200) || "Connection failed" });
  }
});

boosterRouter.post("/vpn/disconnect", (_req, res) => {
  if (!activeVpnId) { res.json({ ok: true }); return; }
  const p = loadVpns().find((v: any) => v.id === activeVpnId);
  if (p && isWindows()) {
    if (p.type === "OpenVPN" || p.type === "WireGuard") {
      if (vpnProc) { vpnProc.kill(); vpnProc = null; }
    } else {
      try { execSync(`rasdial "${p.name}" /DISCONNECT`, { stdio: "ignore" }); } catch { /* */ }
    }
  } else if (vpnProc) {
    vpnProc.kill(); vpnProc = null;
  }
  activeVpnId = null;
  res.json({ ok: true });
});
