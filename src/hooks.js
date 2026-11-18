import { useEffect, useState } from 'react'
import { deleteEntry, restoreEntry, startTimer } from './entries'
import { deleteTask, restoreTask, setTaskDone } from './tasks'
import { useToast } from './components/toast'

// Re-render every `ms` (for live clocks and rings)
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

// Task + entry actions that report back through toasts, with Undo where it makes sense
export function useActions(uid) {
  const toast = useToast()
  const fail = (err) => toast({ message: `Couldn't save: ${err.code || err.message}`, icon: 'error', tone: 'danger' })

  return {
    toggleTask(task, done) {
      setTaskDone(uid, task.id, done).catch(fail)
      if (done) toast({ message: `Done: ${task.title}`, icon: 'task_alt', action: { label: 'Undo', onClick: () => setTaskDone(uid, task.id, false) } })
    },
    removeTask(task) {
      deleteTask(uid, task.id).catch(fail)
      toast({ message: 'Task deleted', icon: 'delete', tone: 'danger', action: { label: 'Undo', onClick: () => restoreTask(uid, task).catch(fail) } })
    },
    startTask(task) {
      startTimer(uid, task.project || task.title, task.id)
        .then(() => toast({ message: `Timer started: ${task.title}`, icon: 'play_circle' }))
        .catch(fail)
    },
    removeEntry(entry) {
      deleteEntry(uid, entry.id).catch(fail)
      toast({ message: 'Entry deleted', icon: 'delete', tone: 'danger', action: { label: 'Undo', onClick: () => restoreEntry(uid, entry).catch(fail) } })
    },
    toast,
    fail,
  }
}
