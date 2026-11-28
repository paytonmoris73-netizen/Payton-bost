import { create } from "zustand";

/**
 * Rendering + motion preferences.
 *
 * Effects tier ("fx"): "full" = live backdrop blur and every paint effect; "lite" = the same design and the
 * same animations, painted the cheap way (no live blur, no filters, simple shadows, opaque surfaces).
 * "auto" starts in full on capable hardware and drops to lite when:
 *   - the device is known to be weak (old iOS, low memory, Save-Data, no backdrop-filter), or
 *   - frames are actually being dropped while the user scrolls (measured, then remembered for next launch).
 *
 * Motion, transparency, video autoplay and the FPS meter are separate user choices (Settings → Appearance).
 */
export type FxMode = "auto" | "full" | "lite";
export type MotionMode = "system" | "full" | "reduced";

const KEY = "crunch-fx";
const PROBE_KEY = "crunch-fx-probe";
const PREFS_KEY = "crunch-perf";

interface NavigatorHints { deviceMemory?: number; hardwareConcurrency?: number; connection?: { saveData?: boolean } }
const mq = (q: string) => typeof matchMedia === "function" && matchMedia(q).matches;
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

/** iOS major version from the UA (iPhone/iPod/iPad-with-mobile-UA), or 0 if not iOS. */
function iosMajor(): number {
  const m = /(?:iPhone|iPod|iPad).*? OS (\d+)_/.exec(navigator.userAgent);
  return m ? Number(m[1]) : 0;
}

