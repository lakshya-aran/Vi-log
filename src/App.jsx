import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, missingConfig } from './firebase'
import AuthPage from './pages/AuthPage'
import TimerPage from './pages/TimerPage'
import TimesheetPage from './pages/TimesheetPage'
import AdminPage from './pages/AdminPage'
import TasksPage from './pages/TasksPage'
import ReportsPage from './pages/ReportsPage'
import { checkAdmin, saveProfile } from './entries'

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
  const [adminUid, setAdminUid] = useState(null)
  const isAdmin = !!user && adminUid === user.uid

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!user) return
    saveProfile(user).catch(() => {})
    checkAdmin().then((ok) => ok && setAdminUid(user.uid))
  }, [user])

  if (user === undefined) return <div className="loading">Loading…</div>

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <NavLink className="brand" to="/">
            <span className="dot" /><span><b>Time-Plan</b><small>{ORG}</small></span>
          </NavLink>
          {user && (
            <nav>
              <NavLink to="/" end>Timer</NavLink>
              <NavLink to="/tasks">Tasks</NavLink>
              <NavLink to="/timesheet">Timesheet</NavLink>
              <NavLink to="/reports">Reports</NavLink>
              {isAdmin && <NavLink to="/admin">Team</NavLink>}
              <span className="sep" />
              <button className="link quiet" onClick={() => signOut(auth)}>Sign out</button>
            </nav>
          )}
        </div>
      </header>
      <main>
        {user ? (
          <Routes>
            <Route path="/" element={<TimerPage user={user} />} />
            <Route path="/tasks" element={<TasksPage user={user} />} />
            <Route path="/timesheet" element={<TimesheetPage user={user} />} />
            <Route path="/reports" element={<ReportsPage user={user} />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <AuthPage />
        )}
      </main>
      <footer className="footer">© {ORG}. Calm &amp; focused work.</footer>
    </>
  )
}
