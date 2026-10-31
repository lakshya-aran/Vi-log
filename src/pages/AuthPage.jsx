import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { saveProfile } from '../entries'
import { ORG } from '../App'

const messages = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'Enter a valid email.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
}

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (signup) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        await saveProfile(cred.user, name.trim())
        await cred.user.reload()
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (err) {
      setError(messages[err.code] || err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth card">
      <h1>{signup ? 'Create your account' : 'Sign in to Time-Plan'}</h1>
      <p className="muted">Track your working hours at {ORG}.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit} className="stack">
        {signup && (
          <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></label>
        )}
        <label>Work email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
        <button className="btn" disabled={busy}>{signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="muted">
        {signup ? 'Already have an account? ' : 'New here? '}
        <button className="link" onClick={() => { setMode(signup ? 'signin' : 'signup'); setError('') }}>
          {signup ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
