/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        devanagari: ['"Tiro Devanagari Hindi"', 'serif'],
      },
      colors: {
        ink: {
          50: '#f0f0ff',
          100: '#e4e4ff',
          200: '#cdceff',
          300: '#a8aaff',
          400: '#7f7fff',
          500: '#5f5aff',
          600: '#4e3af7',
          700: '#4228e3',
          800: '#3420b8',
          900: '#2d1e91',
          950: '#1c1160',
        },
        saffron: {
          400: '#FF9933',
          500: '#F97316',
          600: '#EA6000',
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
        },
        surface: '#0d0d1a',
        panel: '#12122a',
        border: 'rgba(255,255,255,0.07)',
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse at 20% 50%, rgba(94,58,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(52,211,153,0.08) 0%, transparent 50%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'aurora': 'aurora 8s ease infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(94,58,255,0.4)' },
          '70%': { boxShadow: '0 0 0 20px rgba(94,58,255,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(94,58,255,0)' },
        },
        wave: {
          '0%,100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
