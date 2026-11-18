import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { saveDraft, startTimer, stopTimer, watchEntries, watchProfile, watchRunning, deleteEntry, DEFAULT_GOALS } from '../entries'
import { addTask, sortTasks, watchTasks } from '../tasks'
import { clock, dayKey, duration, entryMs, formatTime, startOfDay, startOfWeek } from '../format'
import { POMODORO_MIN, streak } from '../stats'
import { useActions, useNow } from '../hooks'
import EntryList from '../components/EntryList'
import ManualEntry from '../components/ManualEntry'
import TaskRow from '../components/TaskRow'
import { GoalEditor, Heatmap } from '../components/Momentum'
import { Card, Confetti, CountUp, EmptyState, Icon, PageHeader, Ring, StatTile, btn, field, labelCls } from '../components/ui'

const POMO_MS = POMODORO_MIN * 60000

const TIPS = [
  'Deep work blocks of 45–60 minutes preserve continuity when synthesizing classroom trial transcripts.',
  'Write the note while it is fresh: one line on what changed is worth more than a perfect summary later.',
  'Take a 5-minute break after each Pomodoro. Stand up, look away from the screen, drink water.',
  'Start the day by ticking the one task that would make today a success.',
  'Batch small admin tasks into a single 25-minute session instead of scattering them.',
]

