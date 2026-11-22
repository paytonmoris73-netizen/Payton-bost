import { useEffect } from "react";
import { create } from "zustand";

export type Mode = "auto" | "light" | "dark";
export type Theme = "seasonal" | "classic" | "christmas" | "halloween";
export type Accent = "tangerine" | "honey" | "rose" | "berry" | "mint" | "ocean" | "lavender";
export type GlassStyle = "clear" | "frosted" | "solid";
export type TextSize = "sm" | "md" | "lg" | "xl";

/** Accent colours the user can pick. RGB triplets: [main, dark, light, gel-top, gel-bottom, on-accent, light-in-dark-mode]. */
export const ACCENTS: { id: Accent; name: string; hex: string; v: [string, string, string, string, string, string, string] }[] = [
  { id: "tangerine", name: "Tangerine", hex: "#F19852", v: ["241 152 82", "222 120 48", "253 216 180", "251 184 118", "233 130 60", "37 35 31", "104 64 36"] },
  { id: "honey", name: "Honey", hex: "#ECB040", v: ["236 176 64", "196 132 20", "252 230 176", "247 202 102", "224 152 36", "37 35 31", "96 70 20"] },
  { id: "rose", name: "Rose", hex: "#EC808C", v: ["236 128 140", "206 84 102", "251 214 220", "247 166 176", "230 116 132", "37 35 31", "100 40 52"] },
  { id: "berry", name: "Berry", hex: "#C45C96", v: ["196 92 150", "164 58 120", "242 210 228", "214 112 170", "160 54 116", "255 255 255", "86 34 66"] },
  { id: "mint", name: "Mint", hex: "#62BA96", v: ["98 186 150", "52 140 106", "208 240 226", "140 212 182", "78 170 134", "37 35 31", "30 74 58"] },
  { id: "ocean", name: "Ocean", hex: "#5CA0DC", v: ["92 160 220", "52 118 186", "208 228 248", "112 172 228", "50 116 184", "255 255 255", "30 60 94"] },
  { id: "lavender", name: "Lavender", hex: "#9C88E0", v: ["156 136 224", "114 92 196", "226 218 250", "170 150 234", "110 88 194", "255 255 255", "56 46 100"] },
];
const ACCENT_VARS = ["--orange", "--orange-dark", "--orange-light", "--accent-hi", "--accent-lo", "--on-accent"];
const TEXT_PX: Record<TextSize, string> = { sm: "15px", md: "16px", lg: "17px", xl: "18.5px" };
type Resolved = Exclude<Theme, "seasonal">;
const KEY = "crunch-appearance";

export const THEMES: { id: Theme; name: string; emoji: string; desc: string; swatch: string[] }[] = [
  { id: "classic", name: "Classic", emoji: "🍊", desc: "Warm champagne glass", swatch: ["#FCEFE2", "#F19852", "#C4B28C"] },
  { id: "christmas", name: "Christmas", emoji: "🎄", desc: "Berry red, pine green and falling snow", swatch: ["#FAF6F3", "#D63A42", "#3E8C62"] },
  { id: "halloween", name: "Halloween", emoji: "🎃", desc: "Pumpkin, potion purple and bats", swatch: ["#1A1024", "#FF7A1A", "#9668D6"] },
  { id: "seasonal", name: "Seasonal", emoji: "🗓️", desc: "Halloween in October, Christmas in December, Classic the rest of the year", swatch: ["#F2A66B", "#D63A42", "#FF7A1A"] },
];

export interface Prefs { mode: Mode; theme: Theme; accent: Accent; glass: GlassStyle; text: TextSize }
const DEFAULTS: Prefs = { mode: "auto", theme: "classic", accent: "tangerine", glass: "clear", text: "md" };
function read(): Prefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      mode: ["auto", "light", "dark"].includes(v.mode) ? v.mode : DEFAULTS.mode,
      theme: THEMES.some((t) => t.id === v.theme) ? v.theme : DEFAULTS.theme,
      accent: ACCENTS.some((a) => a.id === v.accent) ? v.accent : DEFAULTS.accent,
      glass: ["clear", "frosted", "solid"].includes(v.glass) ? v.glass : DEFAULTS.glass,
      text: v.text in TEXT_PX ? v.text : DEFAULTS.text,
    };
  } catch { return { ...DEFAULTS }; }
}

export function resolveTheme(t: Theme, now = new Date()): Resolved {
  if (t !== "seasonal") return t;
  const m = now.getMonth();
  return m === 9 ? "halloween" : m === 11 ? "christmas" : "classic";
}
const systemDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export function applyAppearance(mode: Mode, theme: Theme, extra: Pick<Prefs, "accent" | "glass" | "text"> = useAppearance.getState()) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "auto" && systemDark());
  const r = resolveTheme(theme);
  root.classList.toggle("dark", dark);
  if (r === "classic") root.removeAttribute("data-crunch-theme"); else root.setAttribute("data-crunch-theme", r);
  // Accent: inline custom properties beat every theme rule, so the user's pick always wins.
  const acc = ACCENTS.find((a) => a.id === extra.accent);
  if (acc && acc.id !== "tangerine") ACCENT_VARS.forEach((k, i) => root.style.setProperty(k, i === 2 && dark ? acc.v[6] : acc.v[i]));
  else ACCENT_VARS.forEach((k) => root.style.removeProperty(k));
  root.setAttribute("data-glass", extra.glass);
  root.style.fontSize = TEXT_PX[extra.text];
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim().split(/\s+/).join(",");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg ? `rgb(${bg})` : "#FBF5EA");
}

interface AppearanceState extends Prefs {
  setMode: (m: Mode) => void; setTheme: (t: Theme) => void; setAccent: (a: Accent) => void; setGlass: (g: GlassStyle) => void; setText: (t: TextSize) => void; reset: () => void;
}
export const useAppearance = create<AppearanceState>((set, get) => {
  const prefs = (): Prefs => { const s = get(); return { mode: s.mode, theme: s.theme, accent: s.accent, glass: s.glass, text: s.text }; };
  const save = () => { const p = prefs(); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ } applyAppearance(p.mode, p.theme, p); };
  return {
    ...read(),
    setMode: (mode) => { set({ mode }); save(); },
    setTheme: (theme) => { set({ theme }); save(); },
    setAccent: (accent) => { set({ accent }); save(); },
    setGlass: (glass) => { set({ glass }); save(); },
    setText: (text) => { set({ text }); save(); },
    reset: () => { set({ ...DEFAULTS }); save(); },
  };
});

/** Call once at startup: applies saved appearance and follows the OS light/dark switch live. */
export function initAppearance() {
  const s0 = useAppearance.getState();
  applyAppearance(s0.mode, s0.theme, s0);
  if (typeof matchMedia === "function") {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => { const s = useAppearance.getState(); if (s.mode === "auto") applyAppearance(s.mode, s.theme, s); };
    mq.addEventListener?.("change", on);
  }
}

export const useResolvedTheme = () => resolveTheme(useAppearance((s) => s.theme));

/* ---------- seasonal decorations ---------- */
/** Applies the chosen theme colours. Falling snow / bats / string lights are intentionally gone: nothing may float over the app. */
export function ThemeDecor() {
  const t = useResolvedTheme();
  useEffect(() => { const s = useAppearance.getState(); applyAppearance(s.mode, s.theme, s); }, [t]);
  return null;
}

export function HeaderLights() { return null; }
