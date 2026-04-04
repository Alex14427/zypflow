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
    },
  },
  plugins: [],
};
export default config;
