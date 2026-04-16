// Ícono 3D premium para usos culinarios. Usa PNG renderizado 3D (Fluent Emoji).
// Fallback a lucide si el archivo no está disponible.

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

// Cada uso tiene label + gradiente de glow sutil coherente con la acción.
// Los gradientes ahora son más saturados y definen el halo alrededor del icono 3D.
export const CULINARY_USES = {
  asar: {
    label: 'Asar',
    description: 'Al horno o a las brasas, sellando jugos',
    Icon: Flame,
    glow: 'from-orange-500/25 to-red-500/10',
    iconColor: 'text-orange-700',
    emoji: '🔥'
  },
  parrilla: {
    label: 'Parrilla',
    description: 'Directo a la brasa con marca de parrilla',
    Icon: Flame,
    glow: 'from-red-500/25 to-amber-500/10',
    iconColor: 'text-red-700',
    emoji: '🔥'
  },
  freir: {
    label: 'Freír',
    description: 'En sartén con aceite caliente',
    Icon: CookingPot,
    glow: 'from-amber-400/25 to-yellow-400/10',
    iconColor: 'text-amber-700',
    emoji: '🍳'
  },
  sofreir: {
    label: 'Sofreír',
    description: 'A fuego medio con poco aceite',
    Icon: Utensils,
    glow: 'from-lime-400/25 to-amber-400/10',
    iconColor: 'text-amber-700',
    emoji: '🥘'
  },
  hornear: {
    label: 'Hornear',
    description: 'Cocción lenta y uniforme en horno',
    Icon: Pizza,
    glow: 'from-amber-500/25 to-orange-500/10',
    iconColor: 'text-orange-700',
    emoji: '🥧'
  },
  estofar: {
    label: 'Estofar',
    description: 'Cocción lenta en salsa o caldo',
    Icon: CookingPot,
    glow: 'from-rose-500/25 to-red-500/10',
    iconColor: 'text-rose-700',
    emoji: '🍲'
  },
  guisar: {
    label: 'Guisar',
    description: 'En olla con hogao y especias',
    Icon: CookingPot,
    glow: 'from-orange-500/25 to-rose-500/10',
    iconColor: 'text-rose-700',
    emoji: '🍲'
  },
  sudar: {
    label: 'Sudar',
    description: 'A fuego bajo tapado en su propio jugo',
    Icon: Droplets,
    glow: 'from-sky-500/25 to-cyan-500/10',
    iconColor: 'text-sky-700',
    emoji: '💦'
  },
  ahumar: {
    label: 'Ahumar',
    description: 'Cocción lenta con humo aromático',
    Icon: Sparkles,
    glow: 'from-stone-500/25 to-amber-500/10',
    iconColor: 'text-stone-700',
    emoji: '🪵'
  },
  cocinar: {
    label: 'Cocinar',
    description: 'Hervido o preparación estándar',
    Icon: ChefHat,
    glow: 'from-primary/25 to-amber-400/10',
    iconColor: 'text-primary',
    emoji: '👨\u200d🍳'
  },
  microondas: {
    label: 'Microondas',
    description: 'Calentar rápidamente',
    Icon: Microwave,
    glow: 'from-cyan-500/25 to-blue-500/10',
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
  const { Icon, glow, iconColor, label } = use

  const sizeMap = {
    sm: { wrap: 'w-14 h-14', img: 'w-10 h-10', icon: 18 },
    md: { wrap: 'w-20 h-20', img: 'w-16 h-16', icon: 22 },
    lg: { wrap: 'w-24 h-24', img: 'w-20 h-20', icon: 28 }
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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br ${glow}
                    border border-gray-200/60 shadow-sm text-xs font-semibold text-charcoal
                    ${className}`}
      >
        <Icon size={14} strokeWidth={2.5} className={iconColor} />
        {label}
      </span>
    )
  }

  // card (default): PNG 3D premium (Fluent Emoji) sobre fondo con glow suave.
  const pngSrc = `/media/iconos/usos/${slug}.png`
  return (
    <div className={`flex flex-col items-center gap-2 group ${className}`}>
      <div
        className={`${s.wrap} rounded-2xl relative overflow-hidden
                    bg-gradient-to-br ${glow}
                    border border-gray-200/70
                    shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)]
                    transition-all duration-300
                    group-hover:shadow-[0_8px_30px_-6px_rgba(245,130,32,0.25)]
                    group-hover:scale-105 group-hover:-translate-y-0.5
                    flex items-center justify-center`}
        aria-label={label}
      >
        {/* Halo radial sutil */}
        <div className={`absolute inset-0 bg-gradient-radial ${glow} opacity-50 blur-md`} aria-hidden="true"/>
        <img
          src={pngSrc}
          alt={label}
          loading="lazy"
          className={`${s.img} relative z-10 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)]`}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement?.querySelector('[data-fallback]')?.classList.remove('hidden')
          }}
        />
        <Icon
          size={s.icon}
          className={`${iconColor} hidden relative z-10`}
          strokeWidth={2.3}
          data-fallback="1"
        />
      </div>
      <span className="text-xs font-semibold text-charcoal tracking-tight">{label}</span>
    </div>
  )
}

export default CulinaryIcon
export const CULINARY_USE_SLUGS = Object.keys(CULINARY_USES)
