import { useId } from "react";

/** Glossy glass chef hat: the Crunch mark. Pure SVG (no images), so it is crisp at every size and costs nothing to paint. */
export function ChefHat({ size = 28, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".55" stopColor="#FFF3E4" />
          <stop offset="1" stopColor="#F6CFA2" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE7C8" />
          <stop offset="1" stopColor="#E9A766" />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD9A8" />
          <stop offset="1" stopColor="#D9823F" />
        </linearGradient>
      </defs>
      {/* puff */}
      <path d="M17 40c-6.6 0-11-4.7-11-10.4 0-6 4.9-10.6 10.9-10.4C18.5 12.6 24.6 8 32 8s13.5 4.6 15.1 11.2C53.1 19 58 23.6 58 29.6 58 35.3 53.6 40 47 40z" fill={`url(#h${id})`} stroke={`url(#r${id})`} strokeWidth="2" />
      {/* band */}
      <path d="M16 40h32v10.5a3.5 3.5 0 0 1-3.5 3.5h-25A3.5 3.5 0 0 1 16 50.5z" fill={`url(#b${id})`} stroke={`url(#r${id})`} strokeWidth="2" />
      {/* pleats + gloss */}
      <path d="M25 40v-6M32 40v-8M39 40v-6" stroke="#E9B27C" strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
      <path d="M14 24.5c1.5-3.2 4.4-4.9 7.5-5M27 12.6c2.2-1.3 4.8-1.8 7.6-1.4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".95" />
      <path d="M19 44h26" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

/** The app icon tile: a chef hat inside a warm gel square. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="brand-tile grid shrink-0 place-items-center" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <ChefHat size={size * 0.74} />
    </span>
  );
}

/** "Crunch" wordmark in rounded heavy type with a glossy warm fill. */
export function Wordmark({ className = "", dark }: { className?: string; dark?: boolean }) {
  return <span className={`wordmark ${dark ? "on-dark" : ""} ${className}`}>Crunch</span>;
}