export default function TimerPage({ user }) {
  const actions = useActions(user.uid)
  const [running, setRunning] = useState(undefined)
  const [entries, setEntries] = useState([])
  const [tasks, setTasks] = useState([])
  const [profile, setProfile] = useState({ ...DEFAULT_GOALS, name: '' })
  const [focus, setFocus] = useState(false)
  const [editGoals, setEditGoals] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
  const now = useNow(1000)

  useEffect(() => watchRunning(user.uid, setRunning), [user.uid])
  useEffect(() => watchEntries(user.uid, setEntries, 1000), [user.uid])
  useEffect(() => watchTasks(user.uid, setTasks), [user.uid])
  useEffect(() => watchProfile(user.uid, setProfile), [user.uid])

  const live = running ? Math.max(0, now - running.startedAt) : 0
  const sum = (from) => entries.filter((e) => e.startedAt >= from).reduce((s, e) => s + entryMs(e), 0)
  const todayMs = sum(startOfDay()) + live
  const weekMs = sum(startOfWeek()) + live
  const dailyGoal = profile.dailyGoalMin * 60000
  const weeklyGoal = profile.weeklyGoalMin * 60000
  const days = streak(entries)
  const runningTask = running?.taskId ? tasks.find((t) => t.id === running.taskId) : null
  const firstName = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]
  const today = new Date(now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })

  // Celebrate once when today's total crosses the daily goal while the page is open
  const wasBelow = useRef(null)
  useEffect(() => {
    if (!dailyGoal || running === undefined) return
    const below = todayMs < dailyGoal
    if (wasBelow.current === true && !below) {
      setCelebrate((n) => n + 1)
      actions.toast({ message: `Daily goal reached: ${duration(dailyGoal)} 🎉`, icon: 'emoji_events', ms: 6000 })
    }
    wasBelow.current = below
  }, [todayMs >= dailyGoal, dailyGoal, running === undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  // Nudge for a break each time a Pomodoro completes
  const pomos = running ? Math.floor(live / POMO_MS) : 0
  const lastPomo = useRef(null)
  useEffect(() => {
    if (!running) { lastPomo.current = null; return }
    if (lastPomo.current !== null && pomos > lastPomo.current) {
      actions.toast({ message: `Pomodoro ${pomos} complete. Take a 5-minute break.`, icon: 'self_improvement', ms: 8000 })
    }
    lastPomo.current = pomos
  }, [pomos, running?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader
        eyebrow={days > 0 ? `🔥 ${days}-day streak` : 'Ready for a focused session'}
        title={`Hi ${firstName}`}
        subtitle={`${today} • Let's make deliberate progress today.`}>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <StatTile label="Today" icon="timelapse" sub={dailyGoal ? `/ ${duration(dailyGoal)}` : null}
            progress={dailyGoal ? todayMs / dailyGoal : undefined}>
            {duration(todayMs)}
          </StatTile>
          <StatTile label="This week" icon="date_range" iconClass="text-secondary" tone="secondary"
            sub={weeklyGoal ? `/ ${duration(weeklyGoal)}` : null} progress={weeklyGoal ? weekMs / weeklyGoal : undefined}>
            {duration(weekMs)}
          </StatTile>
        </div>
      </PageHeader>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          {running === undefined ? (
            <Card className="p-7 h-[420px] animate-pulse" />
          ) : running ? (
            <RunningTimer key={running.id} uid={user.uid} entry={running} task={runningTask} live={live} onFocus={() => setFocus(true)} />
          ) : (
            <IdleTimer uid={user.uid} onFocus={() => setFocus(true)} />
          )}
          <TipCard />
          <ManualEntry uid={user.uid} />
        </div>
        <TodayTasks uid={user.uid} tasks={tasks} running={running} actions={actions} />
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-5 p-6 relative">
          {celebrate > 0 && <Confetti key={celebrate} />}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Daily goal</h2>
            <button className={btn.link} onClick={() => setEditGoals(!editGoals)}><Icon name="tune" className="text-sm" />Goals</button>
          </div>
          {editGoals ? <GoalEditor user={user} profile={profile} onClose={() => setEditGoals(false)} /> : (
            <div className="flex items-center gap-6">
              <Ring value={dailyGoal ? todayMs / dailyGoal : 0} size={132} stroke={11} tone={todayMs >= dailyGoal && dailyGoal ? 'secondary' : 'primary'}
                label={`${duration(todayMs)} of ${duration(dailyGoal)} today`}>
                <div>
                  <div className="text-2xl font-headline font-extrabold tabular-nums">
                    <CountUp value={dailyGoal ? Math.min(999, (todayMs / dailyGoal) * 100) : 0} />%
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">of goal</div>
                </div>
              </Ring>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-on-surface-variant">Logged today</p>
                  <p className="font-headline font-bold text-lg tabular-nums">{duration(todayMs)} <span className="text-xs font-medium text-on-surface-variant">of {duration(dailyGoal)}</span></p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-container text-amber">
                  <Icon name="local_fire_department" fill className="text-[18px]" />
                  <span className="text-sm font-bold"><CountUp value={days} /> day{days === 1 ? '' : 's'}</span>
                  <span className="text-xs font-medium">streak</span>
                </div>
                {todayMs >= dailyGoal && dailyGoal > 0 && (
                  <p className="text-xs font-semibold text-secondary inline-flex items-center gap-1 animate-pop"><Icon name="emoji_events" fill className="text-[16px]" />Goal reached today!</p>
                )}
              </div>
            </div>
          )}
        </Card>
        <Card className="md:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Activity</h2>
            <Link to="/reports" className={btn.link}>Reports<Icon name="arrow_forward" className="text-sm" /></Link>
          </div>
          <Heatmap entries={entries} weeks={16} />
        </Card>
      </section>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">Recent entries</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Your latest logged sessions</p>
          </div>
          <Link to="/timesheet" className={`${btn.link} group`}>
            See full timesheet<Icon name="arrow_forward" className="text-sm group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        {entries.length === 0
          ? <EmptyState icon="hourglass_empty" title="Nothing logged yet" text="Start the timer or press ▶ on a task to log your first entry." />
          : <EntryList flat entries={entries.slice(0, 6)} uid={user.uid} onDelete={actions.removeEntry} />}
      </Card>

      {focus && (
        <FocusMode uid={user.uid} running={running} task={runningTask} live={live} pomos={pomos} todayMs={todayMs} dailyGoal={dailyGoal} onClose={() => setFocus(false)} />
      )}
    </>
  )
}

function TipCard() {
  const [i, setI] = useState(() => Math.floor(Math.random() * TIPS.length))
  return (
    <div className="p-4 rounded-xl bg-surface-container-high/60 flex items-start gap-3">
      <Icon name="lightbulb" className="text-primary text-xl flex-shrink-0 mt-0.5" />
      <p key={i} className="text-xs leading-relaxed text-on-surface-variant flex-1 animate-fade-up">
        <span className="font-semibold text-on-surface">Focus tip:</span> {TIPS[i]}
      </p>
      <button className={btn.icon} onClick={() => setI((i + 1) % TIPS.length)} aria-label="Next tip"><Icon name="refresh" className="text-[16px]" /></button>
    </div>
  )
}

function PomodoroDots({ pomos }) {
  const inSet = pomos % 4
  return (
    <div className="flex items-center gap-1.5" aria-label={`${pomos} Pomodoros completed`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i < inSet ? 'bg-secondary scale-110' : 'bg-surface-container-high'}`} />
      ))}
      <span className="text-[11px] font-semibold text-on-surface-variant ml-1">{pomos} 🍅</span>
    </div>
  )
}

// Open tasks due today or earlier, plus undated ones, plus anything finished today
function TodayTasks({ uid, tasks, running, actions }) {
  const [title, setTitle] = useState('')
  const todayKey = dayKey(new Date())
  const todayStart = startOfDay()
  const shown = sortTasks(tasks.filter((t) =>
    t.done ? t.doneAt && t.doneAt >= todayStart : (!t.due || t.due <= todayKey))).slice(0, 7)
  const open = shown.filter((t) => !t.done).length
  const doneToday = shown.length - open

  async function add(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(uid, { title, due: todayKey })
    setTitle('')
    actions.toast({ message: 'Task added for today', icon: 'add_task' })
  }

  return (
    <Card className="lg:col-span-5 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">Today's tasks</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">{open} open</span>
        </div>
        <Link to="/tasks" className={btn.link}>View all</Link>
      </div>
      {shown.length > 0 && <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
        <div className="h-full bg-secondary rounded-full transition-[width] duration-700" style={{ width: `${(doneToday / shown.length) * 100}%` }} />
      </div>}
      {shown.length === 0
        ? <EmptyState icon="task_alt" title="Nothing due today" text="Add a task below, or plan ahead on the Tasks page." />
        : (
          <ul className="flex flex-col gap-2.5">
            {shown.map((t) => (
              <TaskRow key={t.id} task={t}
                timing={running?.taskId === t.id}
                canStart={running === null}
                onToggle={(done) => actions.toggleTask(t, done)}
                onStart={() => actions.startTask(t)}
                onDelete={() => actions.removeTask(t)} />
            ))}
          </ul>
        )}
      <form className="flex items-center gap-2 pt-2 mt-auto" onSubmit={add}>
        <div className="relative flex-1">
          <input className={`${field} text-xs pr-8`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Add a task for today…" aria-label="New task for today" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant/60 font-mono">⏎</span>
        </div>
        <button className={btn.soft} disabled={!title.trim()}>Add</button>
      </form>
    </Card>
  )
}

function IdleTimer({ uid, onFocus }) {
  const [project, setProject] = useState('')
  const [busy, setBusy] = useState(false)

  async function start(e, thenFocus) {
    e?.preventDefault()
    setBusy(true)
    try {
      await startTimer(uid, project)
      if (thenFocus) onFocus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-6 sm:p-7 shadow-md relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-outline" />Not tracking
        </span>
        <span className="text-xs font-medium text-on-surface-variant">Press ▶ on a task to time it</span>
      </div>
      <div className="py-6 flex flex-col items-center">
        <Ring value={0} size={210} stroke={12} label="Timer idle">
          <div>
            <div className="font-headline font-extrabold text-4xl text-on-surface-variant/60 tabular-nums">00:00:00</div>
            <div className="text-[11px] text-on-surface-variant mt-1 font-medium">{POMODORO_MIN}-min focus cycles</div>
          </div>
        </Ring>
      </div>
      <form onSubmit={start} className="space-y-4">
        <label className="block"><span className={labelCls}>Project / task <span className="normal-case font-medium tracking-normal">(optional)</span></span>
          <input className={field} value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className={`${btn.go} flex-1`} disabled={busy}><Icon name="play_arrow" fill className="text-[20px]" />Start timer</button>
          <button type="button" className={btn.ghost} disabled={busy} onClick={(e) => start(e, true)}>
            <Icon name="center_focus_strong" className="text-[18px]" />Start in focus mode
          </button>
        </div>
      </form>
    </Card>
  )
}

function RunningTimer({ uid, entry, task, live, onFocus }) {
  const [project, setProject] = useState(entry.project)
  const [notes, setNotes] = useState(entry.notes)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const saved = savedAt === `${project}\n${notes}`
  const elapsed = clock(live)
  const pomos = Math.floor(live / POMO_MS)

  useEffect(() => {
    document.title = `${elapsed} · Time-Plan`
    return () => { document.title = 'Time-Plan · Vicharanashala Lab for Education Design' }
  }, [elapsed])

  // Save the draft as they type, so closing the page before stopping loses nothing
  useEffect(() => {
    if (project === entry.project && notes === entry.notes) return
    const t = setTimeout(() => saveDraft(uid, entry.id, { project: project.trim(), notes })
      .then(() => setSavedAt(`${project}\n${notes}`)), 800)
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
    <Card className="p-6 sm:p-7 shadow-md relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-secondary-fixed opacity-40 blur-2xl pointer-events-none animate-breathe" />
      <div className="flex items-center justify-between relative z-10 gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
          </span>
          Timer running
        </div>
        <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
          <Icon name="schedule" className="text-xs" />Started at {formatTime(entry.startedAt)}
        </span>
      </div>

      <div className="py-6 flex flex-col items-center relative z-10">
        <Ring value={(live % POMO_MS) / POMO_MS} size={230} stroke={12} glow label={`Elapsed ${elapsed}`}>
          <div>
            <div className="font-headline font-extrabold text-4xl sm:text-5xl text-secondary tabular-nums tracking-tight" aria-live="off">{elapsed}</div>
            <div className="text-[11px] text-on-surface-variant mt-1 font-medium tabular-nums">
              {clock(POMO_MS - (live % POMO_MS)).slice(3)} left in this 🍅
            </div>
          </div>
        </Ring>
        <p className="text-xs text-on-surface-variant mt-3 font-medium tracking-wide text-center">
          {task ? <>Task · <span className="text-on-surface font-semibold">{task.title}</span></> : project || 'No project'}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <PomodoroDots pomos={pomos} />
          <button className={btn.link} onClick={onFocus}><Icon name="fullscreen" className="text-sm" />Focus mode</button>
        </div>
      </div>

      {error && <p className="relative z-10 mb-3 text-xs font-medium text-tertiary bg-tertiary/10 px-3 py-2 rounded-lg">{error}</p>}
      <form onSubmit={stop} className="space-y-4 relative z-10">
        <label className="block"><span className={labelCls}>Current project &amp; module</span>
          <input className={field} value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
        </label>
        <label className="block"><span className={labelCls}>Activity notes</span>
          <span className="relative block">
            <textarea rows={3} className={`${field} resize-none leading-relaxed`} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on?" />
            <span className={`absolute bottom-2.5 right-3 text-[11px] font-medium transition-opacity ${saved ? 'text-secondary opacity-100' : 'opacity-0'}`}>● Auto-saved</span>
          </span>
        </label>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button className={`${btn.stop} w-full sm:w-auto`}><Icon name="stop" fill className="text-[18px]" />Stop &amp; submit log</button>
          <button type="button" className="text-xs font-semibold text-tertiary transition-colors py-1.5 px-3 rounded hover:bg-tertiary/10" onClick={discard}>Discard timer</button>
        </div>
      </form>
    </Card>
  )
}

// Full-screen, distraction-free view of the running session
function FocusMode({ uid, running, task, live, pomos, todayMs, dailyGoal, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const inCycle = live % POMO_MS
  const label = running ? (task?.title || running.project || 'Focus session') : 'No timer running'

  return (
    <div className="fixed inset-0 z-[70] bg-[#0b1020] text-white flex flex-col items-center justify-center p-6 animate-[fade-up_.4s_both]" role="dialog" aria-modal="true" aria-label="Focus mode">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#1f9d61] opacity-20 blur-3xl animate-breathe" />
      </div>
      <button onClick={onClose} className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10">
        <Icon name="close_fullscreen" className="text-[18px]" />Exit <kbd className="text-[10px] opacity-60 ml-1">Esc</kbd>
      </button>
      <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-6 relative">Focus mode</p>
      <div className="relative">
        <Ring value={running ? inCycle / POMO_MS : 0} size={Math.min(360, window.innerWidth - 60)} stroke={14} glow={!!running} tone="secondary" label="Pomodoro progress">
          <div>
            <div className="font-headline font-extrabold text-5xl sm:text-6xl tabular-nums tracking-tight text-[#5fdc9a]">
              {running ? clock(POMO_MS - inCycle).slice(3) : '25:00'}
            </div>
            <div className="text-xs text-white/60 mt-2">left in this Pomodoro</div>
            <div className="text-sm text-white/80 mt-3 font-medium tabular-nums">{clock(live)} total</div>
          </div>
        </Ring>
      </div>
      <p className="mt-8 text-lg font-headline font-semibold text-center relative max-w-md">{label}</p>
      <div className="mt-4 flex items-center gap-2 relative">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < pomos % 4 ? 'bg-[#5fdc9a] shadow-[0_0_12px_#5fdc9a]' : 'bg-white/15'}`} />
        ))}
        <span className="text-sm text-white/60 ml-2">{pomos} completed</span>
      </div>
      {dailyGoal > 0 && (
        <div className="mt-8 w-full max-w-xs relative">
          <div className="flex justify-between text-xs text-white/60 mb-1.5"><span>Today</span><span className="tabular-nums">{duration(todayMs)} / {duration(dailyGoal)}</span></div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#5fdc9a] rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, (todayMs / dailyGoal) * 100)}%` }} /></div>
        </div>
      )}
      {!running && (
        <button className="mt-8 relative inline-flex items-center gap-2 bg-[#1f9d61] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition"
          onClick={() => startTimer(uid, '')}>
          <Icon name="play_arrow" fill />Start a session
        </button>
      )}
      {running && <p className="mt-8 text-xs text-white/40 relative">Exit focus mode to add notes and stop the timer.</p>}
    </div>
  )
}
