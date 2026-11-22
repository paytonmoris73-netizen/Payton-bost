/** Lunor mark: a fine ivory crescent. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M20.5 4A12 12 0 1 0 28 21.5 9.6 9.6 0 0 1 20.5 4Z" fill="#f2eee8" />
    </svg>
  );
}

/** Wordmark: crescent + serif name, optionally with a small descriptor. */
export default function Logo({ descriptor = true }: { descriptor?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <LogoMark size={40} />
      <div className="display mt-5 text-[44px] tracking-[0.02em]">Lunor</div>
      {descriptor && <div className="eyebrow mt-3">Training &amp; Nutrition</div>}
    </div>
  );
}
