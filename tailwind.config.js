/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
          glow: 'rgba(0,212,255,0.15)',
        },
        dark: {
          bg: '#0f1117',
          sidebar: '#161b27',
          card: '#1e2535',
          border: '#2a3347',
          muted: '#4a5568',
        },
      },
      boxShadow: {
        'accent-glow': '0 0 12px rgba(0,212,255,0.25)',
        'sidebar-glow': 'inset -1px 0 0 rgba(0,212,255,0.1)',
      },
    },
  },
  plugins: [],
}
