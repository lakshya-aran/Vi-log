import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Icon } from './ui'

const ToastContext = createContext(() => {})

// toast({ message, icon?, tone?, action?: { label, onClick }, ms? })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const toast = useCallback((t) => {
    const id = nextId.current++
    setToasts((all) => [...all.slice(-2), { id, icon: 'check_circle', tone: 'secondary', ...t }])
    setTimeout(() => dismiss(id), t.ms ?? (t.action ? 6000 : 3500))
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-stretch sm:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-toast flex items-center gap-3 bg-inverse-surface text-inverse-on-surface pl-3.5 pr-2 py-2.5 rounded-xl shadow-lg sm:min-w-[300px] max-w-md">
            <Icon name={t.icon} fill className={t.tone === 'danger' ? 'text-tertiary-container' : 'text-secondary-fixed'} />
            <span className="text-sm font-medium flex-1">{t.message}</span>
            {t.action && (
              <button className="text-sm font-semibold text-primary-container hover:underline px-2 py-1"
                onClick={() => { t.action.onClick(); dismiss(t.id) }}>{t.action.label}</button>
            )}
            <button className="p-1 opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
