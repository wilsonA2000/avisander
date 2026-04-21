import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, Radio, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react'
import { fmtCOP } from '../../lib/format'

const TYPE_META = {
  'order.created': {
    label: 'Nueva orden',
    icon: ShoppingBag,
    accent: 'bg-indigo-50 text-indigo-600 ring-indigo-200'
  },
  'payment.confirmed': {
    label: 'Pago confirmado',
    icon: CheckCircle2,
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-200'
  },
  'stock.low': {
    label: 'Stock bajo',
    icon: AlertTriangle,
    accent: 'bg-amber-50 text-amber-600 ring-amber-200'
  }
}

// Un único AudioContext reutilizado — Chrome bloquea creaciones repetidas sin gesto.
// Se inicializa la primera vez dentro de un click (handler del toggle), y luego
// queda "desbloqueado" para beeps automáticos en segundo plano.
function getOrCreateAudioCtx(ref) {
  if (ref.current) return ref.current
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  ref.current = new Ctx()
  return ref.current
}

// Chrome suspende el AudioContext cuando la pestaña pasa a segundo plano o tras idle.
// Si al llegar un evento el ctx está suspended y no esperamos a resume(), currentTime
// queda desactualizado y los oscilladores se programan en un tiempo pasado → silencio.
async function playDing(ctx) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const now = ctx.currentTime
    const play = (freq, startOffset, duration = 0.3, vol = 0.22) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      const start = now + startOffset
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(vol, start + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      o.start(start)
      o.stop(start + duration + 0.02)
    }
    play(987.77, 0)       // B5
    play(783.99, 0.14)    // G5
  } catch (_err) {}
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}

export default function LiveFeed({ events, connected, soundEnabled, onToggleSound }) {
  const lastIdRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    const last = events[0]
    if (!last) return
    const key = `${last.type}:${last.ts}`
    if (lastIdRef.current === key) return
    lastIdRef.current = key
    if (soundEnabled && audioCtxRef.current) playDing(audioCtxRef.current)
  }, [events, soundEnabled])

  // El toggle crea/desbloquea el AudioContext dentro del gesto del usuario
  // (único momento en que Chrome lo permite) y toca un ding de confirmación
  // al activarlo, para que el admin escuche cómo suena antes de recibir eventos.
  function handleToggle() {
    const willEnable = !soundEnabled
    if (willEnable) {
      const ctx = getOrCreateAudioCtx(audioCtxRef)
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
      if (ctx) playDing(ctx)
    }
    onToggleSound?.()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connected ? 'bg-emerald-400 animate-ping' : 'bg-gray-300'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                connected ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
          </span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Radio size={16} className="text-gray-400" />
            {connected ? 'En vivo' : 'Reconectando…'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {soundEnabled ? (
            <Volume2 size={16} className="text-emerald-500" />
          ) : (
            <VolumeX size={16} className="text-gray-400" />
          )}
          <span className="text-xs font-medium text-gray-600 select-none">Sonido</span>
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            onClick={handleToggle}
            title={soundEnabled ? 'Silenciar notificaciones' : 'Activar sonido'}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              soundEnabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span className="sr-only">Activar sonido</span>
            <span
              className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {events.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            Aún no hay eventos. Cuando entre una orden o se confirme un pago aparecerá aquí en tiempo real.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {events.map((evt, idx) => {
                const meta = TYPE_META[evt.type] || {
                  label: evt.type,
                  icon: Radio,
                  accent: 'bg-gray-50 text-gray-600 ring-gray-200'
                }
                const Icon = meta.icon
                const p = evt.payload || {}
                return (
                  <motion.li
                    key={`${evt.type}:${evt.ts}:${idx}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-3 flex items-start gap-3"
                  >
                    <div className={`rounded-lg ring-1 p-2 ${meta.accent}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{meta.label}</p>
                        <span className="text-[11px] text-gray-400 shrink-0">{formatTime(evt.ts)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {p.id ? `#${p.id} · ` : ''}
                        {p.customer_name ? `${p.customer_name} · ` : ''}
                        {typeof p.total === 'number' ? fmtCOP(p.total) : ''}
                        {p.items_count ? ` · ${p.items_count} ítems` : ''}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
