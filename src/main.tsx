import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { applyFx, installSpecular, probeFrameRate } from "./fx";
import { initAppearance } from "./theme";

initAppearance();
applyFx();
probeFrameRate();
installSpecular();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
