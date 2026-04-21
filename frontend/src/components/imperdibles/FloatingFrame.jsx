import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// Marco flotante con efecto tilt que responde a:
//  - Mouse (desktop): mousemove sobre el elemento
//  - Device orientation (mobile real): giroscopio si el usuario lo autoriza
// En ambos casos además hay un float-loop continuo que da la sensación de
// que la imagen flota sobre un foco/sombra radial.
function FloatingFrame({
  src,
  alt = '',
  children,
  className = '',
  maxTilt = 14,
  floatDistance = 10,
  floatDuration = 4
}) {
  const wrapRef = useRef(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const springX = useSpring(rx, { stiffness: 80, damping: 14 })
  const springY = useSpring(ry, { stiffness: 80, damping: 14 })
  const rotateX = useTransform(springY, (v) => v * maxTilt)
  const rotateY = useTransform(springX, (v) => v * -maxTilt)
  const shadowX = useTransform(springX, (v) => v * 24)
  const shadowY = useTransform(springY, (v) => v * 24 + 30)

  const [orientationEnabled, setOrientationEnabled] = useState(false)
  const [needsPermission, setNeedsPermission] = useState(false)

  useEffect(() => {
    // iOS 13+ requiere que el usuario acepte un permiso explícito tras un gesto.
    // En Android el evento llega directo.
    const hasAPI = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
    if (!hasAPI) return
    const needsPerm = typeof DeviceOrientationEvent.requestPermission === 'function'
    setNeedsPermission(needsPerm)
    if (!needsPerm) setOrientationEnabled(true)
  }, [])

  useEffect(() => {
    if (!orientationEnabled) return
    function onOrient(e) {
      const beta = e.beta ?? 0    // -180..180 (adelante/atrás)
      const gamma = e.gamma ?? 0  // -90..90 (izq/der)
      rx.set(Math.max(-1, Math.min(1, gamma / 45)))
      ry.set(Math.max(-1, Math.min(1, (beta - 30) / 45)))
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [orientationEnabled, rx, ry])

  async function requestOrientation() {
    try {
      const res = await DeviceOrientationEvent.requestPermission()
      if (res === 'granted') setOrientationEnabled(true)
    } catch {
      // Sin permiso — seguimos con el float-loop solo.
    }
  }

  function onMove(e) {
    if (orientationEnabled) return // priorizamos giroscopio si está activo
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    rx.set(Math.max(-1, Math.min(1, x)))
    ry.set(Math.max(-1, Math.min(1, y)))
  }

  function onLeave() {
    rx.set(0)
    ry.set(0)
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className}`}
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        animate={{ y: [0, -floatDistance, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <motion.div
          aria-hidden
          className="absolute inset-x-4 -bottom-6 h-24 rounded-[48px] blur-2xl opacity-60 pointer-events-none"
          style={{
            x: shadowX,
            y: shadowY,
            background:
              'radial-gradient(ellipse at center, rgba(234,88,12,0.55), transparent 70%)'
          }}
        />
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="relative w-full h-full object-cover rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/20"
          />
        ) : null}
        {children}
      </motion.div>

      {needsPermission && !orientationEnabled && (
        <button
          type="button"
          onClick={requestOrientation}
          className="absolute bottom-2 right-2 text-[10px] uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded-full text-gray-700 shadow"
        >
          Activar 3D
        </button>
      )}
    </div>
  )
}

export default FloatingFrame
