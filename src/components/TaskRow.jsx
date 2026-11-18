import { useState } from 'react'
import { PRIORITIES, dueInfo } from '../tasks'
import { duration } from '../format'

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

  const cls = ['task', task.done && 'done', timing && 'timing'].filter(Boolean).join(' ')

  if (editing) {
    return (
      <li className={cls}>
        <span /><span className={`prio ${draft.priority}`} />
        <form className="edit" onSubmit={save}>
          <input aria-label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus required />
          <input aria-label="Project" value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} placeholder="Project" />
          <input aria-label="Due date" type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
          <select aria-label="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
        </form>
        <div className="task-actions">
          <button className="btn" style={{ padding: '6px 12px', fontSize: 14 }} onClick={save}>Save</button>
          <button className="link quiet small" onClick={() => { setDraft(task); setEditing(false) }}>Cancel</button>
        </div>
      </li>
    )
  }

  return (
    <li className={cls}>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(!task.done)}
        aria-label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`} />
      <span className={`prio ${task.priority}`} title={`${task.priority} priority`} />
      <div>
        <div className="title">{task.title}</div>
        {(task.project || due.label || timing) && (
          <div className="meta">
            {task.project && <span className="tag">{task.project}</span>}
            {timing && <span className="tag live">● Timing</span>}
            {due.label && <span className={due.overdue ? 'tag overdue' : 'tag plain'}>{due.label}</span>}
          </div>
        )}
      </div>
      <div className="task-actions">
        {onSave && tracked > 0 && <span className={timing ? 'tracked live' : 'tracked'}>{duration(tracked)}</span>}
        {!task.done && (
          timing
            ? <span className="icon-btn live" title="Timer running on this task" aria-label="Timer running on this task">❚❚</span>
            : <button className="icon-btn" onClick={onStart} disabled={!canStart}
                title={canStart ? 'Start timer on this task' : 'Stop the current timer first'}
                aria-label={`Start timer on "${task.title}"`}>▶</button>
        )}
        {onSave && <button className="icon-btn quiet" onClick={() => setEditing(true)} title="Edit" aria-label={`Edit "${task.title}"`}>✎</button>}
        {onDelete && (
          <button className="icon-btn quiet" title="Delete" aria-label={`Delete "${task.title}"`}
            onClick={() => confirm(`Delete "${task.title}"?`) && onDelete()}>✕</button>
        )}
      </div>
    </li>
  )
}
