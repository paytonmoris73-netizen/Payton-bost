import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Opt<T extends string> = T | { value: T; label: ReactNode };
const val = <T extends string>(o: Opt<T>): T => (typeof o === "string" ? o : o.value);
const lab = <T extends string>(o: Opt<T>): ReactNode => (typeof o === "string" ? o : o.label);

/* ---------- sliding thumb (shared by Segmented + Tabs) ---------- */
function useThumb(active: string) {
  const track = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const measure = useCallback(() => {
    const el = track.current?.querySelector<HTMLElement>('[data-active="true"]');
    setBox(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, []);
  useLayoutEffect(measure, [active, measure]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true)); // no slide on first paint
    const el = track.current; if (!el || typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(id);
    const ro = new ResizeObserver(measure); ro.observe(el);
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, [measure]);
  const thumbStyle = box ? { width: box.w, transform: `translate3d(${box.x - 4}px,0,0)`, left: 4, transition: animate ? undefined : "none" } : { opacity: 0 };
  return { track, thumbStyle };
}

/** iOS segmented control with a spring-animated glass thumb. Scrolls horizontally when it overflows. */
export function Segmented<T extends string>({ options, value, onChange, size, dark, label, className = "", role = "radiogroup" }: {
  options: readonly Opt<T>[]; value: T; onChange: (v: T) => void; size?: "sm"; dark?: boolean; label?: string; className?: string; role?: "radiogroup" | "tablist";
}) {
  const { track, thumbStyle } = useThumb(value);
  useEffect(() => { track.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }, [value, track]);
  const item = role === "tablist" ? "tab" : "radio";
  return (
    <div className={`no-scrollbar max-w-full overflow-x-auto ${className}`}>
      <div ref={track} className={`seg ${size === "sm" ? "sm" : ""}`} role={role} aria-label={label}>
        <span className={`seg-thumb ${dark ? "dark" : ""}`} style={thumbStyle} aria-hidden />
        {options.map((o) => {
          const v = val(o); const on = v === value;
          return (
            <button key={v} type="button" role={item} aria-checked={item === "radio" ? on : undefined} aria-selected={item === "tab" ? on : undefined}
              data-active={on} onClick={() => onChange(v)} className="seg-item">{lab(o)}</button>
          );
        })}
      </div>
    </div>
  );
}

/** Wrap of glass chips. Single-select (radio) or multi-select (toggle) with a popping check mark. */
export function Picks<T extends string>({ options, value, onChange, multi, tone, size, label }: {
  options: readonly Opt<T>[]; value: T | readonly T[]; onChange: (v: any) => void; multi?: boolean; tone?: "sage"; size?: "sm"; label?: string; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const sel = (v: T) => (multi ? (value as readonly T[]).includes(v) : value === v);
  const toggle = (v: T) => {
    if (!multi) return onChange(v);
    const cur = value as readonly T[]; onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5" role={multi ? "group" : "radiogroup"} aria-label={label}>
      {options.map((o) => {
        const v = val(o); const on = sel(v);
        return (
          <button key={v} type="button" onClick={() => toggle(v)} className={`pick ${tone ?? ""} ${size ?? ""}`}
            {...(multi ? { "aria-pressed": on } : { role: "radio", "aria-checked": on })}>
            <span className="tick" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
            {lab(o)}
          </button>
        );
      })}
    </div>
  );
}

/** − value + stepper. The value stays typeable. */
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix, label, id }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string; label: string; id?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  const commit = (s: string) => { const n = Number(s); onChange(Number.isFinite(n) && s.trim() !== "" ? clamp(n) : value); };
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - step))} disabled={value <= min} aria-label={`Decrease ${label}`}>−</button>
      <span className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
        <input id={id} className="!w-14" inputMode="decimal" value={draft} aria-label={label}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))} onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); if (e.key === "ArrowUp") { e.preventDefault(); onChange(clamp(value + step)); } if (e.key === "ArrowDown") { e.preventDefault(); onChange(clamp(value - step)); } }} />
        {suffix && <span className="-ml-3 text-xs font-semibold text-brown">{suffix}</span>}
      </span>
      <button type="button" onClick={() => onChange(clamp(value + step))} disabled={value >= max} aria-label={`Increase ${label}`}>+</button>
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="switch" />;
}

/** Glass pop-up menu replacing native <select>. Portalled so it never gets clipped by scrolling sheets. */
export function Select<T extends string>({ value, onChange, options, id, label, className = "", placeholder }: {
  value: T; onChange: (v: T) => void; options: readonly Opt<T>[]; id?: string; label?: string; className?: string; placeholder?: string;
}) {
  const btn = useRef<HTMLButtonElement>(null); const list = useRef<HTMLDivElement>(null); const uid = useId();
  const [open, setOpen] = useState(false); const [hl, setHl] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; up: boolean }>({ left: 0, width: 0, up: false });
  const idx = Math.max(0, options.findIndex((o) => val(o) === value));
  const current = options[idx];

  const place = () => {
    const r = btn.current!.getBoundingClientRect(); const vh = window.innerHeight;
    const want = Math.min(320, options.length * 44 + 12); const up = vh - r.bottom < want + 12 && r.top > vh - r.bottom;
    const width = Math.max(r.width, 180); const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos(up ? { left, width, bottom: vh - r.top + 6, up } : { left, width, top: r.bottom + 6, up });
  };
  const show = () => { place(); setHl(idx); setOpen(true); };
  const close = (refocus = true) => { setOpen(false); if (refocus) btn.current?.focus(); };
  const choose = (i: number) => { onChange(val(options[i])); close(); };

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false); };
    const off = (e: Event) => { if (!list.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("pointerdown", away, true); window.addEventListener("resize", off); window.addEventListener("scroll", off, true);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }));
    list.current?.focus({ preventScroll: true });
    return () => { document.removeEventListener("pointerdown", away, true); window.removeEventListener("resize", off); window.removeEventListener("scroll", off, true); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const keys = (e: React.KeyboardEvent) => {
    if (!open) { if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); } return; }
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(options.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setHl(0); }
    else if (e.key === "End") { e.preventDefault(); setHl(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(hl); }
  };
  useEffect(() => { if (open) list.current?.querySelector<HTMLElement>(`[data-i="${hl}"]`)?.scrollIntoView({ block: "nearest" }); }, [hl, open]);

  return (
    <>
      <button ref={btn} id={id} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? uid : undefined} aria-label={label}
        onClick={() => (open ? close() : show())} onKeyDown={keys}
        className={`input press flex items-center justify-between gap-2 text-left ${className}`}>
        <span className="truncate">{current ? lab(current) : <span className="text-brown-light">{placeholder}</span>}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A725E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && createPortal(
        <div ref={list} id={uid} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${uid}-${hl}`} onKeyDown={keys}
          className="menu pop-in fixed z-[95] max-h-[320px] overflow-y-auto outline-none"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, ["--origin" as string]: pos.up ? "bottom center" : "top center" }}>
          {options.map((o, i) => {
            const on = val(o) === value;
            return (
              <div key={val(o)} id={`${uid}-${i}`} data-i={i} role="option" aria-selected={on} data-hl={i === hl}
                onPointerEnter={() => setHl(i)} onClick={() => choose(i)} className="menu-item cursor-pointer">
                <span className="grid w-4 place-items-center text-orange-dark">{on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
                <span className="flex-1">{lab(o)}</span>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
