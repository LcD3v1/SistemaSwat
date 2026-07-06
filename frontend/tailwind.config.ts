import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:    '#050505',
        sb:    '#0a0a0a',
        card:  '#111111',
        card2: '#171717',
        bdr:   '#1e1e1e',
        bdr2:  '#2a2a2a',
        bdrg:  '#3a3a3a',
        txt:   '#e8e8e8',
        txt2:  '#787878',
        txt3:  '#404040',
        gold:  '#c9a227',
        gold2: '#ddbb4a',
        gold3: '#f0d989',
        green: '#27ae60',
        red:   '#c0392b',
        blue:  '#2980b9',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono:     ['Share Tech Mono', 'monospace'],
        body:     ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
