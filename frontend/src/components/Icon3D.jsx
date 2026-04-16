// Icon3D — wrapper central para iconos 3D clay de toda la tienda pública.
//
// - Busca el PNG en /media/iconos/3d/<name>.png
// - Si el PNG no existe, usa automáticamente el icono lucide equivalente
// - Soporta tamaños, variantes visuales y animación hover
//
// Uso:
//   <Icon3D name="shopping-cart" size="md" />
//   <Icon3D name="fire" size="lg" variant="card" />
//   <Icon3D name="res" size="sm" variant="circle" />
//
// Props:
//   - name (string) — slug del icono (ver iconMap.js)
//   - size (xs|sm|md|lg|xl|2xl) — tamaño del icono, default "md"
//   - variant (bare|card|pill|circle) — contenedor visual
//   - className — clases extra al wrapper
//   - alt — texto alternativo accesible
//   - animate — si true, el icono tiene efecto hover (scale + rotate sutil)

import { useState } from 'react'
import { resolveIcon, ICON_SIZES } from '../lib/iconMap'

function Icon3D({
  name,
  size = 'md',
  variant = 'bare',
  className = '',
  alt = '',
  animate = false,
  strokeWidth = 2
}) {
  const [pngFailed, setPngFailed] = useState(false)
  const entry = resolveIcon(name)

  if (!entry) {
    console.warn(`[Icon3D] Icono desconocido: "${name}"`)
    return null
  }

  const pixelSize = ICON_SIZES[size] || ICON_SIZES.md
  const { png, fallback: FallbackIcon } = entry

  // Tamaño del wrapper (card/circle/pill son siempre más grandes que el icono)
  const wrapperSizes = {
    xs: { w: 'w-8 h-8', pad: 'p-1' },
    sm: { w: 'w-12 h-12', pad: 'p-1.5' },
    md: { w: 'w-16 h-16', pad: 'p-2' },
    lg: { w: 'w-20 h-20', pad: 'p-2.5' },
    xl: { w: 'w-28 h-28', pad: 'p-3' },
    '2xl': { w: 'w-36 h-36', pad: 'p-4' }
  }
  const wrap = wrapperSizes[size] || wrapperSizes.md

  const hoverFx = animate
    ? 'transition-transform duration-300 hover:scale-110 hover:-rotate-3'
    : ''

  const iconContent = !pngFailed ? (
    <img
      src={png}
      alt={alt || name}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
      decoding="async"
      className={`object-contain ${hoverFx}`}
      style={{ width: pixelSize, height: pixelSize }}
      onError={() => setPngFailed(true)}
    />
  ) : (
    <FallbackIcon
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={`text-charcoal ${hoverFx}`}
      aria-label={alt || name}
    />
  )

  // BARE (default): solo el icono, sin fondo
  if (variant === 'bare') {
    return <span className={`inline-flex items-center justify-center ${className}`}>{iconContent}</span>
  }

  // CARD: halo cálido naranja suave detrás, para trust signals y usos culinarios
  if (variant === 'card') {
    return (
      <div
        className={`${wrap.w} ${wrap.pad} rounded-2xl relative overflow-hidden
                    bg-gradient-to-br from-orange-50 to-amber-50
                    border border-orange-100/60
                    shadow-[0_4px_20px_-8px_rgba(245,130,32,0.18)]
                    flex items-center justify-center group ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-radial from-orange-200/30 to-transparent opacity-50" aria-hidden="true"/>
        <div className="relative z-10 flex items-center justify-center">
          {iconContent}
        </div>
      </div>
    )
  }

  // PILL: inline chip tipo "[icon] Label"
  if (variant === 'pill') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 ${className}`}>
        {iconContent}
      </span>
    )
  }

  // CIRCLE: redondo total, para categorías y avatares
  if (variant === 'circle') {
    return (
      <div
        className={`${wrap.w} ${wrap.pad} rounded-full relative overflow-hidden
                    bg-gradient-to-br from-orange-50 to-rose-50
                    shadow-[0_4px_16px_-6px_rgba(245,130,32,0.2)]
                    flex items-center justify-center ${className}`}
      >
        {iconContent}
      </div>
    )
  }

  return <span className={`inline-flex items-center justify-center ${className}`}>{iconContent}</span>
}

export default Icon3D
