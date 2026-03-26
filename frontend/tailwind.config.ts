import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent — violet-indigo
        accent: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          300: '#a5a6fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // Dark surfaces
        n: {
          900: '#0b0c10',   // deepest bg
          800: '#13141a',   // page bg
          700: '#1c1d26',   // card bg
          600: '#252736',   // elevated card
          500: '#2e3044',   // border/separator
          400: '#94a3b8',   // muted text (was too dark)
          300: '#cbd5e1',   // secondary text
          200: '#e2e8f0',   // primary text
          100: '#f1f5f9',   // bright text
          50:  '#ffffff',   // white text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
