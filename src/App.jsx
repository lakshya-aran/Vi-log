import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, missingConfig } from './firebase'
import AuthPage from './pages/AuthPage'
import TimerPage from './pages/TimerPage'
import TimesheetPage from './pages/TimesheetPage'

export const ORG = 'Vicharanashala Lab for Education Design'

export default function App() {
  if (missingConfig.length) return <SetupNeeded missing={missingConfig} />
  return <LoggedApp />
}

function SetupNeeded({ missing }) {
  return (
    <main>
      <div className="card auth">
        <h1>Time-Plan isn't configured yet</h1>
        <p>These Firebase environment variables were not set when the app was built:</p>
        <ul>{missing.map((k) => <li key={k}><code>{k}</code></li>)}</ul>
        <p className="muted">Add them in Vercel → Project → Settings → Environment Variables, then redeploy.</p>
      </div>
    </main>
  )
}

function LoggedApp() {
  const [user, setUser] = useState(undefined)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  if (user === undefined) return <div className="loading">Loading…</div>

  return (
    <>
      <header className="topbar">
        <NavLink className="brand" to="/">
          <span className="dot" />Time-Plan <small>{ORG}</small>
        </NavLink>
        {user && (
          <nav>
            <NavLink to="/" end>Timer</NavLink>
            <NavLink to="/timesheet">Timesheet</NavLink>
            <button className="link" onClick={() => signOut(auth)}>Sign out</button>
          </nav>
        )}
      </header>
      <main>
        {user ? (
          <Routes>
            <Route path="/" element={<TimerPage user={user} />} />
            <Route path="/timesheet" element={<TimesheetPage user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <AuthPage />
        )}
      </main>
    </>
  )
}
