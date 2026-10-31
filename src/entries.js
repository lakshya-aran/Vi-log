import {
  addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query,
  serverTimestamp, Timestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from './firebase'

// Each user's entries live under users/{uid}/entries.
// A running timer is an entry whose endedAt is null.
const entriesOf = (uid) => collection(db, 'users', uid, 'entries')

export function watchRunning(uid, cb) {
  return onSnapshot(query(entriesOf(uid), where('endedAt', '==', null)), (snap) => {
    const d = snap.docs[0]
    cb(d ? toEntry(d) : null)
  })
}

export function watchEntries(uid, cb, max = 500) {
  return onSnapshot(query(entriesOf(uid), orderBy('startedAt', 'desc'), limit(max)), (snap) => {
    cb(snap.docs.map(toEntry).filter((e) => e.endedAt))
  })
}

export function startTimer(uid, project) {
  return addDoc(entriesOf(uid), {
    project: project.trim(),
    notes: '',
    startedAt: serverTimestamp(),
    endedAt: null,
    createdAt: serverTimestamp(),
  })
}

export function stopTimer(uid, id, { project, notes }) {
  return updateDoc(doc(entriesOf(uid), id), {
    project: project.trim(),
    notes: notes.trim(),
    endedAt: serverTimestamp(),
  })
}

export function saveDraft(uid, id, fields) {
  return updateDoc(doc(entriesOf(uid), id), fields)
}

export function addManualEntry(uid, { project, notes, start, end }) {
  return addDoc(entriesOf(uid), {
    project: project.trim(),
    notes: notes.trim(),
    startedAt: Timestamp.fromDate(start),
    endedAt: Timestamp.fromDate(end),
    createdAt: serverTimestamp(),
  })
}

export function deleteEntry(uid, id) {
  return deleteDoc(doc(entriesOf(uid), id))
}

function toEntry(d) {
  const data = d.data({ serverTimestamps: 'estimate' })
  return {
    id: d.id,
    project: data.project || '',
    notes: data.notes || '',
    startedAt: data.startedAt?.toDate() ?? new Date(),
    endedAt: data.endedAt?.toDate() ?? null,
  }
}
