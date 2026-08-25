/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chai: {
          50: '#fffbe6',
          100: '#fff3b8',
          200: '#ffe585',
          300: '#ffd252',
          400: '#ffbd24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        brand: {
          50: '#fffbe6',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
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

