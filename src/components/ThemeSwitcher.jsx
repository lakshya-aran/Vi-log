import { useEffect, useRef, useState } from 'react'
import { THEMES, applyTheme, getTheme } from '../themes'
import { Icon } from './ui'

// Header button that switches between the Stitch design directions
export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(getTheme)
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const current = THEMES.find((t) => t.id === theme) || THEMES[0]

  // Keyboard shortcut: Alt+T cycles themes
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        setTheme((id) => THEMES[(THEMES.findIndex((t) => t.id === id) + 1) % THEMES.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}
        title={`Theme: ${current.name} (Alt+T to cycle)`}
        className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors">
        <Icon name="palette" className="text-[20px]" />
        <span className="hidden lg:flex -space-x-1">
          {current.swatches.slice(1, 4).map((c) => <span key={c} className="w-3 h-3 rounded-full ring-2 ring-surface-container-lowest" style={{ background: c }} />)}
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-[300px] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-xl shadow-lg p-2 z-[80] animate-fade-up">
          <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Designs by Stitch</p>
          {THEMES.map((t) => {
            const on = t.id === theme
            return (
              <button key={t.id} role="menuitemradio" aria-checked={on}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${on ? 'bg-primary-container' : 'hover:bg-surface-container-low'}`}>
                <span className="grid grid-cols-2 gap-0.5 w-9 h-9 p-1 rounded-md flex-shrink-0 ring-1 ring-outline-variant/40" style={{ background: t.swatches[0] }}>
                  {t.swatches.slice(1).map((c) => <span key={c} className="rounded-sm" style={{ background: c }} />)}
                  <span className="rounded-sm" style={{ background: t.swatches[1], opacity: 0.35 }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-semibold ${on ? 'text-on-primary-container' : 'text-on-surface'}`} style={{ fontFamily: `"${t.font}"` }}>{t.name}</span>
                  <span className="block text-[11px] text-on-surface-variant truncate">{t.blurb}</span>
                </span>
                {on && <Icon name="check" className="text-[18px] text-on-primary-container" />}
              </button>
            )
          })}
          <p className="px-2 pt-2 pb-1 text-[10px] text-on-surface-variant">Tip: press <kbd className="font-mono">Alt+T</kbd> to cycle themes.</p>
        </div>
      )}
    </div>
  )
}
