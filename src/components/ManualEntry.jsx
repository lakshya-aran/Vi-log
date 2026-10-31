import { useState } from 'react'
import { addManualEntry } from '../entries'
import { toLocalInput } from '../format'

export default function ManualEntry({ uid }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [project, setProject] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  function toggle(e) {
    const isOpen = e.currentTarget.open
    setOpen(isOpen)
    if (isOpen && !start) {
      const now = new Date()
      setEnd(toLocalInput(now))
      setStart(toLocalInput(new Date(now.getTime() - 3600000)))
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setDone('')
    const s = new Date(start)
    const en = new Date(end)
    if (!(en > s)) return setError('End time must be after start time.')
    if (en > new Date()) return setError('End time cannot be in the future.')
    if (!notes.trim()) return setError('Add a note on what you worked on.')
    await addManualEntry(uid, { project, notes, start: s, end: en })
    setNotes('')
    setDone('Time logged.')
  }

  return (
    <details className="card manual" open={open} onToggle={toggle}>
      <summary>Log time manually</summary>
      <form onSubmit={submit} className="stack">
        {error && <div className="error">{error}</div>}
        {done && <div className="flash">{done}</div>}
        <div className="row">
          <label>Start<input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required /></label>
          <label>End<input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
        </div>
        <label>Project / task<input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Grade 5 Science module" /></label>
        <label>What did you work on?<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} required /></label>
        <button className="btn">Add entry</button>
      </form>
    </details>
  )
}
