import { create } from "zustand";

/** Install-as-app helpers: the native install prompt (Chrome, Edge, Android) and iOS/macOS Safari guidance. */
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export type Platform = "ios" | "mac-safari" | "prompt" | "other";
export function platform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return "mac-safari";
  return "other";
}

interface InstallState { evt: BeforeInstallPromptEvent | null; installed: boolean; install: () => Promise<boolean> }
export const useInstall = create<InstallState>((set, get) => ({
  evt: null,
  installed: typeof window !== "undefined" && isStandalone(),
  install: async () => {
    const e = get().evt; if (!e) return false;
    await e.prompt(); const { outcome } = await e.userChoice;
    set({ evt: null, installed: outcome === "accepted" });
    return outcome === "accepted";
  },
}));

export function initInstall() {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); useInstall.setState({ evt: e as BeforeInstallPromptEvent }); });
  window.addEventListener("appinstalled", () => useInstall.setState({ installed: true, evt: null }));
  if (isStandalone()) document.documentElement.classList.add("standalone");
}
