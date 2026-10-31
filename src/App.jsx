import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import AuthPage from './pages/AuthPage'
import TimerPage from './pages/TimerPage'
import TimesheetPage from './pages/TimesheetPage'

export const ORG = 'Vicharanashala Lab for Education Design'

export default function App() {
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
