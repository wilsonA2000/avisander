// Toast premium con estética institucional Avisander:
// - Naranja #F58220 (success/info) · Rojo #D32F2F (error) · Amarillo #FFD800 (warn)
// - Fondo charcoal con acento cálido, borde vertical del color correspondiente,
//   ícono con halo circular, barra de progreso y efecto slide editorial.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let idCounter = 0

// Estilos institucionales. Los colores NO usan Tailwind `bg-*` customs para que
// no dependan del JIT purge y se rendericen siempre (inline styles).
const STYLE = {
  success: {
    Icon: CheckCircle2,
    accentColor: '#F58220',   // Naranja Avisander
    haloBg: 'rgba(245, 130, 32, 0.15)',
    iconColor: '#F58220',
    progressColor: '#F58220',
    label: 'success'
  },
  error: {
    Icon: XCircle,
    accentColor: '#D32F2F',   // Rojo carnicero
    haloBg: 'rgba(211, 47, 47, 0.15)',
    iconColor: '#D32F2F',
    progressColor: '#D32F2F',
    label: 'error'
  },
  warn: {
    Icon: AlertTriangle,
    accentColor: '#E5C200',   // Amarillo gold-dark (mejor contraste sobre blanco)
    haloBg: 'rgba(255, 216, 0, 0.2)',
    iconColor: '#B89800',
    progressColor: '#FFD800',
    label: 'warn'
  },
  info: {
    Icon: Info,
    accentColor: '#0A0A0A',   // Negro institucional
    haloBg: 'rgba(10, 10, 10, 0.12)',
    iconColor: '#1A1A1A',
    progressColor: '#F58220',
    label: 'info'
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
      className={`pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: style.accentColor,
        borderLeftStyle: 'solid'
      }}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: style.haloBg }}
        >
          <Icon size={20} strokeWidth={2.5} style={{ color: style.iconColor }} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-sm text-charcoal font-medium leading-snug whitespace-pre-line">
            {message}
          </p>
        </div>
        <button
          onClick={close}
          aria-label="Cerrar notificación"
          className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-gray-400 hover:text-charcoal hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {duration > 0 && (
        <div className="h-1 w-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-full origin-left"
            style={{
              backgroundColor: style.progressColor,
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
