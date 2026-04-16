// LottieIcon — reproduce animaciones Lottie premium para loading, feedback,
// empty states, trust signals animados y hero.
//
// Usa @lottiefiles/react-lottie-player (acepta URL a .json directamente).
// Si la animación no está disponible en /media/lotties/<name>.json, cae a un
// fallback estático (Icon3D o componente lucide).
//
// Uso:
//   <LottieIcon name="loading" size="md" loop autoplay />
//   <LottieIcon name="success" size="sm" autoplay />
//   <LottieIcon name="empty-cart" size="xl" loop />
//
// Props:
//   - name (string)        — slug del Lottie (ver LOTTIE_MAP en iconMap.js)
//   - size (xs|sm|md|lg|xl|2xl) — tamaño contenedor
//   - loop (bool)          — default true
//   - autoplay (bool)      — default true
//   - speed (number)       — velocidad, default 1
//   - className
//   - fallbackIcon (string) — nombre de Icon3D a mostrar si no hay Lottie

import { useState, useEffect, Suspense, lazy } from 'react'
import { LOTTIE_MAP, ICON_SIZES } from '../lib/iconMap'
import Icon3D from './Icon3D'

// Lazy-load del player — evita agregar peso al initial bundle cuando
// la página no usa animaciones Lottie.
const Player = lazy(() =>
  import('@lottiefiles/react-lottie-player').then(mod => ({ default: mod.Player }))
)

function LottieIcon({
  name,
  size = 'md',
  loop = true,
  autoplay = true,
  speed = 1,
  className = '',
  fallbackIcon,
  ariaLabel
}) {
  const [available, setAvailable] = useState(null) // null = desconocido, true = existe, false = 404
  const pixelSize = ICON_SIZES[size] || ICON_SIZES.md
  const src = LOTTIE_MAP[name]

  useEffect(() => {
    if (!src) { setAvailable(false); return }
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then(r => { if (!cancelled) setAvailable(r.ok) })
      .catch(() => { if (!cancelled) setAvailable(false) })
    return () => { cancelled = true }
  }, [src])

  if (available === null || available === false) {
    return (
      <Icon3D
        name={fallbackIcon || name}
        size={size}
        className={className}
        alt={ariaLabel || name}
      />
    )
  }

  return (
    <Suspense
      fallback={
        <Icon3D
          name={fallbackIcon || name}
          size={size}
          className={className}
          alt={ariaLabel || name}
        />
      }
    >
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        aria-label={ariaLabel || name}
        role="img"
      >
        <Player
          src={src}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
          style={{ width: '100%', height: '100%' }}
          keepLastFrame={!loop}
        />
      </div>
    </Suspense>
  )
}

export default LottieIcon
