export type IconName =
  | "home" | "brain" | "book-open" | "library" | "mic" | "mic-off"
  | "file-text" | "layers" | "test-tube" | "flashcard" | "gamepad"
  | "eye" | "presentation" | "calendar" | "bar-chart" | "search"
  | "settings" | "user" | "play" | "pause" | "stop" | "skip-forward"
  | "skip-back" | "volume" | "volume-off" | "headphones"
  | "upload" | "download" | "plus" | "x" | "check" | "chevron-right"
  | "chevron-left" | "chevron-down" | "chevron-up" | "arrow-left"
  | "arrow-right" | "edit" | "trash" | "copy" | "share" | "star"
  | "star-filled" | "clock" | "send" | "sparkles" | "bookmark"
  | "folder" | "grid" | "list" | "filter" | "sort"
  | "sun" | "moon" | "menu" | "sidebar" | "maximize" | "minimize"
  | "refresh" | "loader" | "alert" | "info" | "help"
  | "image" | "link" | "code" | "math" | "table"
  | "bold" | "italic" | "underline" | "highlight"
  | "list-ordered" | "list-bullet" | "quote" | "heading"
  | "lucent" | "podcast" | "waveform" | "target" | "trophy"
  | "flame" | "graduation" | "pin" | "archive" | "export"
  | "camera" | "video" | "globe" | "shield" | "key" | "zap"
  | "drag" | "more" | "flag" | "hash" | "at" | "paperclip"
  | "chart-line" | "chart-bar" | "chart-pie" | "trending-up"
  | "map" | "compass" | "heart" | "thumbs-up";

