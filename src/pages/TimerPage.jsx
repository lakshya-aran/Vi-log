import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { saveDraft, startTimer, stopTimer, watchEntries, watchRunning, deleteEntry } from '../entries'
import { clock, duration, entryMs, formatTime, startOfDay, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import ManualEntry from '../components/ManualEntry'

export default function TimerPage({ user }) {
  const [running, setRunning] = useState(undefined)
  const [entries, setEntries] = useState([])

  useEffect(() => watchRunning(user.uid, setRunning), [user.uid])
  useEffect(() => watchEntries(user.uid, setEntries, 200), [user.uid])

  const sum = (from) => entries.filter((e) => e.startedAt >= from).reduce((s, e) => s + entryMs(e), 0)
  const firstName = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]

  return (
    <>
      <div className="hello">
        <h1>Hi {firstName}</h1>
        <div className="stats">
          <div><span>Today</span><strong>{duration(sum(startOfDay()))}</strong></div>
          <div><span>This week</span><strong>{duration(sum(startOfWeek()))}</strong></div>
        </div>
      </div>

      {running === undefined ? (
        <section className="card timer"><div className="clock idle">--:--:--</div></section>
      ) : running ? (
        <RunningTimer key={running.id} uid={user.uid} entry={running} />
      ) : (
        <IdleTimer uid={user.uid} />
      )}

      <ManualEntry uid={user.uid} />

      <h2>Recent entries</h2>
      {entries.length === 0 ? (
        <p className="muted">Nothing logged yet. Start the timer to log your first entry.</p>
      ) : (
        <EntryList entries={entries.slice(0, 10)} onDelete={(id) => deleteEntry(user.uid, id)} />
      )}
      <p><Link to="/timesheet">See full timesheet →</Link></p>
    </>
  )
}

function IdleTimer({ uid }) {
  const [project, setProject] = useState('')
  const [busy, setBusy] = useState(false)

  async function start(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await startTimer(uid, project)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card timer">
      <div className="clock idle">00:00:00</div>
      <form onSubmit={start} className="stack">
        <label><span>Project / task <span className="muted">(optional)</span></span>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <button className="btn start" disabled={busy}>Start timer</button>
      </form>
    </section>
  )
}

function RunningTimer({ uid, entry }) {
  const [now, setNow] = useState(() => Date.now())
  const [project, setProject] = useState(entry.project)
  const [notes, setNotes] = useState(entry.notes)
  const [error, setError] = useState('')
  const elapsed = clock(now - entry.startedAt)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    document.title = `${elapsed} · Time-Plan`
    return () => { document.title = 'Time-Plan · Vicharanashala Lab for Education Design' }
  }, [elapsed])

  // Save the draft as they type, so closing the page before stopping loses nothing
  useEffect(() => {
    if (project === entry.project && notes === entry.notes) return
    const t = setTimeout(() => saveDraft(uid, entry.id, { project: project.trim(), notes }), 800)
    return () => clearTimeout(t)
  }, [uid, entry.id, entry.project, entry.notes, project, notes])

  async function stop(e) {
    e.preventDefault()
    if (!notes.trim()) return setError('Add a note on what you worked on before stopping the timer.')
    await stopTimer(uid, entry.id, { project, notes })
  }

  async function discard() {
    if (confirm('Discard this timer without logging it?')) await deleteEntry(uid, entry.id)
  }

  return (
    <section className="card timer running">
      <div className="clock">{elapsed}</div>
      <p className="muted">Started at {formatTime(entry.startedAt)}</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={stop} className="stack">
        <label>Project / task
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <label>What did you work on?
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Wrote lesson plan for chapter 3, reviewed worksheets…" />
        </label>
        <button className="btn stop">Stop &amp; submit</button>
      </form>
      <button className="link danger" onClick={discard}>Discard timer</button>
    </section>
  )
}
