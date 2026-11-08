/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050707',
        ink: '#080E12',
        panel: '#0B1318',
        line: '#172126',
        neon: 'rgb(var(--accent) / <alpha-value>)',
        neon2: 'rgb(var(--accent2) / <alpha-value>)',
        tech: '#00CFFF',
        alert: '#FF3B3B',
        warn: '#FFC857',
        soft: '#DCE7E3',
        mute: '#6F8580',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        plex: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 12px rgb(var(--accent) / 0.35)',
        neonsm: '0 0 6px rgb(var(--accent) / 0.3)',
      },
      keyframes: {
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
      animation: {
        scan: 'scan 7s linear infinite',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
