import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { useApp } from "../state/AppContext";
import { useCountUp } from "../lib/useCountUp";

/* ---------- Buttons ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  gold: "gold-fill text-ink-950 font-bold shadow-glow-sm hover:brightness-110 active:brightness-95",
  ghost: "bg-ink-800 text-cream hover:bg-ink-700 border border-line",
  outline: "border border-gold-500/50 text-gold-300 hover:bg-gold-500/10",
  danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
};

const SIZE: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3.5 py-2 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "gold", size = "md", className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
});

/* ---------- Section header ---------- */

export function SectionHeader({
  title,
  to,
  action = "See all",
  hint,
}: {
  title: string;
  to?: string;
  action?: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 truncate text-xs text-cream-faint">{hint}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-gold-400 hover:text-gold-300"
        >
          {action}
          <Icon
            name="chevron-right"
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

/* ---------- Stat tile ---------- */

export function StatTile({
  icon,
  value,
  label,
  suffix,
  decimals = 0,
  accent = false,
}: {
  icon: IconName;
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
  accent?: boolean;
}) {
  const shown = useCountUp(value, 900, decimals);
  return (
    <div className="card relative overflow-hidden px-4 py-3.5">
      {accent && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
      )}
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cream-faint">
        <Icon name={icon} className={`h-3.5 w-3.5 ${accent ? "text-gold-400" : ""}`} />
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold leading-none tabular-nums">
        {shown.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix && <span className="ml-0.5 text-sm font-semibold text-cream-faint">{suffix}</span>}
      </div>
    </div>
  );
}

/* ---------- Progress ring ---------- */

export function ProgressRing({
  progress,
  size = 150,
  stroke = 11,
  trackColor = "#272217",
  children,
}: {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <defs>
          <linearGradient id="ring-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe294" />
            <stop offset="100%" stopColor="#d88a06" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ name, hue, size = 40 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white/95 ring-2 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${hue + 35} 70% 30%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ---------- Pro tag ---------- */

export function ProTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md gold-fill px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-950">
      <Icon name="crown" className="h-3 w-3" filled={false} />
      Pro
    </span>
  );
}

/* ---------- Toasts ---------- */

export function ToastStack() {
  const { toasts } = useApp();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card flex w-full max-w-sm items-center gap-3 border-gold-500/30 px-4 py-3"
          style={{ animation: "fadeUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gold-fill text-ink-950">
            <Icon name="check" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold">{t.title}</div>
            {t.body && <div className="truncate text-xs text-cream-dim">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Confirmation dialog ---------- */

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelBtn.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>("button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/85 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card w-full max-w-sm p-6 text-center"
        style={{ animation: "fadeUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both" }}
      >
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-cream-dim">{body}</div>
        <div className="mt-6 flex gap-3">
          <Button ref={cancelBtn} variant="ghost" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: IconName;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/20">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <div className="font-display text-lg font-bold">{title}</div>
      <p className="max-w-xs text-sm leading-relaxed text-cream-dim">{body}</p>
      {children}
    </div>
  );
}
