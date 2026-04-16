// Ícono 3D glassmorphic para usos culinarios. Mismo patrón visual que CategoryIcon.
// Si el PNG 3D existe en /media/iconos/usos/<slug>.png lo usamos; si no,
// fallback a ícono lucide dentro de una píldora con gradiente temático.

import {
  Flame,
  Utensils,
  ChefHat,
  Microwave,
  Droplets,
  Sparkles,
  CookingPot,
  Salad,
  Pizza
} from 'lucide-react'

// Definición de los usos soportados. Cada uno tiene label, ícono lucide de
// fallback, y paleta de gradiente coherente con la acción.
export const CULINARY_USES = {
  asar: {
    label: 'Asar',
    description: 'Al horno o a las brasas, sellando jugos',
    Icon: Flame,
    gradient: 'from-orange-300/80 via-amber-200/70 to-red-300/80',
    iconColor: 'text-orange-700',
    emoji: '🔥'
  },
  parrilla: {
    label: 'Parrilla',
    description: 'Directo a la brasa con marca de parrilla',
    Icon: Flame,
    gradient: 'from-red-300/80 via-orange-200/70 to-yellow-300/80',
    iconColor: 'text-red-700',
    emoji: '🔥'
  },
  freir: {
    label: 'Freír',
    description: 'En sartén con aceite caliente',
    Icon: CookingPot,
    gradient: 'from-yellow-300/80 via-amber-200/70 to-orange-300/80',
    iconColor: 'text-amber-700',
    emoji: '🍳'
  },
  sofreir: {
    label: 'Sofreír',
    description: 'A fuego medio con poco aceite',
    Icon: Utensils,
    gradient: 'from-lime-300/80 via-yellow-200/70 to-amber-300/80',
    iconColor: 'text-amber-700',
    emoji: '🥘'
  },
  hornear: {
    label: 'Hornear',
    description: 'Cocción lenta y uniforme en horno',
    Icon: Pizza,
    gradient: 'from-amber-300/80 via-orange-200/70 to-red-300/80',
    iconColor: 'text-orange-700',
    emoji: '🥧'
  },
  estofar: {
    label: 'Estofar',
    description: 'Cocción lenta en salsa o caldo',
    Icon: CookingPot,
    gradient: 'from-red-300/80 via-rose-200/70 to-pink-300/80',
    iconColor: 'text-rose-700',
    emoji: '🍲'
  },
  guisar: {
    label: 'Guisar',
    description: 'En olla con hogao y especias',
    Icon: CookingPot,
    gradient: 'from-rose-300/80 via-red-200/70 to-amber-300/80',
    iconColor: 'text-rose-700',
    emoji: '🍲'
  },
  sudar: {
    label: 'Sudar',
    description: 'A fuego bajo tapado en su propio jugo',
    Icon: Droplets,
    gradient: 'from-sky-300/80 via-cyan-200/70 to-teal-300/80',
    iconColor: 'text-sky-700',
    emoji: '💦'
  },
  ahumar: {
    label: 'Ahumar',
    description: 'Cocción lenta con humo aromático',
    Icon: Sparkles,
    gradient: 'from-stone-400/80 via-stone-200/70 to-amber-300/80',
    iconColor: 'text-stone-700',
    emoji: '🪵'
  },
  cocinar: {
    label: 'Cocinar',
    description: 'Hervido o preparación estándar',
    Icon: ChefHat,
    gradient: 'from-primary/30 via-amber-100/60 to-orange-200/70',
    iconColor: 'text-primary',
    emoji: '👨\u200d🍳'
  },
  microondas: {
    label: 'Microondas',
    description: 'Calentar rápidamente',
    Icon: Microwave,
    gradient: 'from-slate-300/80 via-gray-200/70 to-slate-300/80',
    iconColor: 'text-slate-700',
    emoji: '⚡'
  }
}

/**
 * @param {string} slug   Uno de los keys de CULINARY_USES.
 * @param {'card'|'pill'|'inline'} variant
 * @param {'sm'|'md'|'lg'} size
 */
function CulinaryIcon({ slug, variant = 'card', size = 'md', className = '' }) {
  const use = CULINARY_USES[slug]
  if (!use) return null
  const { Icon, gradient, iconColor, label } = use

  const sizeMap = {
    sm: { wrap: 'w-12 h-12', icon: 18 },
    md: { wrap: 'w-16 h-16', icon: 22 },
    lg: { wrap: 'w-20 h-20', icon: 28 }
  }
  const s = sizeMap[size] || sizeMap.md

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${iconColor} ${className}`}>
        <Icon size={14} />
        {label}
      </span>
    )
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br ${gradient}
                    border border-white/40 shadow-sm backdrop-blur-sm text-xs font-semibold ${iconColor}
                    ${className}`}
      >
        <Icon size={14} strokeWidth={2.5} />
        {label}
      </span>
    )
  }

  // card (default): SVG 3D isométrico dentro de un contenedor glassmórfico.
  // Los SVG están en /media/iconos/usos/<slug>.svg. Si no existen, fallback
  // al ícono lucide dentro del mismo contenedor.
  const svgSrc = `/media/iconos/usos/${slug}.svg`
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className={`${s.wrap} rounded-2xl bg-gradient-to-br ${gradient}
                    border border-white/50 shadow-lg backdrop-blur-sm
                    flex items-center justify-center p-2`}
        style={{ boxShadow: '0 6px 20px -4px rgba(245,130,32,0.25), inset 0 1px 0 rgba(255,255,255,0.6)' }}
        aria-label={label}
      >
        <img
          src={svgSrc}
          alt={label}
          className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
          onError={(e) => {
            // Si el SVG aún no existe, reemplazar por ícono lucide.
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement?.querySelector('[data-fallback]')?.classList.remove('hidden')
          }}
        />
        <Icon
          size={s.icon}
          className={`${iconColor} hidden`}
          strokeWidth={2.3}
          data-fallback="1"
        />
      </div>
      <span className="text-xs font-medium text-charcoal">{label}</span>
    </div>
  )
}

export default CulinaryIcon
export const CULINARY_USE_SLUGS = Object.keys(CULINARY_USES)
