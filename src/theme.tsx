import { useEffect, useMemo } from "react";
import { create } from "zustand";

export type Mode = "auto" | "light" | "dark";
export type Theme = "seasonal" | "classic" | "christmas" | "halloween";
type Resolved = Exclude<Theme, "seasonal">;
const KEY = "crunch-appearance";

export const THEMES: { id: Theme; name: string; emoji: string; desc: string; swatch: string[] }[] = [
  { id: "seasonal", name: "Seasonal", emoji: "🗓️", desc: "Halloween in October, Christmas in December, Classic the rest of the year", swatch: ["#F2A66B", "#D63A42", "#FF7A1A"] },
  { id: "classic", name: "Classic", emoji: "🍊", desc: "Warm cream and tangerine", swatch: ["#FBF5EA", "#F2A66B", "#A8B59A"] },
  { id: "christmas", name: "Christmas", emoji: "🎄", desc: "Berry red, pine green and falling snow", swatch: ["#FAF6F3", "#D63A42", "#3E8C62"] },
  { id: "halloween", name: "Halloween", emoji: "🎃", desc: "Pumpkin, potion purple and bats", swatch: ["#1A1024", "#FF7A1A", "#9668D6"] },
];

function read(): { mode: Mode; theme: Theme } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return { mode: ["auto", "light", "dark"].includes(v.mode) ? v.mode : "auto", theme: THEMES.some((t) => t.id === v.theme) ? v.theme : "seasonal" };
  } catch { return { mode: "auto", theme: "seasonal" }; }
}

export function resolveTheme(t: Theme, now = new Date()): Resolved {
  if (t !== "seasonal") return t;
  const m = now.getMonth();
  return m === 9 ? "halloween" : m === 11 ? "christmas" : "classic";
}
const systemDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export function applyAppearance(mode: Mode, theme: Theme) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "auto" && systemDark());
  const r = resolveTheme(theme);
  root.classList.toggle("dark", dark);
  if (r === "classic") root.removeAttribute("data-crunch-theme"); else root.setAttribute("data-crunch-theme", r);
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim().split(/\s+/).join(",");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg ? `rgb(${bg})` : "#FBF5EA");
}

interface AppearanceState { mode: Mode; theme: Theme; setMode: (m: Mode) => void; setTheme: (t: Theme) => void }
export const useAppearance = create<AppearanceState>((set, get) => {
  const save = (s: { mode: Mode; theme: Theme }) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } applyAppearance(s.mode, s.theme); };
  return {
    ...read(),
    setMode: (mode) => { set({ mode }); save({ mode, theme: get().theme }); },
    setTheme: (theme) => { set({ theme }); save({ mode: get().mode, theme }); },
  };
});

/** Call once at startup: applies saved appearance and follows the OS light/dark switch live. */
export function initAppearance() {
  const { mode, theme } = useAppearance.getState();
  applyAppearance(mode, theme);
  if (typeof matchMedia === "function") {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => { const s = useAppearance.getState(); if (s.mode === "auto") applyAppearance(s.mode, s.theme); };
    mq.addEventListener?.("change", on);
  }
}

export const useResolvedTheme = () => resolveTheme(useAppearance((s) => s.theme));

/* ---------- seasonal decorations ---------- */
const rand = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

function Snow() {
  const flakes = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    x: `${(rand(i) * 100).toFixed(1)}vw`, sway: `${((rand(i + 50) - 0.5) * 12).toFixed(1)}vw`,
    d: `${(9 + rand(i + 99) * 10).toFixed(1)}s`, delay: `${(-rand(i + 7) * 18).toFixed(1)}s`,
    size: 8 + Math.round(rand(i + 3) * 12), o: (0.45 + rand(i + 11) * 0.5).toFixed(2), ch: i % 3 === 0 ? "❄" : "•",
  })), []);
  return <>{flakes.map((f, i) => <span key={i} className="flake" style={{ ["--x" as string]: f.x, ["--sway" as string]: f.sway, ["--d" as string]: f.d, ["--delay" as string]: f.delay, ["--o" as string]: f.o, fontSize: f.ch === "•" ? f.size * 1.4 : f.size }}>{f.ch}</span>)}</>;
}
function Bats() {
  const bats = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    y: `${(8 + rand(i + 20) * 55).toFixed(0)}vh`, d: `${(16 + rand(i + 31) * 14).toFixed(1)}s`, delay: `${(-rand(i + 5) * 26).toFixed(1)}s`, s: (0.6 + rand(i + 77) * 0.7).toFixed(2),
  })), []);
  return <>{bats.map((b, i) => <span key={i} className="bat" style={{ ["--y" as string]: b.y, ["--d" as string]: b.d, ["--delay" as string]: b.delay, ["--s" as string]: b.s }}><i>🦇</i></span>)}</>;
}

/** Full-screen, click-through festive layer. Renders nothing for Classic. */
export function ThemeDecor() {
  const t = useResolvedTheme();
  useEffect(() => { const s = useAppearance.getState(); applyAppearance(s.mode, s.theme); }, [t]);
  if (t === "classic") return null;
  return <div className="decor" aria-hidden>{t === "christmas" ? <Snow /> : <Bats />}</div>;
}

/** Twinkling string of lights for the top bar (Christmas only). */
export function HeaderLights() {
  const t = useResolvedTheme();
  if (t !== "christmas") return null;
  const colors = ["#FF4D5A", "#FFD166", "#3EDC8A", "#5AB0FF", "#FF8BD1"];
  return <div className="lights" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ color: colors[i % colors.length], animationDelay: `${(i * 0.23) % 1.8}s` }} />)}</div>;
}
