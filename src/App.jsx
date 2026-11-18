import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, missingConfig } from './firebase'
import AuthPage from './pages/AuthPage'
import TimerPage from './pages/TimerPage'
import TimesheetPage from './pages/TimesheetPage'
import AdminPage from './pages/AdminPage'
import TasksPage from './pages/TasksPage'
import ReportsPage from './pages/ReportsPage'
import { checkAdmin, saveProfile } from './entries'
import { ToastProvider } from './components/toast'
import { Card, Icon } from './components/ui'

export const ORG = 'Vicharanashala Lab for Education Design'

export default function App() {
  if (missingConfig.length) return <SetupNeeded missing={missingConfig} />
  return <ToastProvider><LoggedApp /></ToastProvider>
}

function SetupNeeded({ missing }) {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Card className="p-7 space-y-3">
        <h1 className="text-2xl font-bold">Time-Plan isn't configured yet</h1>
        <p className="text-sm text-on-surface-variant">These Firebase environment variables were not set when the app was built:</p>
        <ul className="text-sm list-disc pl-5">{missing.map((k) => <li key={k}><code>{k}</code></li>)}</ul>
        <p className="text-xs text-on-surface-variant">Add them in Vercel → Project → Settings → Environment Variables, then redeploy.</p>
      </Card>
    </main>
  )
}

const NAV = [
  ['/', 'Timer', 'timer'],
  ['/tasks', 'Tasks', 'checklist'],
  ['/timesheet', 'Timesheet', 'calendar_month'],
  ['/reports', 'Reports', 'insights'],
]

function LoggedApp() {
  const [user, setUser] = useState(undefined)
  const [adminUid, setAdminUid] = useState(null)
  const [menu, setMenu] = useState(false)
  const location = useLocation()
  const isAdmin = !!user && adminUid === user.uid

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!user) return
    saveProfile(user).catch(() => {})
    checkAdmin().then((ok) => ok && setAdminUid(user.uid))
  }, [user])

  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center text-on-surface-variant"><Icon name="progress_activity" className="animate-spin text-3xl text-primary" /></div>
  }

  const nav = isAdmin ? [...NAV, ['/admin', 'Team', 'groups']] : NAV
  const initial = (user?.displayName || user?.email || '?')[0].toUpperCase()
  const linkCls = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${isActive
      ? 'bg-primary-container text-on-primary-container font-semibold'
      : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-surface-container-lowest/85 backdrop-blur border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <div className="h-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
            <span className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-base tracking-tight leading-none">Time-Plan</span>
              <span className="text-[11px] font-medium text-on-surface-variant leading-tight mt-0.5 hidden sm:block truncate">{ORG}</span>
            </span>
          </NavLink>
          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="hidden md:flex items-center gap-1">
                {nav.map(([to, label, icon]) => (
                  <NavLink key={to} to={to} end={to === '/'} className={linkCls}>
                    <Icon name={icon} className="text-[18px]" />{label}
                  </NavLink>
                ))}
              </nav>
              <div className="h-4 w-px bg-outline-variant/40 hidden md:block" />
              <button className="text-sm font-medium text-on-surface-variant hover:text-tertiary transition-colors hidden md:inline-block" onClick={() => signOut(auth)}>Sign out</button>
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary grid place-items-center font-headline font-bold text-sm" title={user.email}>{initial}</div>
              <button className="md:hidden p-1.5 rounded-lg hover:bg-surface-container" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu}>
                <Icon name={menu ? 'close' : 'menu'} />
              </button>
            </div>
          )}
        </div>
        {user && menu && (
          <nav className="md:hidden border-t border-outline-variant/30 px-4 py-3 flex flex-col gap-1 animate-fade-up" onClick={() => setMenu(false)}>
            {nav.map(([to, label, icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkCls}><Icon name={icon} className="text-[18px]" />{label}</NavLink>
            ))}
            <button className="text-left px-3 py-1.5 text-sm font-medium text-tertiary" onClick={() => signOut(auth)}>Sign out</button>
          </nav>
        )}
      </header>

      <main className="w-full flex-1">
        <div key={location.pathname} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
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
        </div>
      </main>

      <footer className="w-full border-t border-outline-variant/20 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <p>© {ORG}. Calm &amp; focused work.</p>
          <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Synced with Firebase</span>
        </div>
      </footer>
    </div>
  )
}
