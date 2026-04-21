import { useEffect, useRef, useState } from 'react'
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

// Beep sintetizado con Web Audio; evita tener que cargar un .mp3.
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.start()
    o.stop(ctx.currentTime + 0.36)
    setTimeout(() => ctx.close(), 500)
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

  useEffect(() => {
    const last = events[0]
    if (!last) return
    const key = `${last.type}:${last.ts}`
    if (lastIdRef.current === key) return
    lastIdRef.current = key
    if (soundEnabled) playBeep()
  }, [events, soundEnabled])

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
        <button
          type="button"
          onClick={onToggleSound}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          title={soundEnabled ? 'Silenciar notificaciones' : 'Activar sonido'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {soundEnabled ? 'Sonido activo' : 'Sonido apagado'}
        </button>
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