const P: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  brain: "M12 2a6 6 0 0 0-5.2 3A5 5 0 0 0 2 10a5 5 0 0 0 3 4.6V20a2 2 0 0 0 2 2h2m3-20a6 6 0 0 1 5.2 3A5 5 0 0 1 22 10a5 5 0 0 1-3 4.6V20a2 2 0 0 1-2 2h-2M12 2v20",
  "book-open": "M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2V4Zm20 0h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4Z",
  library: "M4 19V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14M4 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M4 19H2m14 0h4a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
  mic: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v1a7 7 0 0 1-14 0v-1m7 8v4m-4 0h8",
  "mic-off": "M2 2l20 20m-7-2.7A7 7 0 0 1 5 12v-1m14 0v1a7 7 0 0 1-.8 3.3M15 9.3V5a3 3 0 0 0-5.7-1.3M12 19v3m-4 0h8M9 9v2a3 3 0 0 0 5 2.2",
  "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-6 10h8m-8 4h8m-4-12v6h6",
  layers: "m12 2 10 6-10 6L2 8l10-6Zm10 10-10 6-10-6m20 6-10 6-10-6",
  "test-tube": "M8 2h8m-6 0v6.2a4 4 0 0 0-.7 2.2L7 18a3 3 0 0 0 3 4h4a3 3 0 0 0 3-4l-2.3-7.6a4 4 0 0 0-.7-2.2V2m-4 13h4",
  flashcard: "M4 6h16v12H4V6Zm0 4h16",
  gamepad: "M6 11h4m-2-2v4m6-1h.01M18 13h.01M2 15V9a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z",
  eye: "M2.05 12a10 10 0 0 1 19.9 0 10 10 0 0 1-19.9 0Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  presentation: "M2 3h20v14H2V3Zm8 14 2 4 2-4m-8-8h8m-8 3h5",
  calendar: "M4 6h16v15H4V6Zm0 5h16M8 3v4m8-4v4",
  "bar-chart": "M4 20V10m5 10V4m5 16v-7m5 7v-4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3c0-.5-.05-1-.14-1.4l2.1-1.7-2-3.4-2.5 1a7 7 0 0 0-2.4-1.4L14 2h-4l-.4 2.6a7 7 0 0 0-2.5 1.4l-2.5-1-2 3.4 2.1 1.7a7 7 0 0 0 0 2.8l-2.1 1.7 2 3.4 2.5-1c.7.6 1.5 1.1 2.5 1.4L10 22h4l.4-2.6a7 7 0 0 0 2.5-1.4l2.5 1 2-3.4-2.1-1.7c.1-.5.1-1 .1-1.4Z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  play: "M6 4l14 8-14 8V4Z",
  pause: "M7 4h3v16H7V4Zm7 0h3v16h-3V4Z",
  stop: "M6 4h12v16H6z",
  "skip-forward": "M5 4v16l10-8-10-8Zm12 0h2v16h-2z",
  "skip-back": "M19 20V4L9 12l10 8ZM5 4h2v16H5z",
  volume: "M11 5 6 9H2v6h4l5 4V5Zm5 3a5 5 0 0 1 0 8m3-12a9 9 0 0 1 0 16",
  "volume-off": "M11 5 6 9H2v6h4l5 4V5Zm11 4-6 6m0-6 6 6",
  headphones: "M3 18v-6a9 9 0 0 1 18 0v6M3 18a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3Zm18 0a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4Z",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4 0 5 5 5-5m-5 5V3",
  plus: "M12 5v14m-7-7h14",
  x: "M18 6 6 18M6 6l12 12",
  check: "m5 12 5 5L20 7",
  "chevron-right": "m9 5 7 7-7 7",
  "chevron-left": "m15 5-7 7 7 7",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-up": "m6 15 6-6 6 6",
  "arrow-left": "M19 12H5m0 0 7-7m-7 7 7 7",
  "arrow-right": "M5 12h14m0 0-7-7m7 7-7 7",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-10.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  trash: "M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6",
  copy: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2m-2-16H8v14h10V8l-4-4Zm0 0v4h4",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-4-6-4-4-4 4m4-4v13",
  star: "m12 2 3.1 6.3 6.9.9-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-.9L12 2Z",
  "star-filled": "m12 2 3.1 6.3 6.9.9-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-.9L12 2Z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  send: "m22 2-7 20-4-9-9-4 20-7ZM11 13l11-11",
  sparkles: "m12 3-1.9 5.7-5.7 1.9 5.7 1.9L12 18.2l1.9-5.7 5.7-1.9-5.7-1.9L12 3ZM5 16l-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3Z",
  bookmark: "M5 3h14v18l-7-4-7 4V3Z",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  filter: "M22 3H2l8 9.5V20l4 2v-9.5L22 3Z",
  sort: "M3 6h7m-7 6h10m-10 6h5m7 0V4m0 14-3-3m3 3 3-3",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
  menu: "M3 12h18M3 6h18M3 18h18",
  sidebar: "M3 3h18v18H3V3Zm6 0v18",
  maximize: "M8 3H3v5m18-5h-5m0 18h5v-5M3 16v5h5",
  minimize: "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
  refresh: "M1 4v6h6M23 20v-6h-6M20.5 9A9 9 0 0 0 5.6 5.6L1 10m22 4-4.6 4.4A9 9 0 0 1 3.5 15",
  loader: "M12 2v4m0 12v4M4.9 4.9l2.8 2.8m8.5 8.5 2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.5-8.5 2.8-2.8",
  alert: "M12 9v4m0 4h.01M10.3 3.3l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-3.3l-8-14a2 2 0 0 0-3.4 0Z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v4h1",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-1-8a3 3 0 1 1 4-2.8l-2 1.4V14m1 3h.01",
  image: "M4 4h16v16H4V4Zm0 12 4-4 4 4 4-4 4 4m-11-5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  link: "M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-2.3 2.3m1.3 9.7a5 5 0 0 1-7 0l-4-4a5 5 0 0 1 7-7l2.3 2.3",
  code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
  math: "M4 9h16M4 15h16M10 3v18M14 3v18",
  table: "M3 3h18v18H3V3Zm0 6h18M3 15h18M9 3v18M15 3v18",
  bold: "M6 4h8a4 4 0 0 1 0 8H6V4Zm0 8h9a4 4 0 0 1 0 8H6v-8Z",
  italic: "M19 4h-9m4 16H5M15 4l-6 16",
  underline: "M6 4v6a6 6 0 0 0 12 0V4M4 20h16",
  highlight: "M12 20h9m-7-6 5 5-9 1 1-9 5 5Zm-4-4L3 3",
  "list-ordered": "M10 6h11m-11 6h11m-11 6h11M4 6h1v4M3 10h3M4 14h2l-2 2 2 2",
  "list-bullet": "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  quote: "M3 21V9l4-4h3L8 9v5h4v7H3Zm11 0V9l4-4h3l-2 4v5h4v7h-9Z",
  heading: "M4 12h16M4 4v16M20 4v16",
  lucent: "M12 3l-6 18 6-5 6 5-6-18Z",
  podcast: "M12 16a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v6a4 4 0 0 0 4 4Zm-8-4a8 8 0 0 0 16 0M12 20v2m6-12a6 6 0 0 1-12 0",
  waveform: "M3 12h1m2 0V8m4 9V7m4 12V5m4 14V8m4 4h-1",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  trophy: "M8 21h8m-4-4v4m-6-17h12v5a6 6 0 0 1-12 0V4Zm12 2h3a4 4 0 0 1-4 4M6 6H3a4 4 0 0 0 4 4",
  flame: "M12 22c4 0 7-3 7-7 0-3-2-5-4-7-.8 1-1.3 2-1.5 3-.7-2.5-.2-6-3.5-8 .2 3-1.3 5-3 6.5C5.5 11.5 5 13 5 15c0 4 3 7 7 7Zm0 0c-2 0-3-1.5-3-3.5 0-1.5 1-2.5 2-3.5l1 2c.5-1.5.5-2.5 0-4 2 1 3 3 3 5 0 2-1 4-3 4Z",
  graduation: "M2 10l10-5 10 5-10 5-10-5Zm20 0v6M6 12v5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5",
  pin: "M12 22v-6m-5 0h10l-2-6V4H9v6l-2 6ZM9 4V2h6v2",
  archive: "M3 6h18v3H3V6Zm2 3v10h14V9M10 12h4",
  export: "M12 5v8m-4-4 4-4 4 4M4 15v4h16v-4",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11Zm-11-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  video: "M23 7l-7 5 7 5V7ZM2 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2V5Z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2Z",
  shield: "M12 2 4 5.5V11c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5.5L12 2Zm-3 9.5 2.2 2.2L15.5 9",
  key: "M21 2l-2 2m-3.6 3.6-2.7 2.7m7.3-5.3-3 3M15 9l3 3m-3-3-6 6a3 3 0 1 1-3-3l6-6",
  zap: "M13 2 4 14h7l-2 8 11-12h-8l1-8Z",
  drag: "M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12Zm0 0v7",
  hash: "M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18",
  at: "M16 8a4 4 0 0 0-8 0v4a4 4 0 0 0 8 0Zm0 4a10 10 0 1 1-4 8",
  paperclip: "M21.4 11.6l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8.5-8.5",
  "chart-line": "M3 20l5-8 4 4 9-12",
  "chart-bar": "M18 20V10m-6 10V4M6 20v-6",
  "chart-pie": "M21.2 15a10 10 0 1 1-6.2-12.2M22 12A10 10 0 0 0 12 2v10h10Z",
  "trending-up": "M23 6l-9.5 9.5-5-5L1 18m22-12h-6m6 0v6",
  map: "m1 6 7-3 8 3 7-3v18l-7 3-8-3-7 3V6Z",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm1.2-5.8L16 8l-6.2 2.8L7 17l6.2-2.8Z",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8Z",
  "thumbs-up": "M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 0V9.5a3 3 0 0 1 6 0V11h5.3a2 2 0 0 1 2 2.3l-1.6 8A2 2 0 0 1 16.7 23H7",
};

const FILLED = new Set<IconName>(["play", "star-filled", "lucent", "zap"]);

export function Icon({ name, className = "h-5 w-5", filled }: { name: IconName; className?: string; filled?: boolean }) {
  const isFilled = filled ?? FILLED.has(name);
  return (
    <svg viewBox="0 0 24 24" className={className} fill={isFilled ? "currentColor" : "none"} stroke={isFilled ? "none" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.help} />
    </svg>
  );
}
