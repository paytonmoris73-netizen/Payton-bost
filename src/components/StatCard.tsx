import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "blue" | "orange" | "red";
  icon?: ReactNode;
  delta?: { value: string; up: boolean };
}

// Parse a value that holds exactly one number, e.g. "$1,240.00", "12", "5h".
function parseValue(v: string | number): { prefix: string; num: number; decimals: number; suffix: string } | null {
  const s = String(v);
  const m = s.match(/^(\D*?)(-?[\d,]+(?:\.\d+)?)(\D*)$/);
  if (!m) return null;
  const raw = m[2].replace(/,/g, "");
  const num = parseFloat(raw);
  if (!isFinite(num)) return null;
  const dot = raw.indexOf(".");
  const decimals = dot === -1 ? 0 : raw.length - dot - 1;
  return { prefix: m[1], num, decimals, suffix: m[3] };
}

function format(n: number, decimals: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Animate from the previously shown number to the new one whenever it changes.
function useCountUp(target: number | null, decimals: number): number {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === null) return;
    const from = fromRef.current;
    const to = target;
    if (from === to) { setDisplay(to); return; }

    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { fromRef.current = to; setDisplay(to); return; }

    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, decimals]);

  return display;
}

export function StatCard({ label, value, sub, color, icon, delta }: Props) {
  const parsed = parseValue(value);
  const animated = useCountUp(parsed ? parsed.num : null, parsed?.decimals ?? 0);
  const display = parsed ? parsed.prefix + format(animated, parsed.decimals) + parsed.suffix : String(value);

  return (
    <div className={`stat-card${color ? ` ${color}` : ""}`}>
      <div className="stat-card-top">
        {icon && <span className="stat-icon">{icon}</span>}
        {delta && <span className={`stat-delta${delta.up ? " up" : " down"}`}>{delta.up ? "↑" : "↓"} {delta.value}</span>}
      </div>
      <div className="stat-card-value">{display}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
