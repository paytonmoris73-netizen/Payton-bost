/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F0",
        coral: { DEFAULT: "#FF786B", light: "#FF9E95", dark: "#E85F53" },
        teal: { DEFAULT: "#58B9A9", light: "#7ECEC1", dark: "#3D9F90" },
        yellow: { DEFAULT: "#FFD56A", light: "#FFE299", dark: "#F0C040" },
        mint: "#DDF2E7",
        lavender: { DEFAULT: "#B9A9EA", light: "#D0C4F5", dark: "#9C87D8" },
        navy: "#263342",
        "soft-gray": "#F0EFEB",
        pip: "#FF8C42",
      },
      fontFamily: {
        sans: ["Nunito", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(38,51,66,0.08)",
        "card-hover": "0 6px 24px rgba(38,51,66,0.14)",
        nav: "0 -2px 16px rgba(38,51,66,0.08)",
      },
      animation: {
        "bounce-soft": "bounce-soft 2s infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pop": "pop 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)",
      },
      keyframes: {
        "bounce-soft": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
