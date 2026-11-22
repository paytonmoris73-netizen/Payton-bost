/**
 * Visual-effects tier. "full" = real backdrop blur (Liquid Glass); "lite" = same look with
 * opaque frosted fills and no blur, for weak devices. "auto" picks per device and also
 * runs a short frame-rate probe, so slow phones drop to lite on their own.
 */
export type FxMode = "auto" | "full" | "lite";
const KEY = "crunch-fx";

interface NavigatorHints { deviceMemory?: number; hardwareConcurrency?: number; connection?: { saveData?: boolean } }

function weakHardware(): boolean {
  const n = navigator as Navigator & NavigatorHints;
  const mq = (q: string) => typeof matchMedia === "function" && matchMedia(q).matches;
  return (
    mq("(prefers-reduced-transparency: reduce)") ||
    (typeof n.deviceMemory === "number" && n.deviceMemory <= 2) ||
    (typeof n.hardwareConcurrency === "number" && n.hardwareConcurrency <= 2) ||
    !!n.connection?.saveData ||
    !(typeof CSS !== "undefined" && (CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)")))
  );
}

export function getFxMode(): FxMode {
  try { const v = localStorage.getItem(KEY); return v === "full" || v === "lite" ? v : "auto"; } catch { return "auto"; }
}

let probedSlow = false;
function setLite(on: boolean) { document.documentElement.classList.toggle("fx-lite", on); }

export function applyFx(mode: FxMode = getFxMode()) {
  setLite(mode === "lite" || (mode === "auto" && (weakHardware() || probedSlow)));
}

export function setFxMode(mode: FxMode) {
  try { if (mode === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch { /* storage blocked */ }
  applyFx(mode);
}

export function isLite(): boolean { return document.documentElement.classList.contains("fx-lite"); }

/** Measure ~45 frames once the page is idle; if the device can't hold ~35fps, switch to lite. */
export function probeFrameRate() {
  if (getFxMode() !== "auto" || isLite() || typeof requestAnimationFrame !== "function") return;
  const start = () => {
    if (document.visibilityState !== "visible") return;
    const deltas: number[] = []; let last = 0;
    const tick = (t: number) => {
      if (last) deltas.push(t - last);
      last = t;
      if (document.visibilityState !== "visible") return; // throttled tab: results meaningless
      if (deltas.length < 45) { requestAnimationFrame(tick); return; }
      deltas.sort((a, b) => a - b);
      if (deltas[Math.floor(deltas.length / 2)] > 28) { probedSlow = true; applyFx("auto"); }
    };
    requestAnimationFrame(tick);
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2000 }) : start()), 1200);
}

/** Crystal highlight that follows the mouse across `.lift` cards. One listener, rAF-throttled, mouse only. */
export function installSpecular() {
  if (typeof window === "undefined" || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
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
