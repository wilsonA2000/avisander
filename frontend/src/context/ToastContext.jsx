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

// Separa "Título\nDescripción" si viene con salto de línea.
function splitMessage(msg) {
  if (typeof msg !== 'string') return { title: String(msg ?? ''), description: null }
  const parts = msg.split('\n')
  if (parts.length > 1) return { title: parts[0], description: parts.slice(1).join('\n') }
  return { title: msg, description: null }
}

function Toast({ id, message, type, duration, action, onClose }) {
  const style = STYLE[type] || STYLE.info
  const { Icon } = style
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const { title, description } = splitMessage(message)

  const close = () => {
    setLeaving(true)
    setTimeout(() => onClose(id), 280)
  }

  useEffect(() => {
    if (duration <= 0 || paused) return
    const t = setTimeout(close, duration)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, paused])

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: `
          0 10px 40px -10px ${style.accentColor}55,
          0 4px 20px -2px rgba(0,0,0,0.08),
          0 0 0 1px rgba(0,0,0,0.04)
        `
      }}
    >
      {/* Acento superior: gradient del color del tipo */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${style.accentColor} 20%, ${style.accentColor} 80%, transparent 100%)`
        }}
      />

      <div className="flex items-start gap-3 p-4 pr-3">
        {/* Ícono con halo pulsante */}
        <div className="flex-shrink-0 relative">
          <div
            className="absolute inset-0 rounded-full animate-toast-halo"
            style={{ backgroundColor: style.haloBg }}
          />
          <div
            className="relative w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${style.haloBg} 0%, ${style.haloBg.replace('0.15', '0.25').replace('0.12', '0.22').replace('0.2', '0.3')} 100%)`,
              boxShadow: `inset 0 0 0 1px ${style.accentColor}30`
            }}
          >
            <Icon size={22} strokeWidth={2.5} style={{ color: style.iconColor }} />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[15px] text-charcoal font-semibold leading-snug whitespace-pre-line">
            {title}
          </p>
          {description && (
            <p className="text-[13px] text-gray-600 leading-snug mt-0.5 whitespace-pre-line">
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={() => { action.onClick?.(); close() }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
              style={{ color: style.accentColor }}
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={close}
          aria-label="Cerrar notificación"
          className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-gray-400 hover:text-charcoal hover:bg-black/5 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Barra de progreso con shimmer */}
      {duration > 0 && (
        <div className="h-1 w-full overflow-hidden relative" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
          <div
            className="h-full origin-left absolute inset-y-0 left-0"
            style={{
              background: `linear-gradient(90deg, ${style.progressColor} 0%, ${style.progressColor}cc 50%, ${style.progressColor} 100%)`,
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running'
            }}
          />
          <div
            className="absolute inset-y-0 animate-toast-shimmer w-20"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
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
    (message, { type = 'info', duration = 4000, action } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type, duration, action }])
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
