import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
// Fonts are bundled (not loaded from Google) so the installed app looks right offline and launches faster.
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "./index.css";
import { applyFx, installSpecular, probeFrameRate } from "./fx";
import { initAppearance } from "./theme";
import { initInstall } from "./pwa";

initAppearance();
initInstall();
applyFx();
probeFrameRate();
installSpecular();
// iOS Safari only shows :active (our press/squish feedback) once a touch listener exists.
document.addEventListener("touchstart", () => {}, { passive: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
