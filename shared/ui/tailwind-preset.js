/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--ss-color-brand-50)',
          100: 'var(--ss-color-brand-100)',
          200: 'var(--ss-color-brand-200)',
          300: 'var(--ss-color-brand-300)',
          400: 'var(--ss-color-brand-400)',
          500: 'var(--ss-color-brand-500)',
          600: 'var(--ss-color-brand-600)',
          700: 'var(--ss-color-brand-700)',
          800: 'var(--ss-color-brand-800)',
          900: 'var(--ss-color-brand-900)',
        },
        surface: {
          canvas: 'var(--ss-bg-canvas)',
          DEFAULT: 'var(--ss-bg-surface)',
          raised: 'var(--ss-bg-surface-raised)',
        },
        border: {
          subtle: 'var(--ss-border-subtle)',
          strong: 'var(--ss-border-strong)',
        },
        fg: {
          primary: 'var(--ss-text-primary)',
          secondary: 'var(--ss-text-secondary)',
          muted: 'var(--ss-text-muted)',
        },
        success: 'var(--ss-color-success)',
        warning: 'var(--ss-color-warning)',
        danger: 'var(--ss-color-danger)',
        info: 'var(--ss-color-info)',
      },
      borderRadius: {
        sm: 'var(--ss-radius-sm)',
        md: 'var(--ss-radius-md)',
        lg: 'var(--ss-radius-lg)',
        xl: 'var(--ss-radius-xl)',
      },
      fontFamily: {
        sans: 'var(--ss-font-sans)',
        mono: 'var(--ss-font-mono)',
      },
      transitionTimingFunction: {
        standard: 'var(--ss-ease-standard)',
        accelerate: 'var(--ss-ease-accelerate)',
        decelerate: 'var(--ss-ease-decelerate)',
      },
      transitionDuration: {
        fast: 'var(--ss-motion-fast)',
        base: 'var(--ss-motion-base)',
        slow: 'var(--ss-motion-slow)',
      },
    },
  },
};

export default preset;
