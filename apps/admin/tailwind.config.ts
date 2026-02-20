import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0078D4', dark: '#0067C1', light: '#E8F4FC' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
        panel: '1rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 120, 212, 0.06)',
        card: '0 1px 3px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0, 120, 212, 0.08)',
        sidebar: '2px 0 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
