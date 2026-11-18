import { useEffect, useMemo, useState } from 'react'
import { watchEntries } from '../entries'
import { watchTasks } from '../tasks'
import { dayKey, duration, entryMs, formatDay, startOfDay, startOfWeek } from '../format'
import { downloadCsv } from '../weeks'

// Muted, distinguishable colors for the per-project bars (light + dark friendly)
const PALETTE = ['#2f6fde', '#1f9d61', '#c98a0c', '#8b5cf6', '#d64545', '#0e9fb5', '#64748b']

function periodOf(mode, anchor) {
  if (mode === 'week') {
    const start = startOfWeek(anchor)
    const end = new Date(start); end.setDate(end.getDate() + 7)
    return { start, end }
  }
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  return { start, end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1) }
}

export default function ReportsPage({ user }) {
  const [entries, setEntries] = useState(null)
  const [tasks, setTasks] = useState([])
  const [mode, setMode] = useState('week')
  const [anchor, setAnchor] = useState(() => new Date())

  useEffect(() => watchEntries(user.uid, setEntries, 2000), [user.uid])
  useEffect(() => watchTasks(user.uid, setTasks), [user.uid])

  const { start, end } = periodOf(mode, anchor)
  const isCurrent = new Date() >= start && new Date() < end
  const startMs = start.getTime()
  const endMs = end.getTime()

  function shift(n) {
    const d = new Date(start)
    if (mode === 'week') d.setDate(d.getDate() + 7 * n + 1) // +1 day keeps DST from slipping a week
    else d.setMonth(d.getMonth() + n)
    setAnchor(d)
  }

  const report = useMemo(() => {
    const start = new Date(startMs)
    const end = new Date(endMs)
    const inPeriod = (entries || []).filter((e) => e.startedAt >= start && e.startedAt < end)
    const days = []
    for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      days.push({ key: dayKey(d), date: d, ms: 0 })
    }
    const byDay = Object.fromEntries(days.map((d) => [d.key, d]))
    const byProject = {}
    for (const e of inPeriod) {
      const ms = entryMs(e)
      const day = byDay[dayKey(e.startedAt)]
      if (day) day.ms += ms
      const p = e.project || 'No project'
      byProject[p] = (byProject[p] || 0) + ms
    }
    const total = inPeriod.reduce((s, e) => s + entryMs(e), 0)
    const workedDays = days.filter((d) => d.ms > 0).length
    const projects = Object.entries(byProject).sort((a, b) => b[1] - a[1])
    const completed = tasks.filter((t) => t.done && t.doneAt && t.doneAt >= start && t.doneAt < end).length
    return { inPeriod, days, total, avg: workedDays ? total / workedDays : 0, projects, completed }
  }, [entries, tasks, startMs, endMs])

  if (entries === null) return <p className="muted">Loading reports…</p>

  const maxDay = Math.max(...report.days.map((d) => d.ms), 1)
  const todayKey = dayKey(startOfDay())
  const label = mode === 'week'
    ? `${formatDay(start)} – ${formatDay(new Date(end.getTime() - 1))}`
    : start.toLocaleDateString([], { month: 'long', year: 'numeric' })

  function exportCsv() {
    const rows = [['Project', 'Hours', 'Share']]
    for (const [p, ms] of report.projects) {
      rows.push([p, (ms / 3600000).toFixed(2), report.total ? `${Math.round((ms / report.total) * 100)}%` : '0%'])
    }
    downloadCsv(`report-${mode}-${dayKey(start)}.csv`, rows)
  }

  return (
    <>
      <div className="hello">
        <div>
          <h1>Reports</h1>
          <p>Where your time went, by day and by project.</p>
        </div>
        <div className="seg" role="tablist" aria-label="Period">
          <button role="tab" aria-selected={mode === 'week'} className={mode === 'week' ? 'on' : ''} onClick={() => { setMode('week'); setAnchor(new Date()) }}>Week</button>
          <button role="tab" aria-selected={mode === 'month'} className={mode === 'month' ? 'on' : ''} onClick={() => { setMode('month'); setAnchor(new Date()) }}>Month</button>
        </div>
      </div>

      <div className="weekbar">
        <button className="btn ghost" onClick={() => shift(-1)}>← Prev</button>
        <span>{label}</span>
        <button className="btn ghost" onClick={() => shift(1)} disabled={isCurrent}>Next →</button>
        <button className="btn ghost" onClick={exportCsv} disabled={!report.projects.length}>Export CSV</button>
      </div>

      <div className="tiles">
        <div><span>Total</span><strong>{duration(report.total)}</strong></div>
        <div><span>Daily average</span><strong>{duration(report.avg)}</strong></div>
        <div><span>Tasks completed</span><strong>{report.completed}</strong></div>
        <div><span>Top project</span><strong title={report.projects[0]?.[0]}>{report.projects[0]?.[0] || '—'}</strong></div>
      </div>

      <div className="report-grid">
        <section className="card">
          <h3>Hours per day</h3>
          <div className="bars" style={{ gap: mode === 'month' ? 3 : 10 }}>
            {report.days.map((d) => (
              <div className="col" key={d.key} title={`${formatDay(d.date)}: ${duration(d.ms)}`}>
                {mode === 'week' && <span className="val">{d.ms ? duration(d.ms) : ''}</span>}
                <div className={['bar', !d.ms && 'empty', d.key === todayKey && 'today'].filter(Boolean).join(' ')}
                  style={{ height: `${(d.ms / maxDay) * 100}%` }} />
                <small>{mode === 'week'
                  ? d.date.toLocaleDateString([], { weekday: 'short' })
                  : (d.date.getDate() % 5 === 1 ? d.date.getDate() : '')}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>By project</h3>
          {report.projects.length === 0 ? <p className="muted small">No time logged in this period.</p> : (
            <ul className="hbars">
              {report.projects.map(([p, ms], i) => (
                <li key={p}>
                  <div className="lbl"><b>{p}</b><span>{duration(ms)} · {Math.round((ms / report.total) * 100)}%</span></div>
                  <div className="track"><i style={{ width: `${(ms / report.projects[0][1]) * 100}%`, background: PALETTE[i % PALETTE.length] }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
