/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0a090d", 1: "#111016", 2: "#17161d", 3: "#201e27" },
        line: "rgba(255,255,255,0.07)",
        luna: { DEFAULT: "#c9bbe8", dark: "#9a88c9", light: "#e2d9f5" },
        lime: { luna: "#9fd3b4" },
        moon: { DEFAULT: "#e6dcc8", dark: "#b9a98a" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["\"Cormorant Garamond\"", "Georgia", "serif"],
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(0.9)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease both",
        pop: "pop 0.2s ease both",
      },
    },
  },
  plugins: [],
};
