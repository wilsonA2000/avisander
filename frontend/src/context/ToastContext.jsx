// Toast premium con íconos, gradiente sutil, barra de progreso animada,
// animación slide + fade, dismiss manual y mobile-first.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let idCounter = 0

const STYLE = {
  success: {
    Icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    accent: 'border-l-emerald-500'
  },
  error: {
    Icon: XCircle,
    iconBg: 'bg-rose-100 text-rose-600',
    bar: 'bg-rose-500',
    ring: 'ring-rose-500/20',
    accent: 'border-l-rose-500'
  },
  warn: {
    Icon: AlertTriangle,
    iconBg: 'bg-amber-100 text-amber-600',
    bar: 'bg-amber-500',
    ring: 'ring-amber-500/20',
    accent: 'border-l-amber-500'
  },
  info: {
    Icon: Info,
    iconBg: 'bg-sky-100 text-sky-600',
    bar: 'bg-sky-500',
    ring: 'ring-sky-500/20',
    accent: 'border-l-sky-500'
  }
}

function Toast({ id, message, type, duration, onClose }) {
  const style = STYLE[type] || STYLE.info
  const { Icon } = style
  const [leaving, setLeaving] = useState(false)

  const close = () => {
    setLeaving(true)
    setTimeout(() => onClose(id), 220)
  }

  // Auto-cierre
  useEffect(() => {
    if (duration <= 0) return
    const t = setTimeout(close, duration)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/10
        ring-1 ${style.ring} border-l-4 ${style.accent}
        ${leaving ? 'animate-toast-out' : 'animate-toast-in'}
      `}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.iconBg}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-sm text-gray-800 font-medium leading-snug whitespace-pre-line">
            {message}
          </p>
        </div>
        <button
          onClick={close}
          aria-label="Cerrar notificación"
          className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {duration > 0 && (
        <div className="h-[3px] w-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full ${style.bar} origin-left`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, { type = 'info', duration = 4000 } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type, duration }])
      return id
    },
    []
  )

  const toast = {
    success: (m, o) => push(m, { ...o, type: 'success' }),
    error: (m, o) => push(m, { ...o, type: 'error', duration: o?.duration ?? 5500 }),
    info: (m, o) => push(m, { ...o, type: 'info' }),
    warn: (m, o) => push(m, { ...o, type: 'warn' })
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Contenedor: posición fluida bottom en mobile, top-right en desktop */}
      <div
        className="fixed z-[9999] flex flex-col gap-3 pointer-events-none
                   left-4 right-4 bottom-4
                   sm:left-auto sm:bottom-auto sm:top-6 sm:right-6 sm:w-96 sm:max-w-[calc(100vw-3rem)]"
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
