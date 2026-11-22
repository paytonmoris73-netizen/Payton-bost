/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every colour is a CSS variable (see index.css) so light/dark mode and seasonal themes repaint instantly.
        ivory: 'rgb(var(--ivory) / <alpha-value>)',
        cream: 'rgb(var(--cream) / <alpha-value>)',
        charcoal: 'rgb(var(--charcoal) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        orange: 'rgb(var(--orange) / <alpha-value>)',
        brown: 'rgb(var(--brown) / <alpha-value>)',
        white: 'rgb(var(--white) / <alpha-value>)',
        'orange-dark': 'rgb(var(--orange-dark) / <alpha-value>)',
        'orange-light': 'rgb(var(--orange-light) / <alpha-value>)',
        'cream-dark': 'rgb(var(--cream-dark) / <alpha-value>)',
        'sage-dark': 'rgb(var(--sage-dark) / <alpha-value>)',
        'sage-light': 'rgb(var(--sage-light) / <alpha-value>)',
        'brown-light': 'rgb(var(--brown-light) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Nunito', 'ui-rounded', 'SF Pro Rounded', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(37, 35, 31, 0.08)',
        'card-hover': '0 8px 32px rgba(37, 35, 31, 0.14)',
        'float': '0 20px 60px rgba(37, 35, 31, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        
      },
    },
  },
  plugins: [],
};
