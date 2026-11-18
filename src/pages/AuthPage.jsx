import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { saveProfile } from '../entries'
import { ORG } from '../App'
import { Card, Icon, Ring, btn, field, labelCls } from '../components/ui'

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
    <div className="grid lg:grid-cols-2 gap-10 items-center py-6">
      <div className="hidden lg:flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />{ORG}
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">Calm, focused<br /><span className="text-primary">time tracking.</span></h1>
        <p className="text-on-surface-variant max-w-md">Plan your tasks, run focused Pomodoro sessions, and see where your week went — all in one place.</p>
        <div className="flex items-center gap-6">
          <Ring value={0.68} size={120} stroke={10} glow label="Example progress ring">
            <span className="font-headline font-extrabold text-xl text-secondary tabular-nums">17:02</span>
          </Ring>
          <ul className="space-y-2 text-sm">
            {[['timer', 'One-click timer with auto-saved notes'], ['checklist', 'Tasks you can time directly'], ['insights', 'Reports, goals and streaks']].map(([i, t]) => (
              <li key={t} className="flex items-center gap-2"><Icon name={i} className="text-primary text-[18px]" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <Card className="p-7 sm:p-8 shadow-md w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold">{signup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="text-sm text-on-surface-variant mt-1 mb-6">{signup ? 'Start tracking your working hours.' : 'Sign in to Time-Plan.'}</p>
        {error && <p className="mb-4 text-xs font-medium text-tertiary bg-tertiary/10 px-3 py-2 rounded-lg animate-fade-up">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          {signup && (
            <label className="block animate-fade-up"><span className={labelCls}>Full name</span><input className={field} value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></label>
          )}
          <label className="block"><span className={labelCls}>Work email</span><input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label className="block"><span className={labelCls}>Password</span><input type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete={signup ? 'new-password' : 'current-password'} /></label>
          <button className={`${btn.primary} w-full py-3`} disabled={busy}>
            {busy ? <Icon name="progress_activity" className="animate-spin text-[18px]" /> : <Icon name={signup ? 'person_add' : 'login'} className="text-[18px]" />}
            {signup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm text-on-surface-variant mt-5 text-center">
          {signup ? 'Already have an account? ' : 'New here? '}
          <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(signup ? 'signin' : 'signup'); setError('') }}>
            {signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </Card>
    </div>
  )
}
