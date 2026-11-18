// The four looks Stitch designed for Vi-log (project "Vi-log (Time-Plan)").
// Each id matches a :root[data-theme="..."] block in index.css.
export const THEMES = [
  { id: 'calm', name: 'Calm', source: 'Vi-log Calm', blurb: 'Soft blues, follows light/dark mode', font: 'Manrope', swatches: ['#f9f9ff', '#0159c7', '#006e40', '#b22b2e'] },
  { id: 'night', name: 'Night Focus', source: 'Night Focus', blurb: 'Dark, immersive, neon mint glow', font: 'Space Grotesk', swatches: ['#0e1321', '#00f5a0', '#d0bcff', '#ff6b81'] },
  { id: 'bento', name: 'Playful Bento', source: 'Luminous Modular Bento', blurb: 'Bright pastels, rounded cards', font: 'Plus Jakarta Sans', swatches: ['#faf8ff', '#4648d4', '#ff6b6b', '#00885d'] },
  { id: 'editorial', name: 'Editorial', source: 'Chronometer Editorial', blurb: 'Cream, ink and signal orange', font: 'Bodoni Moda', swatches: ['#fdf9ef', '#1c1c16', '#ad2b00', '#e6e2d8'] },
]

const KEY = 'vilog-theme'

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'calm'
  } catch {
    return 'calm'
  }
}

export function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id)
  try { localStorage.setItem(KEY, id) } catch { /* private mode: theme just won't persist */ }
}
