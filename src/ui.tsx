import { useEffect, useState, type ReactNode } from "react";
import { photoFor } from "./photos";
import { G } from "./icons";
import { Link } from "react-router-dom";
import { create } from "zustand";
import { creatorOf, useStore } from "./store";
import { money, totalMin, DISCLAIMER_ALLERGEN, DISCLAIMER_NUTRITION } from "./engine";
import type { Nutrition, Recipe } from "./types";

/* ---------- toasts ---------- */
interface ToastState { items: { id: number; text: string; tone: "ok" | "err" }[]; push: (text: string, tone?: "ok" | "err") => void }
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (text, tone = "ok") => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200);
  },
}));
export const toast = (t: string, tone: "ok" | "err" = "ok") => useToast.getState().push(t, tone);
export function Toaster() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`animate-slide-up pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium shadow-float ${t.tone === "err" ? "bg-red-600 text-white" : "bg-charcoal text-ivory"}`}>{t.text}</div>
      ))}
    </div>
  );
}

/* ---------- primitives ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-charcoal/50 p-0 backdrop-blur-sm animate-fade-in md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`animate-slide-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-ivory p-5 shadow-float md:rounded-3xl md:p-7 ${wide ? "md:max-w-3xl" : "md:max-w-lg"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h-display text-2xl">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-lg hover:bg-cream-dark" aria-label="Close"><G g="✕" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-orange" style={{ fontSize: size }} aria-label={`${value.toFixed(1)} out of 5`}>
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
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 90%), hsl(${(hue + 25) % 360} 60% 82%))` }}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-40" style={{ background: `hsl(${hue} 80% 96%)` }} />
      <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full opacity-30" style={{ background: `hsl(${(hue + 40) % 360} 60% 70%)` }} />
      <span className={`relative drop-shadow-sm ${size}`} role="img" aria-hidden>{emoji}</span>
    </div>
  );
}
export function Avatar({ emoji, size = 40, hue = 30 }: { emoji: string; size?: number; hue?: number }) {
  return <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, fontSize: size * 0.5, background: `hsl(${hue} 60% 88%)` }}>{emoji}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) { return <div className={`skeleton ${className}`} />; }
export function Empty({ emoji = "🍽️", title, text, action }: { emoji?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-5xl text-orange"><G g={emoji} size={44} /></div><h3 className="h-display text-xl">{title}</h3>
      {text && <p className="max-w-sm text-sm text-brown">{text}</p>}{action && <div className="mt-2">{action}</div>}
    </div>
  );
}
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="h-display text-3xl md:text-4xl">{title}</h1>{sub && <p className="mt-1 max-w-2xl text-sm text-brown">{sub}</p>}</div>{action}
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
  return (
    <div className="no-scrollbar -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1" role="tablist">
      {tabs.map((t) => <button key={t} role="tab" aria-selected={t === value} onClick={() => onChange(t)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${t === value ? "bg-charcoal text-ivory" : "bg-cream text-charcoal hover:bg-cream-dark"}`}>{t}</button>)}
    </div>
  );
}
export function Meter({ label, value, color = "#F2A66B" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold"><span>{label}</span><span className="text-brown">{Math.round(value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} /></div>
    </div>
  );
}

export function SaveButton({ id, className = "" }: { id: string; className?: string }) {
  const saved = useStore((s) => s.saved.includes(id)); const toggle = useStore((s) => s.toggleSave);
  const [k, setK] = useState(0);
  return (
    <button aria-pressed={saved} aria-label={saved ? "Unsave recipe" : "Save recipe"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); setK((n) => n + 1); toast(saved ? "Removed from saved" : "Saved to your cookbook"); }}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-105 ${className}`}>
      <span key={k} className={`${k ? "pop" : ""} ${saved ? "text-orange" : "text-charcoal"}`}><G g={saved ? "♥" : "♡"} size={18} /></span>
    </button>
  );
}

export function RecipeCard({ r, compact, owned }: { r: Recipe; compact?: boolean; owned?: boolean }) {
  const accounts = useStore((s) => s.accounts); const c = creatorOf(r.creatorId, accounts);
  const bundle = !!r.bundleOf;
  return (
    <Link to={r.price > 0 || bundle ? `/marketplace/${r.id}` : `/recipe/${r.id}`} className={`group card block overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-card-hover ${compact ? "w-64 shrink-0" : ""}`}>
      <div className="relative">
        <Cover id={r.id} photo={r.photo} emoji={r.emoji} hue={r.hue} className={compact ? "h-36" : "aspect-[4/3]"} size="text-7xl transition-transform duration-300 group-hover:scale-110" />
        <SaveButton id={r.id} className="absolute right-3 top-3" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${owned ? "bg-sage text-charcoal" : r.price === 0 ? "bg-white/90" : "bg-orange text-charcoal"}`}>{owned ? "Owned" : bundle ? `Bundle · ${money(r.price)}` : money(r.price)}</span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{r.title}</h3>
        <p className="mt-0.5 text-xs text-brown">by {c.name}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-brown">
          <Stars value={r.rating} /> <span>{r.rating.toFixed(1)} ({r.reviews})</span>
        </div>
        {!bundle && <div className="mt-2 flex gap-2 text-xs"><span className="chip"><G g="⏱" /> {totalMin(r)} min</span><span className="chip">{r.difficulty}</span></div>}
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
      <div className="mb-2 flex items-baseline justify-between"><h4 className="font-semibold">Estimated nutrition</h4><span className="text-xs text-brown">per serving · {servings} servings</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rows.map(([l, v, u]) => <div key={l} className="rounded-xl bg-cream px-3 py-2"><div className="text-lg font-bold">{Math.round(v * 10) / 10}<span className="text-xs font-medium text-brown"> {u}</span></div><div className="text-xs text-brown">{l}</div></div>)}</div>
      <p className="mt-2 text-xs text-brown">{DISCLAIMER_NUTRITION}{partial ? " Some ingredients had no nutrition data, so totals are partial." : ""}</p>
    </div>
  );
}
export function AllergenNote({ allergens, diet }: { allergens: string[]; diet?: string[] }) {
  return (
    <div className="rounded-2xl border border-orange-light bg-orange-light/30 p-4 text-sm">
      <div className="mb-1 font-semibold">Allergens &amp; dietary labels</div>
      <div className="mb-2 flex flex-wrap gap-1.5">{allergens.length ? allergens.map((a) => <span key={a} className="chip bg-orange-light">Contains {a}</span>) : <span className="chip">No common allergens listed</span>}{diet?.map((d) => <span key={d} className="chip bg-sage-light">{d}</span>)}</div>
      <p className="text-xs text-brown">{DISCLAIMER_ALLERGEN}</p>
    </div>
  );
}

export function useDebounced<T>(v: T, ms = 200): T { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }
export function useLoading(ms = 350) { const [l, setL] = useState(true); useEffect(() => { const t = setTimeout(() => setL(false), ms); return () => clearTimeout(t); }, [ms]); return l; }
export function CardSkeletons({ n = 4 }: { n?: number }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="card overflow-hidden"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>;
}
export function ComingSoon({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-2">{children}<span className="rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">Coming soon</span></span>; }
export const grid = "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4";
