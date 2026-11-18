import { useEffect, useState } from 'react'
import { loadAllData } from '../entries'
import { clock, dayKey, duration, entryMs, formatDay, formatTime, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import { WEEK, downloadCsv, shiftWeek } from '../weeks'
import { Card, EmptyState, Icon, PageHeader, StatTile, btn } from '../components/ui'

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
    return <Card><EmptyState icon="lock" title="Admins only" text="Your account doesn't have access to the team view." /></Card>
  }
  if (error) return <p className="text-sm font-medium text-tertiary bg-tertiary/10 px-4 py-3 rounded-lg">Couldn't load team data: {error}</p>
  if (!data) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-surface-container-low animate-pulse" />)}</div>

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
      <PageHeader eyebrow="Admin" title="Team" subtitle="Everyone's logged time for the selected week.">
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <StatTile label="People" icon="groups">{people.length}</StatTile>
          <StatTile label="Week total" icon="schedule" iconClass="text-secondary">{duration(total)}</StatTile>
        </div>
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button className={btn.ghost} onClick={() => setWeekStart(shiftWeek(weekStart, -1))} aria-label="Previous week"><Icon name="chevron_left" className="text-[18px]" /></button>
        <span className="font-headline font-bold text-base min-w-[220px] text-center">{formatDay(weekStart)} – {formatDay(new Date(weekEnd.getTime() - 1))}</span>
        <button className={btn.ghost} onClick={() => setWeekStart(shiftWeek(weekStart, 1))} disabled={isThisWeek} aria-label="Next week"><Icon name="chevron_right" className="text-[18px]" /></button>
        <span className="flex-1" />
        <button className={btn.ghost} onClick={load}><Icon name="refresh" className="text-[18px]" />Refresh</button>
      </div>

      {running.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" /></span>
            Working now
          </h2>
          <ul className="flex flex-col gap-2">
            {running.map((e) => (
              <li key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary-container/30 text-sm">
                <span className="w-8 h-8 rounded-full bg-secondary text-on-secondary grid place-items-center font-bold text-xs">{nameOf(e.uid)[0].toUpperCase()}</span>
                <span className="flex-1 min-w-0"><strong>{nameOf(e.uid)}</strong> <span className="text-on-surface-variant">· {e.project || 'No project'} · since {formatTime(e.startedAt)}</span></span>
                <span className="font-headline font-bold tabular-nums text-secondary">{clock(now - e.startedAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-2 mb-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[10px] uppercase tracking-wider text-on-surface-variant">
            <th className="text-left font-bold px-3 py-2">Name</th><th className="text-right font-bold px-3 py-2">Entries</th><th className="text-right font-bold px-3 py-2">Hours</th><th className="px-3 py-2 w-1/3" />
          </tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.uid} onClick={() => setPerson(person === p.uid ? '' : p.uid)}
                className={`cursor-pointer transition-colors ${person === p.uid ? 'bg-primary-container/50' : 'hover:bg-surface-container-low'}`}>
                <td className="px-3 py-2.5 rounded-l-lg">{p.name || '—'}<div className="text-xs text-on-surface-variant">{p.email}</div></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{p.count}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">{duration(p.ms)}</td>
                <td className="px-3 py-2.5 rounded-r-lg"><div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${people[0].ms ? (p.ms / people[0].ms) * 100 : 0}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-on-surface-variant mb-6 px-1">Click a person to see only their entries.</p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <h2 className="text-lg font-bold flex-1">{person ? nameOf(person) : 'All entries'}</h2>
        {person && <button className={btn.ghost} onClick={() => setPerson('')}>Show everyone</button>}
        <button className={btn.ghost} onClick={exportCsv} disabled={!shown.length}><Icon name="download" className="text-[18px]" />Export CSV</button>
      </div>
      {shown.length === 0 ? <Card><EmptyState icon="event_busy" title="No time logged this week" text="Nobody has logged time in this week yet." /></Card>
        : <EntryList entries={shown} personName={person ? null : nameOf} />}
    </>
  )
}
