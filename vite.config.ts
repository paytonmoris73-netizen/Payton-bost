import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// VITE_HASH_ROUTER builds a single-file preview (no service worker there).
const preview = !!process.env.VITE_HASH_ROUTER;

export default defineConfig({
  plugins: [
    react(),
    !preview &&
      VitePWA({
        registerType: "autoUpdate", // new versions install in the background and apply on next launch
        injectRegister: "auto",
        includeAssets: ["icons/apple-touch-icon.png", "icons/favicon-32.png"],
        manifest: {
          id: "/",
          name: "CRUNCH",
          short_name: "CRUNCH",
          description: "Combine ingredients, cook with an AI chef, and buy or sell original recipes.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["window-controls-overlay", "standalone"],
          orientation: "any",
          background_color: "#FBF5EA",
          theme_color: "#FBF5EA",
          categories: ["food", "lifestyle"],
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          shortcuts: [
            { name: "Food Combiner", url: "/combiner", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
            { name: "AI Chef", url: "/chef", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
            { name: "My Cookbook", url: "/cookbook", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            { urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
          ],
        },
      }),
  ],
  server: { port: 5173 },
  build: { outDir: "dist", emptyOutDir: true },
});
