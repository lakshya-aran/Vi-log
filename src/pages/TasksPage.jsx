import { useEffect, useState } from 'react'
import { startTimer, watchEntries, watchRunning } from '../entries'
import { PRIORITIES, addTask, deleteTask, setTaskDone, sortTasks, trackedByTask, updateTask, watchTasks } from '../tasks'
import { dayKey, startOfWeek } from '../format'
import TaskRow from '../components/TaskRow'

const TABS = [['all', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['done', 'Done']]

export default function TasksPage({ user }) {
  const uid = user.uid
  const [tasks, setTasks] = useState(null)
  const [entries, setEntries] = useState([])
  const [running, setRunning] = useState(undefined)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [project, setProject] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => watchTasks(uid, setTasks), [uid])
  useEffect(() => watchEntries(uid, setEntries, 1000), [uid])
  useEffect(() => watchRunning(uid, setRunning), [uid])
  // Tick once a minute so the running task's tracked time stays fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  if (tasks === null) return <p className="muted">Loading tasks…</p>

  const today = dayKey(new Date())
  const tracked = trackedByTask(entries, running, now)
  const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))].sort()
  const weekStart = startOfWeek()

  const kind = (t) => t.done ? 'done' : !t.due ? 'nodate' : t.due < today ? 'overdue' : t.due === today ? 'today' : 'upcoming'
  const matches = (t) =>
    (!project || t.project === project)
    && (!search.trim() || `${t.title} ${t.project}`.toLowerCase().includes(search.trim().toLowerCase()))
  const filtered = sortTasks(tasks.filter(matches))
  const counts = { all: 0, today: 0, upcoming: 0, overdue: 0, done: 0 }
  for (const t of filtered) {
    const k = kind(t)
    if (k !== 'done') counts.all++
    if (k in counts) counts[k]++
  }

  const groups = [
    ['overdue', 'Overdue'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['nodate', 'No due date'],
  ]
    .filter(([k]) => tab === 'all' || tab === k)
    .map(([k, label]) => [k, label, filtered.filter((t) => kind(t) === k)])
    .filter(([, , list]) => list.length)
  const done = filtered.filter((t) => t.done)
  const openCount = tasks.filter((t) => !t.done).length
  const doneThisWeek = tasks.filter((t) => t.done && t.doneAt && t.doneAt >= weekStart).length

  const row = (t) => (
    <TaskRow key={t.id} task={t} tracked={tracked[t.id] || 0}
      timing={running?.taskId === t.id}
      canStart={running === null}
      onToggle={(d) => setTaskDone(uid, t.id, d)}
      onStart={() => startTimer(uid, t.project || t.title, t.id)}
      onDelete={() => deleteTask(uid, t.id)}
      onSave={(fields) => updateTask(uid, t.id, fields)} />
  )

  async function clearDone() {
    if (!confirm(`Delete ${done.length} completed task${done.length === 1 ? '' : 's'}?`)) return
    await Promise.all(done.map((t) => deleteTask(uid, t.id)))
  }

  return (
    <>
      <div className="hello">
        <div>
          <h1>My tasks</h1>
          <p>Plan your work, then press ▶ to log time against a task.</p>
        </div>
        <div className="stats">
          <div><span>Open</span><strong>{openCount}</strong></div>
          <div><span>Done this week</span><strong className="go">{doneThisWeek}</strong></div>
        </div>
      </div>

      <AddTask uid={uid} projects={projects} />

      <div className="filters">
        <div className="tabs" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              className={[tab === k && 'on', k === 'overdue' && counts.overdue && 'warn'].filter(Boolean).join(' ')}
              onClick={() => { setTab(k); if (k === 'done') setShowDone(true) }}>
              {label}<b>{counts[k]}</b>
            </button>
          ))}
        </div>
        <span className="grow" />
        <input type="search" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
        <select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {tab !== 'done' && groups.length === 0 && (
        <p className="muted">{tasks.length ? 'No tasks match this view.' : 'No tasks yet. Add your first one above.'}</p>
      )}

      {tab !== 'done' && groups.map(([k, label, list]) => (
        <section key={k}>
          <div className={k === 'overdue' ? 'group-head warn' : 'group-head'}>{label} <span className="count">{list.length}</span></div>
          <ul className="tasks card group">{list.map(row)}</ul>
        </section>
      ))}

      {(tab === 'all' || tab === 'done') && done.length > 0 && (
        <section>
          <div className="group-head">
            <button className="link quiet" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
              {showDone ? '▾' : '▸'} Done
            </button>
            <span className="count">{done.length}</span>
            <button className="link quiet" onClick={clearDone}>Clear completed</button>
          </div>
          {showDone && <ul className="tasks card group">{done.map(row)}</ul>}
        </section>
      )}
      {tab === 'done' && done.length === 0 && <p className="muted">Nothing completed yet.</p>}
    </>
  )
}

function AddTask({ uid, projects }) {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState('medium')

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(uid, { title, project, due, priority })
    setTitle('')
  }

  return (
    <form className="card add-task" onSubmit={submit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" aria-label="Task title" required />
      <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project" aria-label="Project" list="task-projects" />
      <datalist id="task-projects">{projects.map((p) => <option key={p} value={p} />)}</datalist>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
        {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} priority</option>)}
      </select>
      <button className="btn">+ Add task</button>
    </form>
  )
}
