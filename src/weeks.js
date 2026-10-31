import { startOfWeek } from './format'

export const WEEK = 7 * 24 * 60 * 60 * 1000

// Move by n weeks; the half-day nudge keeps DST changes from landing on the wrong week
export const shiftWeek = (weekStart, n) => startOfWeek(new Date(weekStart.getTime() + n * WEEK + 12 * 3600 * 1000))

export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
