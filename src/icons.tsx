import type { ReactNode } from "react";

export const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  combine: "M9 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM15 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  chef: "M7 14a4 4 0 1 1 1-7.9A4 4 0 0 1 16 6a4 4 0 1 1 1 8v6H7z",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5 0 3 3 0 0 0 6 0 3 3 0 0 0 5 0",
  basket: "M3 9h18l-2 11H5zM8 9l3-5M16 9l-3-5",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M17 11a2.5 2.5 0 1 0 0-5M17 15c2.5 0 4 1.7 4 4",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  list: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  msg: "M4 5h16v11H9l-5 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  menu: "M4 7h16M4 12h16M4 17h16",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-2-4-2 1a7 7 0 0 0-2-1l-1-2H9L8 7a7 7 0 0 0-2 1L4 7 2 11l2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a7 7 0 0 0 2 1l1 2h4l1-2a7 7 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 0-2z",
  cart: "M3 4h2l2 11h11l2-8H6M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z",
  alert: "M12 4l9 16H3zM12 10v4M12 17.5v.01",
  play: "M7 4l13 8-13 8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  timer: "M9 2h6M12 8v5l3 2M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  note: "M5 3h10l4 4v14H5zM9 11h6M9 15h6",
  camera: "M4 8h3l2-3h6l2 3h3v12H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  star: "M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z",
  close: "M6 6l12 12M18 6L6 18",
  ban: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM6 6l12 12",
  medal: "M8 3l4 6 4-6M12 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  megaphone: "M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  history: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4M12 8v4l3 2",
  books: "M5 4h4v16H5zM11 4h4v16h-4zM17.5 5l3 .8-3.5 14-3-.8z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  chefhat: "M7 14a4 4 0 1 1 1-7.9A4 4 0 0 1 16 6a4 4 0 1 1 1 8v6H7z",
  utensils: "M7 3v8a2 2 0 0 0 2 2v8M7 3v6M11 3v6M16 3c-2 2-2 6 0 8v10",
  leaf: "M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8",
  bag: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0",
  share: "M12 3v12M8 7l4-4 4 4M5 13v6h14v-6",
  sound: "M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11",
  mute: "M4 9h4l5-4v14l-5-4H4zM17 9.5l5 5M22 9.5l-5 5",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  back: "M15 5l-7 7 7 7",
};


export function Icon({ n, size = 20, className = "", fill }: { n: string; size?: number; className?: string; fill?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d={P[n] ?? P.home} /></svg>;
}

/** Interface glyphs (not food imagery) that used to be emoji. Unknown glyphs are returned as-is. */
export const GLYPH: Record<string, [string, boolean?]> = {
  "🛒": ["cart"], "🛍": ["bag"], "📁": ["folder"], "✨": ["sparkle"], "⚠": ["alert"], "▶": ["play", true], "✅": ["check"], "✓": ["check"], "⏱": ["clock"], "⏲": ["timer"],
  "🔒": ["lock"], "🔍": ["search"], "🔎": ["search"], "📝": ["note"], "📷": ["camera"], "💬": ["msg"], "♥": ["heart", true], "♡": ["heart"], "★": ["star", true], "☆": ["star"],
  "＋": ["plus"], "✕": ["close"], "🚫": ["ban"], "🏅": ["medal"], "📣": ["megaphone"], "⚙": ["filter"], "🕘": ["history"], "🥕": ["combine"], "📚": ["books"],
};
export function G({ g, size = 16, className = "" }: { g: string; size?: number; className?: string }): ReactNode {
  const k = g.replace(/\uFE0F/g, ""); const m = GLYPH[k];
  return m ? <Icon n={m[0]} size={size} fill={m[1]} className={`inline-block shrink-0 align-[-0.2em] ${className}`} /> : <>{g}</>;
}
