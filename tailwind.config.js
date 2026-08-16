/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'deep-night': '#0D0F14',
        'surface': '#161A22',
        'surface-2': '#1E2330',
        'border-col': '#252B38',
        'text-primary': '#E8EAF0',
        'text-muted': '#6B7590',
        'signal': '#C8A84B',
        'signal-dim': '#8A7032',
        'danger': '#C0392B',
        'danger-dim': '#7D2520',
        'safe': '#2E7D52',
        'safe-dim': '#1E5236',
        'warn': '#D4820A',
        'warn-dim': '#8A5408',
      },
      fontFamily: {
        display: ['"Rajdhani"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        'stat': ['0.7rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
    },
  },
  plugins: [],
}
