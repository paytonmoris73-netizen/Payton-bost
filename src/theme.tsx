import { useEffect } from "react";
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
/** Applies the chosen theme colours. Falling snow / bats / string lights are intentionally gone: nothing may float over the app. */
export function ThemeDecor() {
  const t = useResolvedTheme();
  useEffect(() => { const s = useAppearance.getState(); applyAppearance(s.mode, s.theme); }, [t]);
  return null;
}

export function HeaderLights() { return null; }
