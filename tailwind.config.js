/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './landing.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: '#080A0D',
        graphite: '#10141A',
        surface: '#161C24',
        elevated: '#1E2631',
        borderdark: '#26303D',
        emeraldbrand: {
          DEFAULT: '#10B981',
          bright: '#00E676',
          soft: '#34D399',
          deep: '#059669',
          muted: 'rgba(16, 185, 129, 0.14)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Inter"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        emerald: '0 0 24px rgba(16, 185, 129, 0.22)',
        card: '0 8px 28px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
