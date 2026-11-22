interface Props {
  values: number[];
  height?: number;
}

/** Minimal area/line chart in SVG. Needs at least two points to draw a line. */
export default function LineChart({ values, height = 120 }: Props) {
  const w = 320;
  const h = height;
  const pad = 10;
  if (values.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-white/40">No data yet</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (values.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (values.length - 1));
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = pts.join(" ");
  const area = `${x(0)},${h} ${line} ${x(values.length - 1)},${h}`;
  const last = values.length - 1;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a1f" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
        </linearGradient>
      </defs>
      {values.length > 1 && <polygon points={area} fill="url(#chartfill)" />}
      {values.length > 1 && (
        <polyline points={line} fill="none" stroke="#ff8a1f" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      )}
      <circle cx={x(last)} cy={y(values[last])} r="4.5" fill="#ff8a1f" stroke="#0b0b0c" strokeWidth="2" />
    </svg>
  );
}
