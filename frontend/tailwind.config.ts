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
          950: '#0b0c10',   // Deepest background
          900: '#13141a',   // Page background
          800: '#1c1d26',   // Card background
          700: '#252736',   // Elevated card background
          600: '#64748b',   // Slate 500 - Muted but clearly visible
          500: '#94a3b8',   // Slate 400 - Muted labels / Headers
          400: '#cbd5e1',   // Slate 300 - Secondary text / Info
          300: '#e2e8f0',   // Slate 200 - Standard bright text
          200: '#f1f5f9',   // Slate 100 - Extra bright text
          100: '#f8fafc',   // Slate 50 - Near white
          50:  '#ffffff',   // Pure White
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
