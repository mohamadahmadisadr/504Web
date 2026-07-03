/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Keep literal whites/grays so cards are always visible against themed backgrounds
        white:  '#ffffff',
        black:  '#000000',
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Primary maps to Telegram accent/button color
        primary: {
          50:  'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 8%, #fff)',
          100: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 15%, #fff)',
          200: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 30%, #fff)',
          300: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 50%, #fff)',
          400: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 70%, #fff)',
          500: 'var(--tg-theme-button-color, #3390ec)',
          600: 'var(--tg-theme-button-color, #3390ec)',
          700: 'var(--tg-theme-accent-text-color, #2577c8)',
          800: 'var(--tg-theme-accent-text-color, #1a5ea0)',
          900: 'var(--tg-theme-accent-text-color, #0f3d6b)',
          950: 'var(--tg-theme-accent-text-color, #082a4d)',
        },
      },
      fontFamily: {
        'sans':    ['Inter', 'system-ui', 'sans-serif'],
        'persian': ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceIn: { '0%': { transform: 'scale(0.8)', opacity: '0' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
