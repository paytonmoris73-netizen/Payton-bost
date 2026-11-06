export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true">
      <circle cx="7" cy="7.5" r="3" fill="#fff" fillOpacity="0.95" />
      <circle cx="13" cy="7.5" r="3" fill="#fff" fillOpacity="0.55" />
      <path d="M2 16.5c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 12.6c2.4.2 4 1.9 4 3.9" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}
