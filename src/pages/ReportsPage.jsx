import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_GOALS, watchEntries, watchProfile } from '../entries'
import { watchTasks } from '../tasks'
import { dayKey, duration, entryMs, formatDay, startOfDay, startOfWeek } from '../format'
import { downloadCsv } from '../weeks'
import { streak } from '../stats'
import { Heatmap } from '../components/Momentum'
import { Card, CountUp, EmptyState, Icon, PageHeader, btn } from '../components/ui'

// Distinguishable colors for the per-project bars
const PALETTE = ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-amber)', 'var(--c-violet)', 'var(--c-tertiary)', '#0e9fb5', 'var(--c-outline)']

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
  const [profile, setProfile] = useState({ ...DEFAULT_GOALS })
  const [mode, setMode] = useState('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [grown, setGrown] = useState(false)

  useEffect(() => watchEntries(user.uid, setEntries, 2000), [user.uid])
  useEffect(() => watchTasks(user.uid, setTasks), [user.uid])
  useEffect(() => watchProfile(user.uid, setProfile), [user.uid])

  const { start, end } = periodOf(mode, anchor)
  const isCurrent = new Date() >= start && new Date() < end
  const startMs = start.getTime()
  const endMs = end.getTime()

  // Bars grow in from zero whenever the period changes
  const loaded = entries !== null
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true))
    return () => { cancelAnimationFrame(t); setGrown(false) }
  }, [startMs, mode, loaded])

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
    return { days, total, avg: workedDays ? total / workedDays : 0, projects, completed, workedDays }
  }, [entries, tasks, startMs, endMs])

  if (entries === null) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-surface-container-low animate-pulse" />)}</div>
  }

  const goalMs = profile.dailyGoalMin * 60000
  const maxDay = Math.max(...report.days.map((d) => d.ms), goalMs, 1)
  const todayKey = dayKey(startOfDay())
  const label = mode === 'week'
    ? `${formatDay(start)} – ${formatDay(new Date(end.getTime() - 1))}`
    : start.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const days = streak(entries)

  function exportCsv() {
    const rows = [['Project', 'Hours', 'Share']]
    for (const [p, ms] of report.projects) {
      rows.push([p, (ms / 3600000).toFixed(2), report.total ? `${Math.round((ms / report.total) * 100)}%` : '0%'])
    }
    downloadCsv(`report-${mode}-${dayKey(start)}.csv`, rows)
  }

  const tiles = [
    ['Total', 'schedule', 'text-primary', <CountUp key="t" value={report.total} format={duration} />],
    ['Daily average', 'equalizer', 'text-secondary', <CountUp key="a" value={report.avg} format={duration} />],
    ['Tasks completed', 'task_alt', 'text-violet', <CountUp key="c" value={report.completed} />],
    ['Current streak', 'local_fire_department', 'text-amber', <span key="s"><CountUp value={days} /> {days === 1 ? 'day' : 'days'}</span>],
  ]

  return (
    <>
      <PageHeader eyebrow="Insights" title="Reports" subtitle="Where your time went, by day and by project.">
        <div className="inline-flex bg-surface-container-lowest rounded-xl p-1 shadow-sm" role="tablist" aria-label="Period">
          {['week', 'month'].map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setAnchor(new Date()) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {m === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button className={btn.ghost} onClick={() => shift(-1)} aria-label="Previous period"><Icon name="chevron_left" className="text-[18px]" /></button>
        <span className="font-headline font-bold text-base min-w-[220px] text-center">{label}</span>
        <button className={btn.ghost} onClick={() => shift(1)} disabled={isCurrent} aria-label="Next period"><Icon name="chevron_right" className="text-[18px]" /></button>
        <span className="flex-1" />
        <button className={btn.ghost} onClick={exportCsv} disabled={!report.projects.length}><Icon name="download" className="text-[18px]" />Export CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiles.map(([l, icon, cls, value], i) => (
          <div key={l} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{l}</span>
              <Icon name={icon} fill className={`text-[18px] ${cls}`} />
            </div>
            <p className="mt-2 text-2xl font-headline font-bold tabular-nums truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Hours per day</h2>
            {goalMs > 0 && <span className="text-[11px] text-on-surface-variant inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-amber" />Daily goal {duration(goalMs)}</span>}
          </div>
          <div className="relative h-56">
            {goalMs > 0 && (
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-amber/70 z-10 pointer-events-none"
                style={{ bottom: `${20 + (goalMs / maxDay) * 200}px` }} />
            )}
            <div className="absolute inset-0 flex items-end" style={{ gap: mode === 'month' ? 3 : 12 }}>
              {report.days.map((d, i) => (
                <div key={d.key} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 min-w-0 group" title={`${formatDay(d.date)}: ${duration(d.ms)}`}>
                  {mode === 'week' && <span className="text-[10px] font-semibold tabular-nums text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">{d.ms ? duration(d.ms) : ''}</span>}
                  <div className="w-full flex items-end" style={{ height: 200 }}>
                    <div className={`w-full max-w-[44px] mx-auto rounded-t-md rounded-b-sm transition-[height] duration-700 ease-out group-hover:opacity-80 ${d.ms === 0 ? 'bg-surface-container-high' : d.key === todayKey ? 'bg-secondary' : d.ms >= goalMs && goalMs ? 'bg-primary' : 'bg-primary/60'}`}
                      style={{ height: grown ? `${Math.max(d.ms ? 3 : 1.5, (d.ms / maxDay) * 100)}%` : '0%', transitionDelay: `${i * (mode === 'week' ? 50 : 12)}ms` }} />
                  </div>
                  <span className="text-[10px] text-on-surface-variant h-3.5 whitespace-nowrap">
                    {mode === 'week' ? d.date.toLocaleDateString([], { weekday: 'short' }) : (d.date.getDate() % 5 === 1 ? d.date.getDate() : '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5 p-6">
          <h2 className="text-base font-bold mb-4">By project</h2>
          {report.projects.length === 0 ? <EmptyState icon="donut_large" title="No time logged" text="Nothing was logged in this period." /> : (
            <ul className="flex flex-col gap-4">
              {report.projects.map(([p, ms], i) => (
                <li key={p} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex justify-between gap-2 text-sm mb-1.5">
                    <span className="font-semibold truncate inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />{p}
                    </span>
                    <span className="text-on-surface-variant tabular-nums whitespace-nowrap">{duration(ms)} · {Math.round((ms / report.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: grown ? `${(ms / report.projects[0][1]) * 100}%` : '0%', background: PALETTE[i % PALETTE.length], transitionDelay: `${i * 60}ms` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-12 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-bold">Activity · last 26 weeks</h2>
            <span className="text-xs text-on-surface-variant">Each square is a day; darker means more hours logged.</span>
          </div>
          <Heatmap entries={entries} weeks={26} />
        </Card>
      </div>
    </>
  )
}
