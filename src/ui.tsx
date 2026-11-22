import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Segmented } from "./glass";
import { photoFor } from "./photos";
import { G } from "./icons";
import { Link } from "react-router-dom";
import { create } from "zustand";
import { creatorOf, useStore } from "./store";
import { CREATORS } from "./data";
import { money, totalMin, DISCLAIMER_ALLERGEN, DISCLAIMER_NUTRITION } from "./engine";
import type { Nutrition, Recipe } from "./types";

/* ---------- toasts ---------- */
interface ToastState { items: { id: number; text: string; tone: "ok" | "err" }[]; push: (text: string, tone?: "ok" | "err") => void }
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (text, tone = "ok") => {
    const id = Date.now() + Math.random();
    set(() => ({ items: [{ id, text, tone }] })); // one at a time, newest replaces previous (iOS-style)
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200);
  },
}));
export const toast = (t: string, tone: "ok" | "err" = "ok") => useToast.getState().push(t, tone);
export function Toaster() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} role={t.tone === "err" ? "alert" : "status"} className={`toast-in glass-dark pointer-events-auto flex items-center gap-2 rounded-full py-2.5 pl-3 pr-5 text-sm font-semibold ${t.tone === "err" ? "!bg-red-600/90" : ""}`}>
          <span className={`grid h-6 w-6 place-items-center rounded-full ${t.tone === "err" ? "bg-white/20" : "bg-orange on-accent"}`} aria-hidden>{t.tone === "err" ? "!" : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ---------- app-wide helpers that work in every build (site, installed app, shared single-file link) ---------- */
const HASH_BUILD = !!import.meta.env.VITE_HASH_ROUTER;

/** Reload the app at a route. Works with normal and hash routing (a plain "/" would leave a shared link). */
export function reloadAt(path: string) {
  if (HASH_BUILD) { location.hash = "#" + path; location.reload(); } else location.assign(path);
}

/** Save a text file. Where downloads aren't allowed (the shared link), copy it to the clipboard instead and say so. */
export async function saveText(name: string, text: string, mime: string) {
  if (!HASH_BUILD) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Saved ${name}`); return;
  }
  try { await navigator.clipboard.writeText(text); toast("Copied. Paste it into a note or spreadsheet to keep it."); }
  catch { toast("Downloads aren't available here. Open Crunch on its website to save files.", "err"); }
}

/** In-app "Are you sure?" dialog (browser confirm() is blocked in some places and looks off-brand everywhere). */
const useAsk = create<{ q: { text: string; yes: string; danger?: boolean; done: (ok: boolean) => void } | null }>(() => ({ q: null }));
export function ask(text: string, yes = "OK", danger = false): Promise<boolean> {
  return new Promise((done) => {
    useAsk.getState().q?.done(false);
    useAsk.setState({ q: { text, yes, danger, done: (ok) => { useAsk.setState({ q: null }); done(ok); } } });
  });
}
export function AskHost() {
  const q = useAsk((s) => s.q);
  return (
    <Modal open={!!q} onClose={() => q?.done(false)} title="Are you sure?">
      <p className="text-sm text-brown">{q?.text}</p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => q?.done(false)}>Cancel</button>
        <button type="button" className={q?.danger ? "btn !bg-red-600 !text-white" : "btn-primary"} onClick={() => q?.done(true)}>{q?.yes ?? "OK"}</button>
      </div>
    </Modal>
  );
}

/* ---------- primitives ---------- */
/** Keeps a component mounted for its exit animation. */
export function usePresence(open: boolean, ms = 300) {
  // Derived during render (not in an effect) so a sheet mounts on the same frame as the tap.
  const [st, setSt] = useState({ open, leaving: false });
  if (st.open !== open) setSt({ open, leaving: !open });
  useEffect(() => {
    if (!st.leaving) return;
    const t = setTimeout(() => setSt((s) => (s.open ? s : { ...s, leaving: false })), ms); return () => clearTimeout(t);
  }, [st.leaving, ms]);
  return { mounted: open || st.leaving, leaving: !open && st.leaving };
}

/** Bottom sheet on phones (swipe down to close), floating glass dialog on larger screens. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const { mounted, leaving } = usePresence(open);
  const panel = useRef<HTMLDivElement>(null); const scrim = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const html = document.documentElement; const was = html.style.overflow; html.style.overflow = "hidden";
    const id = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    return () => { cancelAnimationFrame(id); window.removeEventListener("keydown", k); html.style.overflow = was; prev?.focus?.({ preventScroll: true }); };
  }, [open, onClose]);

  // Swipe-to-dismiss: writes transforms straight to the DOM (no React renders while dragging).
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || window.innerWidth >= 768 || (panel.current?.scrollTop ?? 0) > 0) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (panel.current) { panel.current.style.animation = "none"; panel.current.style.transition = "none"; }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !panel.current) return;
    const dy = e.clientY - d.y; d.dy = dy > 0 ? dy : dy / 6; // rubber-band upwards
    panel.current.style.transform = `translate3d(0,${d.dy}px,0)`;
    if (scrim.current) scrim.current.style.opacity = String(Math.max(0, 1 - Math.max(0, d.dy) / 500));
  };
  const onUp = () => {
    const d = drag.current; drag.current = null; const el = panel.current; if (!d || !el) return;
    const v = d.dy / Math.max(1, performance.now() - d.t);
    el.style.transition = "transform 420ms var(--ease-spring)";
    if (d.dy > 110 || (v > 0.6 && d.dy > 30)) { el.style.transform = "translate3d(0,110%,0)"; onClose(); }
    else { el.style.transform = ""; if (scrim.current) { scrim.current.style.transition = "opacity 300ms ease"; scrim.current.style.opacity = ""; } }
  };

  if (!mounted) return null;
  const dragged = !!panel.current?.style.transform && leaving;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={scrim} className={`scrim-blur absolute inset-0 ${leaving ? "backdrop-out" : "backdrop-in"}`} onMouseDown={onClose} aria-hidden />
      <div ref={panel} tabIndex={-1} className={`sheet relative max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-t-[2rem] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 outline-none md:rounded-[2rem] md:p-7 ${wide ? "md:max-w-3xl" : "md:max-w-lg"} ${dragged ? "" : leaving ? "sheet-out" : "sheet-in"}`}>
        <div className="-mx-5 -mt-2 touch-none px-5 pt-2 md:mx-0 md:mt-0 md:touch-auto md:p-0" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-charcoal/20 md:hidden" aria-hidden />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="h-display text-2xl">{title}</h2>
            <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-charcoal/[0.07] text-charcoal/70 hover:bg-charcoal/10" aria-label="Close"><G g="✕" size={15} /></button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span role="img" className="inline-flex items-center gap-0.5 text-orange" style={{ fontSize: size }} aria-label={`${value.toFixed(1)} out of 5`}>
      {"★★★★★".split("").map((_, i) => <span key={i} className={i + 0.5 <= value ? "" : "opacity-25"}><G g="★" /></span>)}
    </span>
  );
}
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return <div className="flex gap-1 text-2xl">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? "text-orange" : "text-cream-dark"} aria-label={`${n} stars`}><G g="★" /></button>)}</div>;
}

export function Cover({ emoji, hue, className = "", size = "text-6xl", id, photo }: { emoji: string; hue: number; className?: string; size?: string; id?: string; photo?: string }) {
  const src = photoFor(id, photo);
  if (src) return <div className={`relative overflow-hidden bg-cream ${className}`}><img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /></div>;
  return (
    <div className={`cover-gloss relative grid place-items-center overflow-hidden ${className}`} style={{ "--h": hue } as CSSProperties}>
      <span className="cover-plate" aria-hidden />
      <span className={`cover-food relative ${size}`} role="img" aria-hidden>{emoji}</span>
    </div>
  );
}
export function Avatar({ emoji, size = 40, hue = 30 }: { emoji: string; size?: number; hue?: number }) {
  return <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, fontSize: size * 0.5, background: `hsl(${hue} 60% 88%)` }}>{emoji}</span>;
}

/** Profile icon for anyone who comments or reviews. Looked up live (accounts, then creators by id or name),
 *  so changing your icon in Settings updates every comment you've ever written. */
export function UserFace({ userId, name, size = 32 }: { userId?: string; name: string; size?: number }) {
  const accounts = useStore((s) => s.accounts);
  const acct = (userId && accounts.find((a) => a.id === userId)) || accounts.find((a) => a.name === name);
  const creator = CREATORS.find((c) => c.id === userId) || CREATORS.find((c) => c.name === name);
  const emoji = acct?.emoji ?? creator?.emoji ?? "🧑‍🍳";
  const hue = creator?.hue ?? [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 20);
  return <Avatar emoji={emoji} size={size} hue={hue} />;
}
export function Skeleton({ className = "" }: { className?: string }) { return <div className={`skeleton ${className}`} />; }
export function Empty({ emoji = "🍽️", title, text, action }: { emoji?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card rise-in flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 grid h-20 w-20 place-items-center rounded-[1.6rem] text-5xl text-orange tile"><G g={emoji} size={40} /></div><h2 className="h-display text-xl">{title}</h2>
      {text && <p className="max-w-sm text-sm text-brown">{text}</p>}{action && <div className="mt-2">{action}</div>}
    </div>
  );
}
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="h-display text-[2rem] leading-tight md:text-[2.6rem]">{title}</h1>{sub && <p className="mt-1 max-w-2xl text-sm text-brown">{sub}</p>}</div>{action}
    </div>
  );
}
export function Section({ title, sub, to, children }: { title: string; sub?: string; to?: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-end justify-between"><div><h2 className="h-display text-2xl">{title}</h2>{sub && <p className="text-sm text-brown">{sub}</p>}</div>{to && <Link to={to} className="text-sm font-semibold text-brown hover:text-charcoal">See all →</Link>}</div>
      {children}
    </section>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (t: T) => void }) {
  return <Segmented role="tablist" options={tabs} value={value} onChange={onChange} className="mb-5" />;
}
export function Meter({ label, value, color = "rgb(var(--orange))" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold"><span>{label}</span><span className="text-brown">{Math.round(value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-charcoal/[0.07]"><div className="h-full w-full origin-left rounded-full transition-transform duration-700 [transition-timing-function:var(--ease-spring)]" style={{ transform: `scaleX(${Math.max(2, Math.min(100, value)) / 100})`, background: color }} /></div>
    </div>
  );
}

export function SaveButton({ id, className = "" }: { id: string; className?: string }) {
  const saved = useStore((s) => s.saved.includes(id)); const toggle = useStore((s) => s.toggleSave);
  const [k, setK] = useState(0);
  return (
    <button aria-pressed={saved} aria-label={saved ? "Unsave recipe" : "Save recipe"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); setK((n) => n + 1); toast(saved ? "Removed from saved" : "Saved to your cookbook"); }}
      className={`glass press grid h-9 w-9 place-items-center rounded-full ${className}`}>
      <span key={k} className={`${k ? "pop" : ""} ${saved ? "text-orange" : "text-charcoal"}`}><G g={saved ? "♥" : "♡"} size={18} /></span>
    </button>
  );
}

export function RecipeCard({ r, compact, owned }: { r: Recipe; compact?: boolean; owned?: boolean }) {
  const accounts = useStore((s) => s.accounts); const c = creatorOf(r.creatorId, accounts);
  const bundle = !!r.bundleOf;
  return (
    <Link to={r.price > 0 || bundle ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className={`group card lift block overflow-hidden ${compact ? "w-64 shrink-0" : ""}`}>
      <div className="relative">
        <Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className={`m-1.5 rounded-[1.15rem] ${compact ? "h-36" : "aspect-[4/3]"}`} size="text-6xl sm:text-7xl transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:scale-110" />
        <SaveButton id={r.id} className="absolute right-4 top-4" />
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${owned ? "bg-sage on-sage" : r.price === 0 ? "glass" : "bg-orange on-accent"}`}>{owned ? "Owned" : bundle ? `Bundle · ${money(r.price)}` : money(r.price)}</span>
      </div>
      <div className="px-3.5 pb-4 pt-2 sm:px-4">
        <div className="line-clamp-1 font-semibold">{r.title}</div>
        <p className="mt-0.5 truncate text-xs text-brown">by {c.name}</p>
        <div className="mt-2 flex items-center gap-1.5 whitespace-nowrap text-xs text-brown">
          <Stars value={r.rating} size={12} /> <span>{r.rating.toFixed(1)} <span className="hidden sm:inline">({r.reviews})</span></span>
        </div>
        {!bundle && <div className="mt-2 flex flex-wrap gap-1.5 text-xs"><span className="chip whitespace-nowrap"><G g="⏱" /> {totalMin(r)} min</span><span className="chip">{r.difficulty}</span></div>}
        {bundle && <div className="mt-2 text-xs text-brown">{r.bundleOf!.length} recipes</div>}
        {!compact && <p className="mt-2 line-clamp-2 text-xs text-brown">{r.description}</p>}
      </div>
    </Link>
  );
}

