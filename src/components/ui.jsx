import { useEffect, useRef, useState } from 'react'

// Shared building blocks, ported from the Stitch prototype "Time-Plan Education Design Workspace"

export function Icon({ name, className = '', fill = false, ...rest }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`} {...rest}>{name}</span>
}

export function Card({ className = '', children, ...rest }) {
  return <section className={`bg-surface-container-lowest rounded-xl shadow-sm ${className}`} {...rest}>{children}</section>
}

export function Chip({ tone = 'neutral', className = '', children }) {
  const tones = {
    neutral: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    danger: 'bg-tertiary/10 text-tertiary',
    amber: 'bg-amber-container text-amber',
  }
  return <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}

export function ProgressBar({ value, tone = 'primary', className = '' }) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100
  const bg = { primary: 'bg-primary', secondary: 'bg-secondary', amber: 'bg-amber' }[tone]
  return (
    <div className={`w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden ${className}`}
      role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`${bg} h-full rounded-full transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// Circular progress ring. value 0..1; children render in the middle.
export function Ring({ value, size = 220, stroke = 12, tone = 'secondary', glow = false, children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  const color = { secondary: 'var(--c-secondary)', primary: 'var(--c-primary)', amber: 'var(--c-amber)', tertiary: 'var(--c-tertiary)' }[tone]
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      {glow && <div className="absolute inset-4 rounded-full blur-2xl animate-breathe" style={{ background: color }} />}
      <svg width={size} height={size} className="-rotate-90 relative">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-sc-high)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

// Animates a number from its previous value to the new one
export function useCountUp(target, ms = 700) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(a + (target - a) * eased)
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = target
    }
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); from.current = target }
  }, [target, ms])
  return shown
}

export function CountUp({ value, format = (n) => Math.round(n) }) {
  return <>{format(useCountUp(value))}</>
}

export function StatTile({ label, icon, iconClass = 'text-primary', children, sub, progress, tone = 'primary' }) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm min-w-[150px] flex flex-col justify-between animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
        {icon && <Icon name={icon} className={`text-base ${iconClass}`} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-headline font-bold text-on-surface tabular-nums">{children}</span>
        {sub && <span className="text-xs text-on-surface-variant font-medium">{sub}</span>}
      </div>
      {progress !== undefined && <ProgressBar value={progress} tone={tone} className="mt-3" />}
    </div>
  )
}

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 animate-fade-up">
      <div className="space-y-1">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{eyebrow}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant font-medium">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-headline font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:bg-primary-dim active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none',
  go: 'inline-flex items-center justify-center gap-2.5 bg-secondary text-on-secondary font-headline font-semibold text-sm px-6 py-3 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50',
  stop: 'inline-flex items-center justify-center gap-2.5 bg-tertiary text-on-tertiary font-headline font-semibold text-sm px-6 py-3 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all',
  ghost: 'inline-flex items-center justify-center gap-1.5 bg-surface-container-lowest text-on-surface text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:bg-surface-container-low active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none',
  soft: 'inline-flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50',
  link: 'inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dim transition-colors',
  icon: 'p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-40',
}

export const field = 'w-full text-sm text-on-surface bg-surface-container-low rounded-lg px-3.5 py-2.5 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/60'
export const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5'

const CONFETTI_COLORS = ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-tertiary-container)', 'var(--c-amber)', 'var(--c-violet)']

// A one-shot confetti burst from the center of its parent
export function Confetti({ count = 36 }) {
  const [pieces] = useState(() => Array.from({ length: count }, (_, i) => ({
    dx: `${(Math.random() - 0.5) * 520}px`,
    dy: `${-80 - Math.random() * 260}px`,
    rot: `${Math.random() * 720 - 360}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 120}ms`,
    w: 6 + Math.random() * 6,
  })))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="absolute left-1/2 top-1/2 rounded-sm animate-confetti"
          style={{ width: p.w, height: p.w * 0.45, background: p.color, '--dx': p.dx, '--dy': p.dy, '--rot': p.rot, animationDelay: p.delay }} />
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, text }) {
  return (
    <div className="py-8 flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 rounded-full bg-surface-container grid place-items-center"><Icon name={icon} className="text-on-surface-variant" /></div>
      <p className="font-headline font-bold text-sm">{title}</p>
      <p className="text-xs text-on-surface-variant max-w-xs">{text}</p>
    </div>
  )
}
