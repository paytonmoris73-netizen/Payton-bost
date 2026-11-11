export type IconName =
  | "home"
  | "dumbbell"
  | "chart"
  | "trophy"
  | "users"
  | "store"
  | "settings"
  | "flame"
  | "bolt"
  | "heart"
  | "wind"
  | "shield"
  | "clock"
  | "play"
  | "pause"
  | "check"
  | "chevron-right"
  | "arrow-left"
  | "crown"
  | "calendar"
  | "star"
  | "x"
  | "skip"
  | "comment"
  | "apex";

const PATHS: Record<IconName, JSX.Element> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
  ),
  dumbbell: (
    <path d="M6.5 6.5v11m11-11v11M2.5 9v6m19-6v6M6.5 12h11" />
  ),
  chart: (
    <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
  ),
  trophy: (
    <path d="M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Zm12 2h3a4 4 0 0 1-4 4M6 6H3a4 4 0 0 0 4 4" />
  ),
  users: (
    <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-.5a3 3 0 1 0-2-5.2M22 19v-1a4 4 0 0 0-3-3.85" />
  ),
  store: (
    <path d="M4 10v10h16V10M2 7l2-4h16l2 4a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2Zm8 13v-6h4v6" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.14-1.42l2.1-1.64-2-3.46-2.48 1a7.5 7.5 0 0 0-2.46-1.42L14 2h-4l-.42 2.64a7.5 7.5 0 0 0-2.46 1.42l-2.48-1-2 3.46 2.1 1.64A7.4 7.4 0 0 0 4.6 12c0 .48.05.96.14 1.42l-2.1 1.64 2 3.46 2.48-1c.72.6 1.55 1.1 2.46 1.42L10 22h4l.42-2.64a7.5 7.5 0 0 0 2.46-1.42l2.48 1 2-3.46-2.1-1.64c.09-.46.14-.94.14-1.42Z" />
  ),
  flame: (
    <path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.4-2.2-5.6-3.8-7.3-.9 1-1.4 1.7-1.7 3C13 8 13.5 4.6 10.2 2c.2 3.2-1.3 4.6-2.9 6.4-1.5 1.7-2.8 3.6-2.8 6.4C4.5 19 7.6 22 12 22Zm0 0c-2 0-3.4-1.5-3.4-3.4 0-1.6 1-2.6 1.9-3.5.6.6 1 .9 1.4 1.8.5-1.3.6-2.3.1-3.6 2 1 3.4 2.9 3.4 5.3 0 1.9-1.4 3.4-3.4 3.4Z" />
  ),
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  heart: (
    <path d="M12 21S3 15 3 8.8C3 5.6 5.4 3.5 8 3.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.6 0 5 2.1 5 5.3C21 15 12 21 12 21Z" />
  ),
  wind: (
    <path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.5 2.5" />
  ),
  shield: (
    <path d="M12 2 4 5.5V11c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5.5L12 2Zm-3 9.5 2.2 2.2L15.5 9" />
  ),
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3.5 2" />,
  play: <path d="M7 4.5v15l12-7.5L7 4.5Z" />,
  pause: <path d="M7 4h3.5v16H7V4Zm6.5 0H17v16h-3.5V4Z" />,
  check: <path d="m4 12.5 5.5 5.5L20 6.5" />,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  "arrow-left": <path d="M20 12H4m0 0 7-7m-7 7 7 7" />,
  crown: (
    <path d="m3 7 4 4 5-6 5 6 4-4-1.5 11h-15L3 7Zm2 15h14" />
  ),
  calendar: (
    <path d="M4 6h16v15H4V6Zm0 5h16M8 3v4m8-4v4" />
  ),
  star: (
    <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" />
  ),
  x: <path d="M5 5l14 14M19 5 5 19" />,
  skip: <path d="M5 4.5v15l10-7.5-10-7.5ZM17.5 4.5h2v15h-2z" />,
  comment: (
    <path d="M21 12a8 8 0 0 1-8 8H4l2.3-3A8 8 0 1 1 21 12Z" />
  ),
  apex: <path d="M12 2 23 22h-6.6L12 13.6 7.6 22H1L12 2Z" />,
};

const FILLED = new Set<IconName>(["play", "pause", "bolt", "star", "skip", "apex", "flame"]);

export function Icon({
  name,
  className = "h-5 w-5",
  filled,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  const isFilled = filled ?? FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
