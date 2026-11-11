/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0c0a07",
          900: "#121009",
          850: "#17140d",
          800: "#1d1912",
          700: "#272217",
          600: "#37301f",
        },
        line: {
          DEFAULT: "#2b2619",
          bright: "#473c22",
        },
        gold: {
          50: "#fff8e6",
          100: "#ffefc2",
          200: "#ffe294",
          300: "#ffd66b",
          400: "#f8bd3c",
          500: "#eda512",
          600: "#d88a06",
          700: "#b36b04",
          800: "#8a5008",
          900: "#6b3d0b",
        },
        cream: {
          DEFAULT: "#f6f1e3",
          dim: "#b3a98e",
          faint: "#7d7560",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Sora", "Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(248, 189, 60, 0.45)",
        "glow-sm": "0 0 20px -6px rgba(248, 189, 60, 0.4)",
        card: "0 8px 30px -12px rgba(0, 0, 0, 0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 0.35s ease both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulseSoft 2.2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
    },
  },
  plugins: [],
};