export function NutritionPanel({ n, servings, partial }: { n: Nutrition; servings: number; partial?: boolean }) {
  const rows: [string, number, string][] = [["Calories", n.calories, "kcal"], ["Protein", n.protein, "g"], ["Carbs", n.carbs, "g"], ["Fat", n.fat, "g"], ["Fibre", n.fiber, "g"], ["Sugar", n.sugar, "g"], ["Sodium", n.sodium, "mg"]];
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between"><h3 className="font-semibold">Estimated nutrition</h3><span className="text-xs text-brown">per serving · {servings} servings</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rows.map(([l, v, u]) => <div key={l} className="tile px-3 py-2"><div className="text-lg font-bold">{Math.round(v * 10) / 10}<span className="text-xs font-medium text-brown"> {u}</span></div><div className="text-xs text-brown">{l}</div></div>)}</div>
      <p className="mt-2 text-xs text-brown">{DISCLAIMER_NUTRITION}{partial ? " Some ingredients had no nutrition data, so totals are partial." : ""}</p>
    </div>
  );
}
export function AllergenNote({ allergens, diet }: { allergens: string[]; diet?: string[] }) {
  return (
    <div className="rounded-[1.25rem] border border-white/70 bg-orange-light/35 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
      <div className="mb-1 font-semibold">Allergens &amp; dietary labels</div>
      <div className="mb-2 flex flex-wrap gap-1.5">{allergens.length ? allergens.map((a) => <span key={a} className="chip bg-orange-light">Contains {a}</span>) : <span className="chip">No common allergens listed</span>}{diet?.map((d) => <span key={d} className="chip bg-sage-light">{d}</span>)}</div>
      <p className="text-xs text-brown">{DISCLAIMER_ALLERGEN}</p>
    </div>
  );
}

export function useDebounced<T>(v: T, ms = 200): T { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }
export function useLoading(ms = 350) { const [l, setL] = useState(true); useEffect(() => { const t = setTimeout(() => setL(false), ms); return () => clearTimeout(t); }, [ms]); return l; }
export function CardSkeletons({ n = 4 }: { n?: number }) {
  return <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="card overflow-hidden p-1.5"><Skeleton className="aspect-[4/3] rounded-[1.15rem]" /><div className="space-y-2 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>;
}
export function ComingSoon({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-2">{children}<span className="rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">Coming soon</span></span>; }
export const grid = "stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4";
