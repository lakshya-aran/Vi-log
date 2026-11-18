import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { saveDraft, startTimer, stopTimer, watchEntries, watchRunning, deleteEntry } from '../entries'
import { addTask, deleteTask, setTaskDone, sortTasks, watchTasks } from '../tasks'
import { clock, dayKey, duration, entryMs, formatTime, startOfDay, startOfWeek } from '../format'
import EntryList from '../components/EntryList'
import ManualEntry from '../components/ManualEntry'
import TaskRow from '../components/TaskRow'

export default function TimerPage({ user }) {
  const [running, setRunning] = useState(undefined)
  const [entries, setEntries] = useState([])
  const [tasks, setTasks] = useState([])

  useEffect(() => watchRunning(user.uid, setRunning), [user.uid])
  useEffect(() => watchEntries(user.uid, setEntries, 200), [user.uid])
  useEffect(() => watchTasks(user.uid, setTasks), [user.uid])

  const sum = (from) => entries.filter((e) => e.startedAt >= from).reduce((s, e) => s + entryMs(e), 0)
  const firstName = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]
  const today = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
  const runningTask = running?.taskId ? tasks.find((t) => t.id === running.taskId) : null

  return (
    <>
      <div className="hello">
        <div>
          <h1>Hi {firstName}</h1>
          <p>{today} · Let's make deliberate progress today.</p>
        </div>
        <div className="stats">
          <div><span>Today</span><strong>{duration(sum(startOfDay()))}</strong></div>
          <div><span>This week</span><strong>{duration(sum(startOfWeek()))}</strong></div>
        </div>
      </div>

      <div className="home">
        <div>
          {running === undefined ? (
            <section className="card timer"><div className="clock idle">--:--:--</div></section>
          ) : running ? (
            <RunningTimer key={running.id} uid={user.uid} entry={running} task={runningTask} />
          ) : (
            <IdleTimer uid={user.uid} />
          )}
          <ManualEntry uid={user.uid} />
        </div>
        <TodayTasks uid={user.uid} tasks={tasks} running={running} />
      </div>

      <div className="section-head">
        <h2>Recent entries</h2>
        <Link to="/timesheet">See full timesheet →</Link>
      </div>
      {entries.length === 0 ? (
        <p className="muted">Nothing logged yet. Start the timer to log your first entry.</p>
      ) : (
        <EntryList entries={entries.slice(0, 10)} onDelete={(id) => deleteEntry(user.uid, id)} />
      )}
    </>
  )
}

// Open tasks due today or earlier, plus undated ones, plus anything finished today
function TodayTasks({ uid, tasks, running }) {
  const [title, setTitle] = useState('')
  const todayKey = dayKey(new Date())
  const todayStart = startOfDay()
  const shown = sortTasks(tasks.filter((t) =>
    t.done ? t.doneAt && t.doneAt >= todayStart : (!t.due || t.due <= todayKey))).slice(0, 8)
  const open = shown.filter((t) => !t.done).length

  async function add(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(uid, { title, due: todayKey })
    setTitle('')
  }

  return (
    <section className="card">
      <div className="panel-head">
        <h2>Today's tasks</h2>
        <span className="count">{open} open</span>
        <Link to="/tasks" className="grow" style={{ textAlign: 'right', fontSize: 14 }}>View all</Link>
      </div>
      {shown.length === 0
        ? <p className="muted small">Nothing due today. Add a task below or plan ahead on the Tasks page.</p>
        : (
          <ul className="tasks">
            {shown.map((t) => (
              <TaskRow key={t.id} task={t}
                timing={running?.taskId === t.id}
                canStart={running === null}
                onToggle={(done) => setTaskDone(uid, t.id, done)}
                onStart={() => startTimer(uid, t.project || t.title, t.id)}
                onDelete={() => deleteTask(uid, t.id)} />
            ))}
          </ul>
        )}
      <form className="quick-add" onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Add a task for today…" aria-label="New task for today" />
        <button className="btn" disabled={!title.trim()}>Add</button>
      </form>
    </section>
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
      <div className="timer-head"><span className="muted small">Ready when you are</span></div>
      <div className="clock idle">00:00:00</div>
      <div className="timer-sub">Or press ▶ on a task to time it</div>
      <form onSubmit={start} className="stack">
        <label><span>Project / task <span className="muted">(optional)</span></span>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <button className="btn start" disabled={busy}>▶ Start timer</button>
      </form>
    </section>
  )
}

function RunningTimer({ uid, entry, task }) {
  const [now, setNow] = useState(() => Date.now())
  const [project, setProject] = useState(entry.project)
  const [notes, setNotes] = useState(entry.notes)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('') // the draft text last confirmed saved
  const saved = savedAt === `${project}
${notes}`
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
    const t = setTimeout(() => saveDraft(uid, entry.id, { project: project.trim(), notes })
      .then(() => setSavedAt(`${project}
${notes}`)), 800)
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
      <div className="timer-head">
        <span className="pill-badge"><span className="pulse" />Timer running</span>
        <span className="muted small">Started at {formatTime(entry.startedAt)}</span>
      </div>
      <div className="clock" aria-live="off">{elapsed}</div>
      <div className="timer-sub">{task ? `Task · ${task.title}` : project || 'No project'}</div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={stop} className="stack">
        <label>Project / task
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <label><span>What did you work on? {saved && <span className="saved">● Auto-saved</span>}</span>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Wrote lesson plan for chapter 3, reviewed worksheets…" />
        </label>
        <div className="timer-actions">
          <button className="btn stop">■ Stop &amp; submit</button>
          <button type="button" className="link quiet" onClick={discard}>Discard timer</button>
        </div>
      </form>
    </section>
  )
}
