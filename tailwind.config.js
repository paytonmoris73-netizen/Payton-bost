/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "adventure-navy": "#1A2744",
        "sky-blue": { DEFAULT: "#4FC3F7", light: "#81D4FA", dark: "#0288D1" },
        coral: { DEFAULT: "#FF6B6B", light: "#FF9E9E", dark: "#E53935" },
        "sunny-yellow": { DEFAULT: "#FFD93D", light: "#FFE57A", dark: "#F9A825" },
        mint: { DEFAULT: "#6BCB77", light: "#A5D6A7", dark: "#388E3C" },
        forest: { DEFAULT: "#2D6A4F", light: "#52B788", dark: "#1B4332" },
        purple: { DEFAULT: "#9B5DE5", light: "#CE93D8", dark: "#6A1B9A" },
        cream: "#FFF9F0",
        gold: { DEFAULT: "#F4A261", light: "#FFCC80", dark: "#E65100" },
        navy: "#263342",
        pip: "#FF8C42",
        "soft-gray": "#F0EFEB",
      },
      fontFamily: {
        display: ["'Fredoka One'", "cursive"],
        sans: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.15)",
        nav: "0 -4px 20px rgba(0,0,0,0.08)",
        glow: "0 0 20px rgba(255,107,107,0.4)",
        "glow-yellow": "0 0 20px rgba(255,217,61,0.5)",
        "glow-purple": "0 0 20px rgba(155,93,229,0.5)",
        "glow-blue": "0 0 20px rgba(79,195,247,0.5)",
      },
      animation: {
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        pop: "pop 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "spin-slow": "spin 8s linear infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
        drift: "drift 6s ease-in-out infinite",
      },
      keyframes: {
        bounceSoft: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 10px rgba(255,107,107,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(255,107,107,0.7)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        drift: {
          "0%,100%": { transform: "translateX(0px) translateY(0px)" },
          "33%": { transform: "translateX(10px) translateY(-5px)" },
          "66%": { transform: "translateX(-5px) translateY(5px)" },
        },
      },
    },
  },
  plugins: [],
};
