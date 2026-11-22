export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="apexg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb15c" />
          <stop offset="1" stopColor="#e5700a" />
        </linearGradient>
      </defs>
      <path d="M16 3 L2 28 H9.5 L16 16.5 L22.5 28 H30 Z" fill="url(#apexg)" />
      <path d="M16 11 L11.5 19 H20.5 Z" fill="#0b0b0c" opacity="0.9" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex flex-col items-center leading-none">
      <LogoMark size={64} />
      <div className="mt-2 text-5xl font-black italic tracking-tight">APEX</div>
      <div className="mt-1 text-2xl font-extrabold italic tracking-[0.2em] text-apex">FITNESS</div>
    </div>
  );
}
