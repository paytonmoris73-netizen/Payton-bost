/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0b0b0c", 1: "#141416", 2: "#1c1c1f", 3: "#26262a" },
        line: "#2a2a2e",
        apex: { DEFAULT: "#ff8a1f", dark: "#e5700a", light: "#ffb15c" },
        lime: { apex: "#6bd34a" },
        gold: { DEFAULT: "#ffc23c", dark: "#e09a10" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
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