/** Devices that can't keep 60fps with live blur + layered paint. iPhone 8 / X and older top out at iOS 16. */
export function weakHardware(): boolean {
  const n = navigator as Navigator & NavigatorHints;
  const ios = iosMajor();
  const touch = mq("(pointer: coarse)");
  return (
    (ios > 0 && ios <= 16) ||
    (typeof n.deviceMemory === "number" && (n.deviceMemory <= 2 || (touch && n.deviceMemory <= 4))) ||
    (typeof n.hardwareConcurrency === "number" && n.hardwareConcurrency <= 4 && touch && !ios) ||
    !!n.connection?.saveData ||
    !(typeof CSS !== "undefined" && (CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)")))
  );
}

export function getFxMode(): FxMode {
  const v = store.get(KEY); return v === "full" || v === "lite" ? v : "auto";
}

/* ---------- user preferences (reactive, for Settings and components) ---------- */
export interface PerfPrefs { motion: MotionMode; transparency: boolean; autoplay: boolean; fps: boolean }
const PERF_DEFAULTS: PerfPrefs = { motion: "system", transparency: false, autoplay: true, fps: false };
function readPerf(): PerfPrefs {
  try {
    const v = JSON.parse(store.get(PREFS_KEY) ?? "{}");
    return {
      motion: ["system", "full", "reduced"].includes(v.motion) ? v.motion : PERF_DEFAULTS.motion,
      transparency: typeof v.transparency === "boolean" ? v.transparency : PERF_DEFAULTS.transparency,
      autoplay: typeof v.autoplay === "boolean" ? v.autoplay : PERF_DEFAULTS.autoplay,
      fps: typeof v.fps === "boolean" ? v.fps : PERF_DEFAULTS.fps,
    };
  } catch { return { ...PERF_DEFAULTS }; }
}

interface PerfState extends PerfPrefs {
  fx: FxMode; lite: boolean;
  setFx: (m: FxMode) => void;
  set: (p: Partial<PerfPrefs>) => void;
  reset: () => void;
}
export const usePerf = create<PerfState>((set, get) => {
  const save = () => { const s = get(); store.set(PREFS_KEY, JSON.stringify({ motion: s.motion, transparency: s.transparency, autoplay: s.autoplay, fps: s.fps })); applyPrefs(); };
  return {
    ...readPerf(), fx: getFxMode(), lite: false,
    setFx: (fx) => { store.set(KEY, fx === "auto" ? null : fx); if (fx !== "auto") store.set(PROBE_KEY, null); set({ fx }); applyFx(fx); },
    set: (p) => { set(p); save(); },
    reset: () => { store.set(KEY, null); store.set(PROBE_KEY, null); set({ ...PERF_DEFAULTS, fx: "auto" }); save(); applyFx("auto"); },
  };
});

let probedSlow = store.get(PROBE_KEY) === "slow";
const root = () => document.documentElement;

export function applyFx(mode: FxMode = getFxMode()) {
  const lite = mode === "lite" || (mode === "auto" && (weakHardware() || probedSlow));
  root().classList.toggle("fx-lite", lite);
  if (usePerf.getState().lite !== lite) usePerf.setState({ lite });
}
/** Back-compat wrapper used by older call sites. */
export function setFxMode(mode: FxMode) { usePerf.getState().setFx(mode); }
export function isLite(): boolean { return root().classList.contains("fx-lite"); }

/** True when motion should be calm: user chose Reduce Motion, or follows a system that asks for it. */
export function motionReduced(): boolean {
  const m = usePerf.getState().motion;
  return m === "reduced" || (m === "system" && mq("(prefers-reduced-motion: reduce)"));
}

function applyPrefs() {
  const s = usePerf.getState(); const r = root();
  r.classList.toggle("reduce-motion", motionReduced());
  r.classList.toggle("motion-full", s.motion === "full");
  r.classList.toggle("reduce-transparency", s.transparency || mq("(prefers-reduced-transparency: reduce)"));
  toggleFpsMeter(s.fps);
}

/** Call once at startup, before first render. */
export function initFx() {
  applyFx();
  applyPrefs();
  if (typeof matchMedia === "function") {
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", applyPrefs);
    matchMedia("(prefers-reduced-transparency: reduce)").addEventListener?.("change", applyPrefs);
  }
  watchScrollJank();
}

/**
 * Measures real frame times while the user is scrolling (the moment smoothness matters) instead of on an idle
 * page, where every device reports 60fps. If more than ~1 in 5 scroll frames misses the 60fps budget by a
 * clear margin, auto mode switches to lite and remembers it, so the next launch starts smooth.
 */
function watchScrollJank() {
  if (typeof requestAnimationFrame !== "function") return;
  let lastScroll = 0; let running = false; let last = 0; let total = 0; let slow = 0;
  const done = () => total >= 150 || isLite() || getFxMode() !== "auto";
  const tick = (t: number) => {
    if (performance.now() - lastScroll > 160 || document.visibilityState !== "visible") { running = false; last = 0; return; }
    if (last) { const d = t - last; if (d < 250) { total++; if (d > 22) slow++; } }
    last = t;
    if (done()) {
      running = false;
      if (total >= 150 && slow / total > 0.2 && getFxMode() === "auto") { probedSlow = true; store.set(PROBE_KEY, "slow"); applyFx("auto"); }
      window.removeEventListener("scroll", onScroll, true);
      return;
    }
    requestAnimationFrame(tick);
  };
  const onScroll = () => { lastScroll = performance.now(); if (!running && !done()) { running = true; requestAnimationFrame(tick); } };
  // Capture phase: also sees scrolling inside the Bites feed and other scroll containers.
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
}

/* ---------- FPS meter (opt-in, Settings → Appearance) ---------- */
let meter: { el: HTMLElement; raf: number } | null = null;
function toggleFpsMeter(on: boolean) {
  if (!on) { if (meter) { cancelAnimationFrame(meter.raf); meter.el.remove(); meter = null; } return; }
  if (meter || typeof document === "undefined") return;
  const el = document.createElement("div"); el.className = "fps-meter"; el.setAttribute("aria-hidden", "true"); el.textContent = "— fps";
  document.body.appendChild(el);
  let frames = 0; let start = performance.now(); let worst = 0; let prev = start;
  const m = { el, raf: 0 }; meter = m;
  const loop = (t: number) => {
    frames++; worst = Math.max(worst, t - prev); prev = t;
    if (t - start >= 500) {
      const fps = Math.round((frames * 1000) / (t - start));
      el.textContent = `${fps} fps · ${Math.round(worst)}ms`;
      el.dataset.state = fps >= 55 ? "good" : fps >= 40 ? "ok" : "bad";
      frames = 0; start = t; worst = 0;
    }
    m.raf = requestAnimationFrame(loop);
  };
  m.raf = requestAnimationFrame(loop);
}

/** Crystal highlight that follows the mouse across `.lift` cards. One listener, rAF-throttled, mouse only. */
export function installSpecular() {
  if (typeof window === "undefined" || !mq("(hover: hover) and (pointer: fine)")) return;
  let pending: { el: HTMLElement; x: number; y: number } | null = null; let raf = 0;
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || isLite()) return;
    const el = (e.target as Element | null)?.closest?.<HTMLElement>(".lift"); if (!el) return;
    pending = { el, x: e.clientX, y: e.clientY };
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0; if (!pending) return;
      const r = pending.el.getBoundingClientRect();
      pending.el.style.setProperty("--mx", `${pending.x - r.left}px`);
      pending.el.style.setProperty("--my", `${pending.y - r.top}px`);
    });
  }, { passive: true });
}
