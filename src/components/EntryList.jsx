import { useState } from 'react'
import { duration, entryMs, formatTime, groupByDay, toLocalInput } from '../format'
import { updateEntry } from '../entries'
import { Chip, Icon, btn, field, labelCls } from './ui'

/**
 * Entries grouped by day. Pass uid + onDelete to make rows editable;
 * omit them for the read-only admin view (personName shows whose entry it is).
 */
export default function EntryList({ entries, uid, onDelete, personName, flat = false }) {
  const rows = (list) => (
    <div className="flex flex-col gap-2">
      {list.map((e, i) => <EntryRow key={e.id} entry={e} uid={uid} onDelete={onDelete} personName={personName} index={i} />)}
    </div>
  )
  if (flat) return rows(entries)
  return groupByDay(entries).map((day) => (
    <section className="mb-6" key={day.key}>
      <div className="flex justify-between items-baseline px-1 pb-2">
        <h3 className="text-sm font-bold text-on-surface">{day.label}</h3>
        <span className="text-sm font-headline font-bold tabular-nums text-on-surface-variant">{duration(day.ms)}</span>
      </div>
      {rows(day.entries)}
    </section>
  ))
}

function EntryRow({ entry: e, uid, onDelete, personName, index }) {
  const [editing, setEditing] = useState(false)

  if (editing) return <EditEntry entry={e} uid={uid} onDone={() => setEditing(false)} />

  return (
    <div className="p-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-headline font-bold text-xs tabular-nums shadow-sm min-w-[64px] text-center">
          {duration(entryMs(e))}
        </div>
        <div className="min-w-0">
          {personName && <p className="text-xs font-bold text-on-surface">{personName(e.uid)}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface">{formatTime(e.startedAt)} – {formatTime(e.endedAt)}</span>
            {e.project && <Chip tone="primary">{e.project}</Chip>}
          </div>
          {e.notes && <p className="text-xs text-on-surface-variant mt-0.5 whitespace-pre-wrap break-words">{e.notes}</p>}
        </div>
      </div>
      {onDelete && (
        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button className={btn.icon} onClick={() => setEditing(true)} aria-label="Edit entry"><Icon name="edit" className="text-[16px]" /></button>
          <button className={`${btn.icon} hover:!text-tertiary`} onClick={() => onDelete(e)} aria-label="Delete entry"><Icon name="delete" className="text-[16px]" /></button>
        </div>
      )}
    </div>
  )
}

function EditEntry({ entry, uid, onDone }) {
  const [start, setStart] = useState(toLocalInput(entry.startedAt))
  const [end, setEnd] = useState(toLocalInput(entry.endedAt))
  const [project, setProject] = useState(entry.project)
  const [notes, setNotes] = useState(entry.notes)
  const [error, setError] = useState('')

  async function save(ev) {
    ev.preventDefault()
    const s = new Date(start)
    const en = new Date(end)
    if (!(en > s)) return setError('End time must be after start time.')
    if (en > new Date()) return setError('End time cannot be in the future.')
    if (!notes.trim()) return setError('Add a note on what you worked on.')
    await updateEntry(uid, entry.id, { project, notes, start: s, end: en })
    onDone()
  }

  return (
    <form onSubmit={save} className="p-4 rounded-lg bg-primary-container/30 ring-1 ring-primary/30 space-y-3 animate-fade-up">
      {error && <p className="text-xs font-medium text-tertiary">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <label><span className={labelCls}>Start</span><input type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} required /></label>
        <label><span className={labelCls}>End</span><input type="datetime-local" className={field} value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
      </div>
      <label className="block"><span className={labelCls}>Project</span><input className={field} value={project} onChange={(e) => setProject(e.target.value)} /></label>
      <label className="block"><span className={labelCls}>Notes</span><textarea rows={2} className={`${field} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn.soft} onClick={onDone}>Cancel</button>
        <button className={btn.primary}>Save changes</button>
      </div>
    </form>
  )
}
