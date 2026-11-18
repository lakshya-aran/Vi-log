import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { dayKey, startOfDay } from './format'

// Each user's tasks live under users/{uid}/tasks.
// due is a 'YYYY-MM-DD' string (or '' for no due date) so it never shifts across timezones.
const tasksOf = (uid) => collection(db, 'users', uid, 'tasks')

export const PRIORITIES = ['high', 'medium', 'low']
const RANK = { high: 0, medium: 1, low: 2 }

// cb(tasks, error): on failure (e.g. Firestore rules not published yet) cb gets [] plus the error
export function watchTasks(uid, cb) {
  return onSnapshot(query(tasksOf(uid), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map(toTask), null),
    (err) => cb([], err))
}

export function addTask(uid, { title, project = '', due = '', priority = 'medium' }) {
  return addDoc(tasksOf(uid), {
    title: title.trim(),
    project: project.trim(),
    due,
    priority,
    done: false,
    createdAt: serverTimestamp(),
    doneAt: null,
  })
}

export function updateTask(uid, id, fields) {
  return updateDoc(doc(tasksOf(uid), id), fields)
}

export function setTaskDone(uid, id, done) {
  return updateTask(uid, id, { done, doneAt: done ? serverTimestamp() : null })
}

export function deleteTask(uid, id) {
  return deleteDoc(doc(tasksOf(uid), id))
}

// Put a just-deleted task back under the same id (used by the Undo toast)
export function restoreTask(uid, t) {
  return setDoc(doc(tasksOf(uid), t.id), {
    title: t.title, project: t.project, due: t.due, priority: t.priority, done: t.done,
    createdAt: Timestamp.fromDate(t.createdAt),
    doneAt: t.doneAt ? Timestamp.fromDate(t.doneAt) : null,
  })
}

// Open tasks first; then overdue/soonest due date; then priority; then newest
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) =>
    (a.done - b.done)
    || ((a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : 0)
    || (RANK[a.priority] - RANK[b.priority])
    || (b.createdAt - a.createdAt))
}

function toTask(d) {
  const data = d.data({ serverTimestamps: 'estimate' })
  return {
    id: d.id,
    title: data.title || '',
    project: data.project || '',
    due: data.due || '',
    priority: RANK[data.priority] === undefined ? 'medium' : data.priority,
    done: !!data.done,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    doneAt: data.doneAt?.toDate() ?? null,
  }
}

// Friendly label for a 'YYYY-MM-DD' due date, plus whether it's overdue
export function dueInfo(due, done) {
  if (!due) return { label: '', overdue: false }
  const today = dayKey(new Date())
  const tomorrow = dayKey(new Date(startOfDay().getTime() + 36 * 3600000))
  const [y, m, d] = due.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = due === today ? 'Today'
    : due === tomorrow ? 'Tomorrow'
    : date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  return { label: due < today && !done ? `Overdue · ${label}` : label, overdue: due < today && !done }
}

// Total logged ms per taskId (finished entries + the running one up to `now`)
export function trackedByTask(entries, running, now = Date.now()) {
  const out = {}
  for (const e of entries) if (e.taskId) out[e.taskId] = (out[e.taskId] || 0) + (e.endedAt - e.startedAt)
  if (running?.taskId) out[running.taskId] = (out[running.taskId] || 0) + Math.max(0, now - running.startedAt)
  return out
}
