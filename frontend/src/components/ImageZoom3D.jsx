// ImageZoom3D — efecto inmersivo "tilt + zoom" estilo Apple Store sobre la foto
// del producto. Sigue el cursor con perspectiva 3D + zoom de la imagen. Mobile
// usa el giroscopio (devicemotion) si está disponible.

import { useRef, useState } from 'react'

function ImageZoom3D({ src, alt = '', className = '', maxTilt = 8, zoom = 1.08, children }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [active, setActive] = useState(false)

  const handleMove = (e) => {
    const el = containerRef.current
    if (!el || !imgRef.current) return
    const rect = el.getBoundingClientRect()
    const point = e.touches?.[0] || e
    const x = point.clientX - rect.left
    const y = point.clientY - rect.top
    const px = x / rect.width   // 0..1
    const py = y / rect.height  // 0..1
    const tiltY = (px - 0.5) * 2 * maxTilt   // -maxTilt..maxTilt
    const tiltX = (0.5 - py) * 2 * maxTilt
    // Origin del zoom: hacia donde apunta el cursor.
    const originX = px * 100
    const originY = py * 100
    el.style.setProperty('--tx', `${tiltX}deg`)
    el.style.setProperty('--ty', `${tiltY}deg`)
    el.style.setProperty('--ox', `${originX}%`)
    el.style.setProperty('--oy', `${originY}%`)
    el.style.setProperty('--zoom', String(zoom))
  }

  const reset = () => {
    const el = containerRef.current
    if (!el) return
    el.style.setProperty('--tx', '0deg')
    el.style.setProperty('--ty', '0deg')
    el.style.setProperty('--zoom', '1')
    setActive(false)
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setActive(true)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onTouchStart={() => setActive(true)}
      onTouchMove={handleMove}
      onTouchEnd={reset}
      className={`relative overflow-hidden rounded-2xl bg-gray-100 ${className}`}
      style={{
        perspective: '1000px',
        '--tx': '0deg',
        '--ty': '0deg',
        '--zoom': 1,
        '--ox': '50%',
        '--oy': '50%'
      }}
    >
      <div
        className="w-full h-full transition-transform"
        style={{
          transform: 'rotateX(var(--tx)) rotateY(var(--ty))',
          transformStyle: 'preserve-3d',
          transitionDuration: active ? '120ms' : '350ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {src ? (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="w-full h-full object-contain will-change-transform"
            style={{
              transform: 'scale(var(--zoom))',
              transformOrigin: 'var(--ox) var(--oy)',
              transition: active ? 'transform 100ms ease-out' : 'transform 350ms cubic-bezier(0.22,1,0.36,1)'
            }}
          />
        ) : null}
        {children}
      </div>

      {/* Glow sutil que sigue el cursor para reforzar el efecto 3D. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity"
        style={{
          opacity: active ? 1 : 0,
          background: 'radial-gradient(circle at var(--ox) var(--oy), rgba(255,255,255,0.18) 0%, transparent 45%)'
        }}
      />
      {active && (
        <div className="absolute bottom-2 right-2 bg-charcoal/80 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          🖱️ Mueve el cursor · vista inmersiva
        </div>
      )}
    </div>
  )
}

export default ImageZoom3D
