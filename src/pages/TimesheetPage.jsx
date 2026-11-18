import { useEffect, useMemo, useState } from 'react'
import { watchEntries } from '../entries'
import { dayKey, duration, entryMs, formatDay, formatTime, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import ManualEntry from '../components/ManualEntry'
import { WEEK, downloadCsv, shiftWeek as shift } from '../weeks'
import { useActions } from '../hooks'
import { Card, CountUp, EmptyState, Icon, PageHeader, StatTile, btn } from '../components/ui'

export default function TimesheetPage({ user }) {
  const actions = useActions(user.uid)
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
  const daysWorked = new Set(inWeek.map((e) => dayKey(e.startedAt))).size

  function exportCsv() {
    const rows = [['Date', 'Start', 'End', 'Hours', 'Project', 'Notes']]
    for (const e of [...inWeek].reverse()) {
      rows.push([dayKey(e.startedAt), formatTime(e.startedAt), formatTime(e.endedAt), (entryMs(e) / 3600000).toFixed(2), e.project, e.notes])
    }
    downloadCsv(`timesheet-${dayKey(weekStart)}.csv`, rows)
  }

  return (
    <>
      <PageHeader eyebrow="Weekly log" title="My timesheet" subtitle="Every session you logged, grouped by day.">
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <StatTile label="Week total" icon="schedule"><CountUp value={total} format={duration} /></StatTile>
          <StatTile label="Days worked" icon="event_available" iconClass="text-secondary"><CountUp value={daysWorked} /> <span className="text-xs text-on-surface-variant font-medium">/ 7</span></StatTile>
        </div>
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button className={btn.ghost} onClick={() => setWeekStart(shift(weekStart, -1))} aria-label="Previous week"><Icon name="chevron_left" className="text-[18px]" /></button>
        <span className="font-headline font-bold text-base min-w-[220px] text-center">{formatDay(weekStart)} – {formatDay(new Date(weekEnd.getTime() - 1))}</span>
        <button className={btn.ghost} onClick={() => setWeekStart(shift(weekStart, 1))} disabled={isThisWeek} aria-label="Next week"><Icon name="chevron_right" className="text-[18px]" /></button>
        {!isThisWeek && <button className={btn.link} onClick={() => setWeekStart(startOfWeek())}>This week</button>}
        <span className="flex-1" />
        <button className={btn.ghost} onClick={exportCsv} disabled={!inWeek.length}><Icon name="download" className="text-[18px]" />Export CSV</button>
      </div>

      <div className="mb-6"><ManualEntry uid={user.uid} /></div>

      {entries === null
        ? <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-surface-container-low animate-pulse" />)}</div>
        : inWeek.length === 0
          ? <Card><EmptyState icon="event_busy" title="No time logged this week" text="Start the timer or log time manually above." /></Card>
          : <EntryList entries={inWeek} uid={user.uid} onDelete={actions.removeEntry} />}
    </>
  )
}
