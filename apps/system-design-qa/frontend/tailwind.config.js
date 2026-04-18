import sharedPreset from '../../../shared/ui/tailwind-preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../../shared/ui/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
