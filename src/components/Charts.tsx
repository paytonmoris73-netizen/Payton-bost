// Pure SVG charts — no library, zero bundle overhead.

interface BarDatum { label: string; value: number; color?: string; }

export function BarChart({ data, height = 180, formatValue, color = "var(--primary)" }: {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
}) {
  const W = 400;
  const H = height;
  const PAD = { t: 24, r: 8, b: 30, l: 44 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const max = Math.max(...data.map(d => d.value), 0.01);
  const n = data.length || 1;
  const slot = cW / n;
  const barW = Math.min(slot * 0.55, 36);
  const ticks = 4;
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      {/* Grid + Y labels */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = PAD.t + cH - (i / ticks) * cH;
        const val = (i / ticks) * max;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{fmt(val)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = d.value <= 0 ? 0 : Math.max((d.value / max) * cH, 2);
        const x = PAD.l + slot * i + (slot - barW) / 2;
        const y = PAD.t + cH - barH;
        const barColor = d.color ?? color;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={barColor} rx="3" opacity="0.9" />
            <text x={x + barW / 2} y={PAD.t + cH + 16} textAnchor="middle" fontSize="9" fill="#64748b">{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="8.5" fill="#475569">{fmt(d.value)}</text>
            )}
          </g>
        );
      })}

      {/* Baseline */}
      <line x1={PAD.l} y1={PAD.t + cH} x2={PAD.l + cW} y2={PAD.t + cH} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

export function LineChart({ data, height = 160, formatValue, color = "var(--primary)" }: {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
}) {
  const W = 400;
  const H = height;
  const PAD = { t: 16, r: 16, b: 28, l: 44 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const max = Math.max(...data.map(d => d.value), 0.01);
  const n = data.length;
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));
  const ticks = 3;

  const pts = data.map((d, i) => {
    const x = PAD.l + (i / Math.max(n - 1, 1)) * cW;
    const y = PAD.t + cH - (d.value / max) * cH;
    return { x, y, d };
  });

  // Smooth path
  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${pt.y} ${pt.x} ${pt.y}`;
  }, "");

  // Fill area
  const fillD = pts.length > 0
    ? `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`
    : "";

  const fillId = `fill-${Math.random().toString(36).slice(2)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = PAD.t + cH - (i / ticks) * cH;
        const val = (i / ticks) * max;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{fmt(val)}</text>
          </g>
        );
      })}

      {/* Fill */}
      {fillD && <path d={fillD} fill={`url(#${fillId})`} />}

      {/* Line */}
      {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

      {/* Points + labels */}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
          <text x={pt.x} y={PAD.t + cH + 16} textAnchor="middle" fontSize="9" fill="#64748b">{pt.d.label}</text>
        </g>
      ))}

      <line x1={PAD.l} y1={PAD.t + cH} x2={PAD.l + cW} y2={PAD.t + cH} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

export function HorizontalBar({ data, formatValue }: {
  data: Array<{ label: string; value: number; sub?: string; color?: string }>;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 0.01);
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 500, color: "var(--text)" }}>{d.label}</span>
            <span style={{ color: "var(--text-secondary)" }}>{d.sub ?? fmt(d.value)}</span>
          </div>
          <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
              background: d.color ?? "var(--primary)",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ segments, size = 120 }: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const R = 40;
  const cx = 50;
  const cy = 50;
  let angle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const start = angle;
    angle += frac * Math.PI * 2;
    const end = angle;
    const x1 = cx + R * Math.cos(start);
    const y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end);
    const y2 = cy + R * Math.sin(end);
    const large = frac > 0.5 ? 1 : 0;
    return { ...seg, frac, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} stroke="#fff" strokeWidth="1" />
      ))}
      <circle cx={cx} cy={cy} r={26} fill="#fff" />
    </svg>
  );
}
