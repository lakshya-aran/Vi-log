import { useEffect, useState } from 'react'
import { loadAllData } from '../entries'
import { clock, dayKey, duration, entryMs, formatDay, formatTime, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import { WEEK, downloadCsv, shiftWeek } from '../weeks'

export default function AdminPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const [person, setPerson] = useState('')
  const [now] = useState(() => Date.now())

  function load() {
    loadAllData()
      .then((d) => { setError(''); setData(d) })
      .catch((err) => setError(err.code === 'permission-denied' ? 'denied' : err.message))
  }
  useEffect(load, [])

  if (error === 'denied') {
    return <div className="card"><h1>Admins only</h1><p className="muted">Your account doesn't have access to the team view.</p></div>
  }
  if (error) return <div className="error">Couldn't load team data: {error}</div>
  if (!data) return <p className="muted">Loading team data…</p>

  const nameOf = (uid) => {
    const p = data.people[uid]
    return p?.name || p?.email || 'Unknown user'
  }
  const weekEnd = new Date(weekStart.getTime() + WEEK)
  const isThisWeek = weekStart.getTime() === startOfWeek().getTime()
  const done = data.entries.filter((e) => e.endedAt)
  const running = data.entries.filter((e) => !e.endedAt)
  const inWeek = done.filter((e) => e.startedAt >= weekStart && e.startedAt < weekEnd)
  const shown = person ? inWeek.filter((e) => e.uid === person) : inWeek

  const people = Object.values(data.people)
    .map((p) => {
      const mine = inWeek.filter((e) => e.uid === p.uid)
      return { ...p, ms: mine.reduce((s, e) => s + entryMs(e), 0), count: mine.length }
    })
    .sort((a, b) => b.ms - a.ms || nameOf(a.uid).localeCompare(nameOf(b.uid)))
  const total = people.reduce((s, p) => s + p.ms, 0)

  function exportCsv() {
    const rows = [['Name', 'Email', 'Date', 'Start', 'End', 'Hours', 'Project', 'Notes']]
    for (const e of [...shown].reverse()) {
      const p = data.people[e.uid] || {}
      rows.push([p.name || '', p.email || '', dayKey(e.startedAt), formatTime(e.startedAt), formatTime(e.endedAt),
        (entryMs(e) / 3600000).toFixed(2), e.project, e.notes])
    }
    downloadCsv(`team-timesheet-${dayKey(weekStart)}.csv`, rows)
  }

  return (
    <>
      <div className="hello">
        <h1>Team</h1>
        <div className="stats">
          <div><span>People</span><strong>{people.length}</strong></div>
          <div><span>Week total</span><strong>{duration(total)}</strong></div>
        </div>
      </div>

      <div className="weekbar">
        <button className="btn ghost" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>← Prev</button>
        <span>{formatDay(weekStart)} – {formatDay(new Date(weekEnd.getTime() - 1))}</span>
        <button className="btn ghost" onClick={() => setWeekStart(shiftWeek(weekStart, 1))} disabled={isThisWeek}>Next →</button>
        <button className="btn ghost" onClick={load}>Refresh</button>
      </div>

      {running.length > 0 && (
        <section className="card">
          <h2 className="flush">Working now</h2>
          <ul className="plain">
            {running.map((e) => (
              <li key={e.id}>
                <strong>{nameOf(e.uid)}</strong> · {e.project || 'No project'} · since {formatTime(e.startedAt)}
                <span className="muted"> ({clock(now - e.startedAt)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <table className="people">
          <thead><tr><th>Name</th><th>Entries</th><th>Hours</th></tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.uid} className={person === p.uid ? 'selected' : ''} onClick={() => setPerson(person === p.uid ? '' : p.uid)}>
                <td>{p.name || '—'}<div className="muted small">{p.email}</div></td>
                <td>{p.count}</td>
                <td>{duration(p.ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Click a person to see only their entries.</p>
      </section>

      <div className="weekbar">
        <h2 className="flush grow">{person ? nameOf(person) : 'All entries'}</h2>
        {person && <button className="btn ghost" onClick={() => setPerson('')}>Show everyone</button>}
        <button className="btn ghost" onClick={exportCsv} disabled={!shown.length}>Export CSV</button>
      </div>
      {shown.length === 0 ? <p className="muted">No time logged this week.</p>
        : <EntryList entries={shown} personName={person ? null : nameOf} />}
    </>
  )
}
