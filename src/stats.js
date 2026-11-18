import { dayKey, entryMs, startOfDay } from './format'

export const POMODORO_MIN = 25

// Logged ms per local day key
export function msByDay(entries) {
  const out = {}
  for (const e of entries) {
    const k = dayKey(e.startedAt)
    out[k] = (out[k] || 0) + entryMs(e)
  }
  return out
}

// Consecutive days with logged time, ending today (or yesterday if nothing yet today)
export function streak(entries, now = new Date()) {
  const byDay = msByDay(entries)
  const d = startOfDay(now)
  if (!byDay[dayKey(d)]) d.setDate(d.getDate() - 1)
  let n = 0
  while (byDay[dayKey(d)]) { n++; d.setDate(d.getDate() - 1) }
  return n
}

// Columns of 7 days (Mon..Sun) for the last `weeks` weeks, oldest first
export function heatmap(entries, weeks = 12, now = new Date()) {
  const byDay = msByDay(entries)
  const today = startOfDay(now)
  const start = new Date(today)
  start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - 7 * (weeks - 1))
  const cols = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i)
      col.push({ key: dayKey(d), date: d, ms: byDay[dayKey(d)] || 0, future: d > today })
    }
    cols.push(col)
  }
  return cols
}

// 0..4 intensity bucket for a day's hours
export const level = (ms) => (ms <= 0 ? 0 : ms < 2 * 3600e3 ? 1 : ms < 4 * 3600e3 ? 2 : ms < 6 * 3600e3 ? 3 : 4)
