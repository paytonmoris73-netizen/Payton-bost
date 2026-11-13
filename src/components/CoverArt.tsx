import { useMemo } from "react";
import { rngFor } from "../lib/seed";
import type { Emblem } from "../data/workouts";

/**
 * Generated cover artwork. Each workout gets a distinct, deterministic
 * composition built from its own motif — no stock gradients, no giant
 * watermark icons.
 */

const W = 400;
const H = 200;

type Rand = () => number;

function flame(rand: Rand, accent: string) {
  // Upward heat plumes: tapering arcs that lean and overlap.
  const plumes = Array.from({ length: 9 }, (_, i) => {
    const x = 14 + i * 46 + rand() * 16;
    const h = 95 + rand() * 105;
    const lean = (rand() - 0.5) * 52;
    const w = 15 + rand() * 15;
    return (
      <path
        key={i}
        d={`M${x} ${H + 10}
            C ${x - w} ${H - h * 0.45}, ${x + lean - w * 0.5} ${H - h * 0.8}, ${x + lean} ${H - h}
            C ${x + lean + w * 0.5} ${H - h * 0.8}, ${x + w} ${H - h * 0.45}, ${x} ${H + 10} Z`}
        fill={accent}
        opacity={0.07 + rand() * 0.1}
      />
    );
  });
  return <g>{plumes}</g>;
}

function bolt(rand: Rand, accent: string) {
  // Angular fracture shards radiating from a strike point.
  const ox = 130 + rand() * 140;
  const shards = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.4;
    const len = 90 + rand() * 150;
    const spread = 0.1 + rand() * 0.14;
    const p1 = [ox + Math.cos(a - spread) * len, 100 + Math.sin(a - spread) * len];
    const p2 = [ox + Math.cos(a + spread) * len, 100 + Math.sin(a + spread) * len];
    const mid = [ox + Math.cos(a) * len * 0.55, 100 + Math.sin(a) * len * 0.55];
    return (
      <path
        key={i}
        d={`M${ox} 100 L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${mid[0].toFixed(1)} ${mid[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z`}
        fill={accent}
        opacity={0.05 + rand() * 0.1}
      />
    );
  });
  return (
    <g>
      {shards}
      <circle cx={ox} cy={100} r={46} fill={accent} opacity={0.12} />
    </g>
  );
}

function shield(rand: Rand, accent: string) {
  // Concentric armour plating — rotated hexagonal rings.
  const cx = 150 + rand() * 120;
  const rings = Array.from({ length: 6 }, (_, i) => {
    const r = 28 + i * 26;
    const rot = rand() * 30;
    const pts = Array.from({ length: 6 }, (_, k) => {
      const a = (k / 6) * Math.PI * 2 + (rot * Math.PI) / 180;
      return `${(cx + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
    return (
      <polygon
        key={i}
        points={pts}
        fill="none"
        stroke={accent}
        strokeWidth={1.5 + rand() * 2}
        opacity={0.26 - i * 0.03}
      />
    );
  });
  return <g>{rings}</g>;
}

function dumbbell(rand: Rand, accent: string) {
  // Stacked chevrons: upward drive, like plates racking up.
  const rows = Array.from({ length: 7 }, (_, i) => {
    const y = H + 6 - i * 29 + (rand() - 0.5) * 8;
    const half = 78 + rand() * 62;
    const rise = 24 + rand() * 16;
    const cx = W / 2 + (rand() - 0.5) * 90;
    return (
      <path
        key={i}
        d={`M${(cx - half).toFixed(1)} ${y.toFixed(1)} L${cx.toFixed(1)} ${(y - rise).toFixed(1)} L${(cx + half).toFixed(1)} ${y.toFixed(1)}`}
        fill="none"
        stroke={accent}
        strokeWidth={5 + rand() * 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.09 + rand() * 0.13}
      />
    );
  });
  return <g>{rows}</g>;
}

function heart(rand: Rand, accent: string) {
  // ECG trace across the canvas with a trailing pulse.
  let d = `M0 ${110 + rand() * 10}`;
  let x = 0;
  while (x < W) {
    const flat = 24 + rand() * 30;
    d += ` L${x + flat} 110`;
    x += flat;
    const amp = 34 + rand() * 40;
    d += ` L${x + 8} ${110 - amp * 0.35} L${x + 16} ${110 + amp * 0.5} L${x + 24} ${110 - amp} L${x + 32} ${110 + amp * 0.25} L${x + 40} 110`;
    x += 40;
  }
  return (
    <g>
      <path d={d} fill="none" stroke={accent} strokeWidth={9} opacity={0.1} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={accent} strokeWidth={2.4} opacity={0.5} strokeLinejoin="round" />
    </g>
  );
}

function wind(rand: Rand, accent: string) {
  // Topographic flow lines — calm, horizontal, drifting.
  const lines = Array.from({ length: 11 }, (_, i) => {
    const y = 6 + i * 19 + rand() * 6;
    const a1 = 14 + rand() * 20;
    const a2 = 10 + rand() * 22;
    const d = `M-10 ${y} C 90 ${y - a1}, 180 ${y + a2}, 270 ${y - a1 * 0.5} S 390 ${y + a2 * 0.6}, ${W + 10} ${y}`;
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={accent}
        strokeWidth={1.2 + rand() * 1.8}
        opacity={0.12 + rand() * 0.2}
        strokeLinecap="round"
      />
    );
  });
  return <g>{lines}</g>;
}

const MOTIF: Record<Emblem, (rand: Rand, accent: string) => JSX.Element> = {
  flame,
  bolt,
  shield,
  dumbbell,
  heart,
  wind,
};

export function CoverArt({
  seed,
  emblem,
  from,
  to,
  className = "",
}: {
  seed: string;
  emblem: Emblem;
  from: string;
  to: string;
  className?: string;
}) {
  const uid = useMemo(() => `ca-${seed.replace(/[^a-z0-9]/gi, "")}`, [seed]);
  const art = useMemo(() => MOTIF[emblem](rngFor(seed), "#ffffff"), [emblem, seed]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="78%" cy="12%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-vig`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="35%" stopColor="#0c0a07" stopOpacity="0" />
          <stop offset="100%" stopColor="#0c0a07" stopOpacity="0.72" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
      {art}
      <rect width={W} height={H} fill={`url(#${uid}-glow)`} />
      <rect width={W} height={H} fill={`url(#${uid}-vig)`} />
    </svg>
  );
}
