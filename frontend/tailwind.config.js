/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chai: {
          50: '#FFF5ED',
          100: '#FFE4D1',
          200: '#FFC6A3',
          300: '#FFA36B',
          400: '#FF9248',
          500: '#FA8128',
          600: '#E06D1A',
          700: '#C45A0E',
          800: '#A04709',
          900: '#7F3705',
        },
        brand: {
          50: '#FFF5ED',
          500: '#FA8128',
          600: '#E06D1A',
          700: '#C45A0E',
        },
        token: {
          bg: 'var(--bg-main)',
          sub: 'var(--bg-sub)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-card-hover)',
          border: 'var(--border)',
          'border-hover': 'var(--border-hover)',
          text: 'var(--text-main)',
          'text-sub': 'var(--text-sub)',
          muted: 'var(--text-muted)',
          accent: 'var(--primary-accent)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

