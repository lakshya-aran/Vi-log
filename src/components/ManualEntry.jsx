import { useState } from 'react'
import { addManualEntry } from '../entries'
import { toLocalInput } from '../format'
import { useToast } from './toast'
import { Card, Icon, btn, field, labelCls } from './ui'

export default function ManualEntry({ uid }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [project, setProject] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function toggle() {
    if (!open && !start) {
      const now = new Date()
      setEnd(toLocalInput(now))
      setStart(toLocalInput(new Date(now.getTime() - 3600000)))
    }
    setOpen(!open)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    const s = new Date(start)
    const en = new Date(end)
    if (!(en > s)) return setError('End time must be after start time.')
    if (en > new Date()) return setError('End time cannot be in the future.')
    if (!notes.trim()) return setError('Add a note on what you worked on.')
    await addManualEntry(uid, { project, notes, start: s, end: en })
    setNotes('')
    toast({ message: 'Time logged', icon: 'more_time' })
  }

  return (
    <Card className="overflow-hidden">
      <button onClick={toggle} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-container-low transition-colors">
        <span className="flex items-center gap-2.5 font-headline font-semibold text-sm">
          <Icon name="more_time" className="text-primary" />Log time manually
        </span>
        <Icon name="expand_more" className={`text-on-surface-variant transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <form onSubmit={submit} className="px-5 pb-5 space-y-3 animate-fade-up">
          {error && <p className="text-xs font-medium text-tertiary">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <label><span className={labelCls}>Start</span><input type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} required /></label>
            <label><span className={labelCls}>End</span><input type="datetime-local" className={field} value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
          </div>
          <label className="block"><span className={labelCls}>Project / task</span>
            <input className={field} value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" />
          </label>
          <label className="block"><span className={labelCls}>What did you work on?</span>
            <textarea rows={3} className={`${field} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} required />
          </label>
          <button className={btn.primary}><Icon name="add" className="text-[18px]" />Add entry</button>
        </form>
      )}
    </Card>
  )
}
