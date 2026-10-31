export const pad = (n) => String(n).padStart(2, '0')

export function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

export function duration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${pad(m)}m` : `${m}m`
}

export const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
export const formatDay = (d) => d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const entryMs = (e) => e.endedAt - e.startedAt

export function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Weeks start on Monday
export function startOfWeek(d = new Date()) {
  const s = startOfDay(d)
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}

export function groupByDay(entries) {
  const days = []
  for (const e of entries) {
    const key = dayKey(e.startedAt)
    let day = days[days.length - 1]
    if (!day || day.key !== key) {
      day = { key, label: formatDay(e.startedAt), entries: [], ms: 0 }
      days.push(day)
    }
    day.entries.push(e)
    day.ms += entryMs(e)
  }
  return days
}

// Value for <input type="datetime-local"> in the browser's timezone
export function toLocalInput(d) {
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
