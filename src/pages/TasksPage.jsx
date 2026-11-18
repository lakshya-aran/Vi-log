import { useEffect, useState } from 'react'
import { watchEntries, watchRunning } from '../entries'
import { PRIORITIES, addTask, sortTasks, trackedByTask, updateTask, watchTasks } from '../tasks'
import { dayKey, startOfWeek } from '../format'
import { useActions, useNow } from '../hooks'
import TaskRow from '../components/TaskRow'
import { Card, CountUp, EmptyState, Icon, PageHeader, btn, field } from '../components/ui'

const TABS = [['all', 'All'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['done', 'Done']]
const GROUPS = [['overdue', 'Overdue', 'text-tertiary', 'bg-tertiary'], ['today', 'Today', 'text-primary', 'bg-primary'],
  ['upcoming', 'Upcoming', 'text-on-surface-variant', 'bg-outline'], ['nodate', 'No due date', 'text-on-surface-variant', 'bg-outline-variant']]

export default function TasksPage({ user }) {
  const uid = user.uid
  const actions = useActions(uid)
  const [tasks, setTasks] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [entries, setEntries] = useState([])
  const [running, setRunning] = useState(undefined)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [project, setProject] = useState('')
  const [showDone, setShowDone] = useState(false)
  const now = useNow(60000)

  useEffect(() => watchTasks(uid, (t, err) => { setTasks(t); setLoadError(err) }), [uid])
  useEffect(() => watchEntries(uid, setEntries, 1000), [uid])
  useEffect(() => watchRunning(uid, setRunning), [uid])

  if (tasks === null) {
    return <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-container-low animate-pulse" />)}</div>
  }

  if (loadError) {
    return (
      <Card className="p-2"><EmptyState icon="lock" title="Tasks can't load yet"
        text={loadError.code === 'permission-denied'
          ? 'Firestore is blocking the tasks collection. Publish the updated firestore.rules in the Firebase console (Firestore → Rules) and reload.'
          : `Firestore error: ${loadError.message}`} /></Card>
    )
  }

  const today = dayKey(new Date(now))
  const tracked = trackedByTask(entries, running, now)
  const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))].sort()

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
  const groups = GROUPS
    .filter(([k]) => tab === 'all' || tab === k)
    .map((g) => [...g, filtered.filter((t) => kind(t) === g[0])])
    .filter((g) => g[4].length)
  const done = filtered.filter((t) => t.done)
  const openCount = tasks.filter((t) => !t.done).length
  const doneThisWeek = tasks.filter((t) => t.done && t.doneAt && t.doneAt >= startOfWeek()).length

  const row = (t) => (
    <TaskRow key={t.id} task={t} tracked={tracked[t.id] || 0}
      timing={running?.taskId === t.id}
      canStart={running === null}
      onToggle={(d) => actions.toggleTask(t, d)}
      onStart={() => actions.startTask(t)}
      onDelete={() => actions.removeTask(t)}
      onSave={(fields) => updateTask(uid, t.id, fields).catch(actions.fail)} />
  )

  function clearDone() {
    if (!confirm(`Delete ${done.length} completed task${done.length === 1 ? '' : 's'}? This can't be undone.`)) return
    done.forEach((t) => actions.removeTask(t))
  }

  return (
    <>
      <PageHeader eyebrow="Plan · prioritise · track" title="My tasks"
        subtitle="Plan your work, then press ▶ to log time against a task.">
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm min-w-[140px] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Open</p>
              <p className="text-2xl font-headline font-bold tabular-nums"><CountUp value={openCount} /></p></div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm min-w-[140px] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Done this week</p>
              <p className="text-2xl font-headline font-bold tabular-nums text-secondary"><CountUp value={doneThisWeek} /></p></div>
          </div>
        </div>
      </PageHeader>

      <AddTask uid={uid} projects={projects} onAdded={(title) => actions.toast({ message: `Added: ${title}`, icon: 'add_task' })} />

      <div className="flex flex-wrap items-center gap-2 mt-6 mb-2">
        <div className="flex flex-wrap gap-1" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              onClick={() => { setTab(k); if (k === 'done') setShowDone(true) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${tab === k
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : k === 'overdue' && counts.overdue ? 'text-tertiary font-medium hover:bg-tertiary/10' : 'text-on-surface-variant font-medium hover:bg-surface-container-low'}`}>
              {label}<span className="ml-1.5 text-xs opacity-70 tabular-nums">{counts[k]}</span>
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <div className="relative">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant" />
          <input type="search" className={`${field} pl-8 py-2 w-48 bg-surface-container-lowest shadow-sm`} placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
        </div>
        <select className={`${field} py-2 w-auto bg-surface-container-lowest shadow-sm`} value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {tab !== 'done' && groups.length === 0 && (
        <Card className="mt-4"><EmptyState icon={tasks.length ? 'filter_alt_off' : 'checklist'}
          title={tasks.length ? 'No tasks match this view' : 'No tasks yet'}
          text={tasks.length ? 'Try another tab, project or search.' : 'Add your first task above, then press ▶ to time it.'} /></Card>
      )}

      {tab !== 'done' && groups.map(([k, label, text, dot, list]) => (
        <section key={k} className="animate-fade-up">
          <h3 className={`flex items-center gap-2 mt-6 mb-2 text-xs font-bold uppercase tracking-wider ${text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}<span className="opacity-70">{list.length}</span>
          </h3>
          <Card className="p-2"><ul className="flex flex-col gap-1.5">{list.map(row)}</ul></Card>
        </section>
      ))}

      {(tab === 'all' || tab === 'done') && done.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <button className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
              <Icon name="expand_more" className={`text-[18px] transition-transform ${showDone ? '' : '-rotate-90'}`} />Done
            </button>
            <span className="text-xs font-semibold text-secondary">{done.length} completed</span>
            <span className="flex-1" />
            <button className="text-xs text-on-surface-variant hover:text-tertiary" onClick={clearDone}>Clear completed</button>
          </div>
          {showDone && <Card className="p-2 animate-fade-up"><ul className="flex flex-col gap-1.5">{done.map(row)}</ul></Card>}
        </section>
      )}
      {tab === 'done' && done.length === 0 && <Card className="mt-4"><EmptyState icon="hourglass_empty" title="Nothing completed yet" text="Tick a task when it's done, and it shows up here." /></Card>}
    </>
  )
}

function AddTask({ uid, projects, onAdded }) {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState('medium')

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(uid, { title, project, due, priority })
    onAdded(title.trim())
    setTitle('')
  }

  return (
    <Card className="p-3">
      <form className="grid grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_auto_auto_auto] gap-2.5" onSubmit={submit}>
        <div className="relative col-span-2 lg:col-span-1">
          <Icon name="add_task" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant" />
          <input className={`${field} pl-9`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" aria-label="Task title" required />
        </div>
        <input className={field} value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project" aria-label="Project" list="task-projects" />
        <datalist id="task-projects">{projects.map((p) => <option key={p} value={p} />)}</datalist>
        <input type="date" className={field} value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <select className={field} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} priority</option>)}
        </select>
        <button className={`${btn.primary} col-span-2 lg:col-span-1`}><Icon name="add" className="text-[18px]" />Add task</button>
      </form>
    </Card>
  )
}
