import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

function computeParts(endsAtMs) {
  const diff = endsAtMs - Date.now()
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { expired: false, days, hours, minutes, seconds, totalMs: diff }
}

function Chunk({ value, label }) {
  const str = pad(value)
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[1em] min-w-[2.1ch] overflow-hidden font-black text-3xl sm:text-5xl md:text-6xl leading-none tabular-nums text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={str}
            initial={{ y: '60%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-60%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {str}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">
        {label}
      </span>
    </div>
  )
}

function CountdownBig({ endsAt, onExpire, className = '', compact = false }) {
  const endsAtMs = useMemo(() => (endsAt ? new Date(endsAt).getTime() : null), [endsAt])
  const [parts, setParts] = useState(() =>
    endsAtMs ? computeParts(endsAtMs) : { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  )

  useEffect(() => {
    if (!endsAtMs) return
    const tick = () => {
      const next = computeParts(endsAtMs)
      setParts(next)
      if (next.expired && onExpire) onExpire()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAtMs, onExpire])

  if (!endsAtMs) return null
  if (parts.expired) {
    return (
      <div className={`text-sm font-semibold text-red-200 ${className}`}>Oferta terminada</div>
    )
  }

  const showDays = parts.days > 0
  const sep = (
    <span className="text-white/40 text-2xl sm:text-4xl md:text-5xl font-black px-1 sm:px-2 pb-4 sm:pb-6 select-none">
      :
    </span>
  )

  return (
    <div
      className={`inline-flex items-end gap-1 sm:gap-2 ${compact ? 'scale-90' : ''} ${className}`}
    >
      {showDays && (
        <>
          <Chunk value={parts.days} label={parts.days === 1 ? 'día' : 'días'} />
          {sep}
        </>
      )}
      <Chunk value={parts.hours} label="hr" />
      {sep}
      <Chunk value={parts.minutes} label="min" />
      {sep}
      <Chunk value={parts.seconds} label="seg" />
    </div>
  )
}

export default CountdownBig
