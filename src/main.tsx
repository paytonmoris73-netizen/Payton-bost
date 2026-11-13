import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

const stored = localStorage.getItem("studyverse-storage");
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    if (state?.darkMode) document.documentElement.classList.add("dark");
  } catch { /* ignore */ }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
