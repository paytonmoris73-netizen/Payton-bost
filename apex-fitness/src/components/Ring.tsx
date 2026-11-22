import type { ReactNode } from "react";

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  /** Fixed colour; by default the accent, turning a muted rose when over the goal. */
  color?: string;
  children?: ReactNode;
}

/** Thin circular progress ring. */
export default function Ring({ value, max, size = 200, stroke = 4, color, children }: Props) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const over = max > 0 && value > max;
  const tone = color ?? (over ? "#e3b5a4" : "#c9bbe8");
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
