/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#08070f", 1: "#13111c", 2: "#1c1929", 3: "#272339" },
        line: "#2d2842",
        luna: { DEFAULT: "#9b5cff", dark: "#7c3aed", light: "#c9a7ff" },
        lime: { luna: "#6bd34a" },
        moon: { DEFAULT: "#e9e0ff", dark: "#b8a6f0" },
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
