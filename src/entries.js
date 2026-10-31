import {
  addDoc, collection, collectionGroup, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, Timestamp, updateDoc, where,
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

// ---------- Profiles and admin ----------

// Saved so admins can show names next to entries
export function saveProfile(user, name) {
  const profile = { email: user.email }
  const n = name ?? user.displayName
  if (n) profile.name = n
  return setDoc(doc(db, 'users', user.uid), profile, { merge: true })
}

// Admins are the emails listed in firestore.rules. A non-admin gets permission-denied here.
export async function checkAdmin() {
  try {
    await getDocs(query(collection(db, 'users'), limit(1)))
    return true
  } catch {
    return false
  }
}

export async function loadAllData() {
  const [users, entries] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collectionGroup(db, 'entries')),
  ])
  const people = {}
  users.forEach((d) => { people[d.id] = { uid: d.id, name: d.data().name || '', email: d.data().email || '' } })
  const all = entries.docs.map((d) => ({ ...toEntry(d), uid: d.ref.parent.parent.id }))
  for (const e of all) {
    if (!people[e.uid]) people[e.uid] = { uid: e.uid, name: '', email: '' }
  }
  return { people, entries: all.sort((a, b) => b.startedAt - a.startedAt) }
}
