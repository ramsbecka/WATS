import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0078D4', dark: '#0067C1' },
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 120, 212, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
