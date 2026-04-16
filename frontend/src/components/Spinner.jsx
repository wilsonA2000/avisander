// Spinner — loader premium. Si existe el Lottie, lo usa; si no, cae a un
// spinner elegante con CSS puro (sin depender de lottie-web si el asset falta).
//
// Uso:
//   <Spinner />
//   <Spinner size="lg" />
//   <Spinner label="Cargando tu pedido..." />

import LottieIcon from './LottieIcon'
import { Loader2 } from 'lucide-react'
import { ICON_SIZES } from '../lib/iconMap'

function Spinner({ size = 'md', label, className = '' }) {
  const pixelSize = ICON_SIZES[size] || ICON_SIZES.md
  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`} role="status" aria-live="polite">
      <LottieIcon
        name="loading"
        size={size}
        loop
        autoplay
        fallbackIcon="loader"
        ariaLabel={label || 'Cargando'}
      />
      {label && (
        <span className="text-sm text-gray-600 animate-pulse">{label}</span>
      )}
    </div>
  )
}

// Spinner inline minimalista (para dentro de botones, sin texto)
export function SpinnerDot({ size = 16, className = 'text-white' }) {
  return (
    <Loader2
      size={size}
      className={`animate-spin ${className}`}
      aria-label="Cargando"
    />
  )
}

export default Spinner
