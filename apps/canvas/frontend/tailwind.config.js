import sharedPreset from '../../../shared/ui/tailwind-preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../../shared/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
        },
      },
    },
  },
  plugins: [],
};
