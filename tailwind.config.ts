import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#d26645',
          'purple-dark': '#b84f31',
          'purple-light': '#ef9a7f',
        },
        ink: '#10161d',
        mist: '#f7f1eb',
        glow: '#fff1ea',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-up': 'fade-up 680ms ease both',
        'float': 'soft-float 6s ease-in-out infinite',
        'marquee': 'marquee 35s linear infinite',
        'marquee-reverse': 'marquee-reverse 40s linear infinite',
        'mesh-1': 'mesh-drift-1 20s ease-in-out infinite',
        'mesh-2': 'mesh-drift-2 25s ease-in-out infinite',
        'mesh-3': 'mesh-drift-3 22s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'marquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          from: { transform: 'translateX(-50%)' },
          to: { transform: 'translateX(0)' },
        },
        'mesh-drift-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(5%, 8%) scale(1.1)' },
          '66%': { transform: 'translate(-3%, 4%) scale(0.95)' },
        },
        'mesh-drift-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-6%, -4%) scale(1.05)' },
          '66%': { transform: 'translate(4%, -6%) scale(1.1)' },
        },
        'mesh-drift-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(3%, -5%) scale(1.08)' },
          '66%': { transform: 'translate(-5%, 3%) scale(0.97)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
