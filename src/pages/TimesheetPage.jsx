import { useEffect, useMemo, useState } from 'react'
import { deleteEntry, watchEntries } from '../entries'
import { dayKey, duration, entryMs, formatDay, formatTime, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import ManualEntry from '../components/ManualEntry'

const WEEK = 7 * 24 * 60 * 60 * 1000

export default function TimesheetPage({ user }) {
  const [entries, setEntries] = useState(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek())

  useEffect(() => watchEntries(user.uid, setEntries), [user.uid])

  const weekEnd = new Date(weekStart.getTime() + WEEK)
  const inWeek = useMemo(
    () => (entries || []).filter((e) => e.startedAt >= weekStart && e.startedAt < weekEnd),
    [entries, weekStart], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const total = inWeek.reduce((s, e) => s + entryMs(e), 0)
  const isThisWeek = weekStart.getTime() === startOfWeek().getTime()

  const shiftWeek = (n) => setWeekStart(startOfWeek(new Date(weekStart.getTime() + n * WEEK + 12 * 3600 * 1000)))

  function exportCsv() {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    const rows = [['Date', 'Start', 'End', 'Hours', 'Project', 'Notes']]
    for (const e of [...inWeek].reverse()) {
      rows.push([dayKey(e.startedAt), formatTime(e.startedAt), formatTime(e.endedAt), (entryMs(e) / 3600000).toFixed(2), e.project, e.notes])
    }
    const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `timesheet-${dayKey(weekStart)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div className="hello">
        <h1>My timesheet</h1>
        <div className="stats"><div><span>Week total</span><strong>{duration(total)}</strong></div></div>
      </div>

      <div className="weekbar">
        <button className="btn ghost" onClick={() => shiftWeek(-1)}>← Prev</button>
        <span>{formatDay(weekStart)} – {formatDay(new Date(weekEnd.getTime() - 1))}</span>
        <button className="btn ghost" onClick={() => shiftWeek(1)} disabled={isThisWeek}>Next →</button>
        <button className="btn ghost" onClick={exportCsv} disabled={!inWeek.length}>Export CSV</button>
      </div>

      <ManualEntry uid={user.uid} />

      {entries === null ? <p className="muted">Loading…</p>
        : inWeek.length === 0 ? <p className="muted">No time logged this week.</p>
        : <EntryList entries={inWeek} onDelete={(id) => deleteEntry(user.uid, id)} />}
    </>
  )
}
