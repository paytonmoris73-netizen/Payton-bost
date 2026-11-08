/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "pp-navy":    "#0F0E2A",
        "pp-surface": "#1A1935",
        "pp-card":    "#252347",
        "pp-border":  "#2E2B55",
        "pp-orange":  "#FF6B35",
        "pp-gold":    "#FFD93D",
        "pp-purple":  "#7C3AED",
        "pp-blue":    "#3B82F6",
        "pp-teal":    "#14B8A6",
        "pp-pink":    "#EC4899",
        "pp-green":   "#22C55E",
        "pp-coral":   "#FF6B6B",
        "pp-cream":   "#FFF9F0",
        "pp-muted":   "#8B8FA8",
        // legacy (kept for pages not yet migrated)
        coral:  { DEFAULT: "#FF6B6B", light: "#FF9E9E", dark: "#E53935" },
        navy:   "#263342",
        cream:  "#FFF9F0",
        teal:   { DEFAULT: "#14B8A6" },
        yellow: "#FFD93D",
        "soft-gray": "#F0EFEB",
        purple: { DEFAULT: "#7C3AED" },
        mint:   "#6BCB77",
      },
      fontFamily: {
        display: ["'Fredoka One'", "cursive"],
        sans:    ["Nunito", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card-dark":    "0 4px 24px rgba(0,0,0,0.4)",
        "glow-orange":  "0 0 24px rgba(255,107,53,0.5)",
        "glow-purple":  "0 0 24px rgba(124,58,237,0.5)",
        "glow-blue":    "0 0 24px rgba(59,130,246,0.5)",
        "glow-gold":    "0 0 20px rgba(255,217,61,0.6)",
        card:           "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover":   "0 8px 30px rgba(0,0,0,0.15)",
        nav:            "0 -4px 20px rgba(0,0,0,0.3)",
      },
      animation: {
        float:          "float 3s ease-in-out infinite",
        shimmer:        "shimmer 2.5s linear infinite",
        "pulse-glow":   "pulseGlow 2s ease-in-out infinite",
        pop:            "pop 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)",
        "fade-in":      "fadeIn 0.4s ease-out",
        "slide-up":     "slideUp 0.4s ease-out",
        "bounce-soft":  "bounceSoft 2s ease-in-out infinite",
        wiggle:         "wiggle 0.5s ease-in-out",
        twinkle:        "twinkle 2.5s ease-in-out infinite",
        drift:          "drift 6s ease-in-out infinite",
        confetti:       "confettiFall 1.5s ease-out forwards",
        "spin-slow":    "spin 8s linear infinite",
        "ring-fill":    "ringFill 1s ease-out forwards",
        "legend-glow":  "legendGlow 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.7" },
          "50%":     { opacity: "1" },
        },
        pop: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        bounceSoft: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-5deg)" },
          "50%":     { transform: "rotate(5deg)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%":     { opacity: "1",   transform: "scale(1.2)" },
        },
        drift: {
          "0%,100%": { transform: "translateX(0) translateY(0)" },
          "33%":     { transform: "translateX(10px) translateY(-5px)" },
          "66%":     { transform: "translateX(-5px) translateY(5px)" },
        },
        confettiFall: {
          "0%":   { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-120px) rotate(720deg)", opacity: "0" },
        },
        ringFill: {
          "0%":   { strokeDashoffset: "251" },
          "100%": { strokeDashoffset: "var(--ring-offset)" },
        },
        legendGlow: {
          "0%,100%": { boxShadow: "0 0 10px rgba(255,217,61,0.4), inset 0 0 10px rgba(255,217,61,0.1)" },
          "50%":     { boxShadow: "0 0 25px rgba(255,217,61,0.8), inset 0 0 15px rgba(255,217,61,0.2)" },
        },
      },
    },
  },
  plugins: [],
};
