import { useState } from 'react'
import { PRIORITIES, dueInfo } from '../tasks'
import { duration } from '../format'
import { Chip, Icon, btn, field } from './ui'

const PRIO_DOT = { high: 'bg-tertiary', medium: 'bg-amber', low: 'bg-outline' }

/**
 * One task. `timing` = the running timer belongs to this task.
 * `canStart` = no timer is running, so ▶ can start one.
 * Pass onSave to allow inline editing (Tasks page); omit it for the compact home panel.
 */
export default function TaskRow({ task, tracked, timing, canStart, onToggle, onStart, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)
  const due = dueInfo(task.due, task.done)

  function save(e) {
    e.preventDefault()
    if (!draft.title.trim()) return
    onSave({ title: draft.title.trim(), project: draft.project.trim(), due: draft.due, priority: draft.priority })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="p-3 rounded-lg bg-primary-container/40 ring-1 ring-primary/30 animate-fade-up">
        <form className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_auto_auto] gap-2" onSubmit={save}>
          <input aria-label="Title" className={`${field} col-span-2 sm:col-span-1 py-2`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus required />
          <input aria-label="Project" className={`${field} py-2`} value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} placeholder="Project" />
          <input aria-label="Due date" type="date" className={`${field} py-2`} value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
          <select aria-label="Priority" className={`${field} py-2`} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
          <div className="col-span-2 sm:col-span-4 flex justify-end gap-2">
            <button type="button" className={btn.soft} onClick={() => { setDraft(task); setEditing(false) }}>Cancel</button>
            <button className={`${btn.primary} py-2`}>Save</button>
          </div>
        </form>
      </li>
    )
  }

  const shell = timing
    ? 'bg-secondary-container/40 ring-1 ring-secondary/30 shadow-sm'
    : task.done ? 'bg-surface-container-low/60 opacity-60' : 'bg-surface-container-low hover:bg-surface-container'

  return (
    <li className={`p-3 rounded-lg flex items-start gap-3 group transition-all duration-300 ${shell}`}>
      <button
        onClick={() => onToggle(!task.done)}
        className={`mt-0.5 w-5 h-5 rounded-md grid place-items-center flex-shrink-0 transition-all active:scale-90 ${task.done ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest hover:bg-secondary-container/40'}`}
        style={task.done ? undefined : { boxShadow: 'inset 0 0 0 1.5px var(--c-outline-variant)' }}
        aria-label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}>
        {task.done && <Icon name="check" className="text-[16px] animate-pop" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIO_DOT[task.priority]}`} title={`${task.priority} priority`} />
          <p className={`text-sm truncate ${task.done ? 'line-through text-on-surface-variant' : 'font-medium text-on-surface'}`}>{task.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {task.project && <Chip>{task.project}</Chip>}
          {timing && (
            <span className="text-[11px] text-secondary font-semibold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Currently timing
            </span>
          )}
          {due.label && (due.overdue
            ? <Chip tone="danger"><Icon name="warning" className="text-[12px]" />{due.label}</Chip>
            : <span className="text-[11px] text-on-surface-variant">{due.label}</span>)}
          {task.done && task.doneAt && <span className="text-[11px] text-on-surface-variant">Done {task.doneAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onSave && tracked > 0 && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md ${timing ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>
            <Icon name="schedule" className="text-[13px]" />{duration(tracked)}
          </span>
        )}
        {task.done ? (
          <Icon name="check_circle" fill className="text-[18px] text-secondary p-1" />
        ) : timing ? (
          <span className="w-7 h-7 rounded-full bg-secondary text-on-secondary grid place-items-center animate-pulse" title="Timer running on this task">
            <Icon name="graphic_eq" className="text-[16px]" />
          </span>
        ) : (
          <button className={`${btn.icon} opacity-60 group-hover:opacity-100`} onClick={onStart} disabled={!canStart}
            title={canStart ? 'Start timer on this task' : 'Stop the current timer first'} aria-label={`Start timer on "${task.title}"`}>
            <Icon name="play_arrow" className="text-[20px]" />
          </button>
        )}
        {onSave && (
          <button className={`${btn.icon} sm:opacity-0 group-hover:opacity-100 focus:opacity-100`} onClick={() => setEditing(true)} aria-label={`Edit "${task.title}"`}>
            <Icon name="edit" className="text-[17px]" />
          </button>
        )}
        {onDelete && (
          <button className={`${btn.icon} hover:!text-tertiary sm:opacity-0 group-hover:opacity-100 focus:opacity-100`} onClick={onDelete} aria-label={`Delete "${task.title}"`}>
            <Icon name="delete" className="text-[17px]" />
          </button>
        )}
      </div>
    </li>
  )
}
