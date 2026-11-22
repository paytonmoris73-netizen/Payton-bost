/** Lunor crescent-moon mark: a glossy violet crescent with a small star. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lunorg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1e9ff" />
          <stop offset="0.45" stopColor="#b48cff" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M20.5 3.5A12.5 12.5 0 1 0 28.5 22 10 10 0 0 1 20.5 3.5Z" fill="url(#lunorg)" />
      <path d="M24 6.2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#f1e9ff" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex flex-col items-center leading-none">
      <div className="drop-shadow-[0_0_24px_rgba(155,92,255,0.7)]">
        <LogoMark size={72} />
      </div>
      <div className="shine-text mt-3 text-5xl font-black tracking-[0.12em]">LUNOR</div>
      <div className="mt-2 text-sm font-bold tracking-[0.55em] text-white/60">FITNESS</div>
    </div>
  );
}
