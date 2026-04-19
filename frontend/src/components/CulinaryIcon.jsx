import {
  Flame,
  Utensils,
  ChefHat,
  Microwave,
  Droplets,
  Wind,
  CookingPot,
  Pizza,
  ThermometerSun
} from 'lucide-react'

export const CULINARY_USES = {
  asar: {
    label: 'Asar',
    description: 'Al horno o a las brasas, sellando jugos',
    Icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    hoverBg: 'group-hover:bg-orange-100',
    anim: 'culinary-flicker'
  },
  parrilla: {
    label: 'Parrilla',
    description: 'Directo a la brasa con marca de parrilla',
    Icon: ThermometerSun,
    color: 'text-red-600',
    bg: 'bg-red-50',
    hoverBg: 'group-hover:bg-red-100',
    anim: 'culinary-pulse'
  },
  freir: {
    label: 'Freír',
    description: 'En sartén con aceite caliente',
    Icon: Utensils,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    hoverBg: 'group-hover:bg-amber-100',
    anim: 'culinary-shake'
  },
  sofreir: {
    label: 'Sofreír',
    description: 'A fuego medio con poco aceite',
    Icon: Utensils,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    hoverBg: 'group-hover:bg-yellow-100',
    anim: 'culinary-shake'
  },
  hornear: {
    label: 'Hornear',
    description: 'Cocción lenta y uniforme en horno',
    Icon: Pizza,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    hoverBg: 'group-hover:bg-orange-100',
    anim: 'culinary-pulse'
  },
  estofar: {
    label: 'Estofar',
    description: 'Cocción lenta en salsa o caldo',
    Icon: CookingPot,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    hoverBg: 'group-hover:bg-rose-100',
    anim: 'culinary-bubble'
  },
  guisar: {
    label: 'Guisar',
    description: 'En olla con hogao y especias',
    Icon: CookingPot,
    color: 'text-red-700',
    bg: 'bg-red-50',
    hoverBg: 'group-hover:bg-red-100',
    anim: 'culinary-bubble'
  },
  sudar: {
    label: 'Sudar',
    description: 'A fuego bajo tapado en su propio jugo',
    Icon: Droplets,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    hoverBg: 'group-hover:bg-sky-100',
    anim: 'culinary-steam'
  },
  ahumar: {
    label: 'Ahumar',
    description: 'Cocción lenta con humo aromático',
    Icon: Wind,
    color: 'text-stone-600',
    bg: 'bg-stone-50',
    hoverBg: 'group-hover:bg-stone-100',
    anim: 'culinary-steam'
  },
  cocinar: {
    label: 'Cocinar',
    description: 'Hervido o preparación estándar',
    Icon: ChefHat,
    color: 'text-primary',
    bg: 'bg-orange-50',
    hoverBg: 'group-hover:bg-orange-100',
    anim: 'culinary-bounce'
  },
  microondas: {
    label: 'Microondas',
    description: 'Calentar rápidamente',
    Icon: Microwave,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    hoverBg: 'group-hover:bg-slate-100',
    anim: 'culinary-pulse'
  }
}

function CulinaryIcon({ slug, variant = 'card', size = 'md', className = '' }) {
  const use = CULINARY_USES[slug]
  if (!use) return null
  const { Icon, color, bg, hoverBg, label, description, anim } = use

  const sizeMap = {
    sm: { wrap: 'w-10 h-10', icon: 18, text: 'text-[10px]' },
    md: { wrap: 'w-12 h-12', icon: 22, text: 'text-xs' },
    lg: { wrap: 'w-16 h-16', icon: 28, text: 'text-sm' }
  }
  const s = sizeMap[size] || sizeMap.md

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color} ${className}`}>
        <Icon size={14} />
        {label}
      </span>
    )
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bg}
                    border border-gray-200/60 shadow-sm text-xs font-semibold text-charcoal
                    ${className}`}
      >
        <Icon size={14} strokeWidth={2.5} className={color} />
        {label}
      </span>
    )
  }

  return (
    <div className={`group flex flex-col items-center gap-2 cursor-default ${className}`} title={description}>
      <div
        className={`${s.wrap} rounded-xl ${bg} ${hoverBg}
                    border border-gray-200/70
                    flex items-center justify-center
                    transition-all duration-300
                    group-hover:shadow-md group-hover:-translate-y-1`}
      >
        <span className={`culinary-icon ${anim} ${color}`}>
          <Icon size={s.icon} strokeWidth={1.8} />
        </span>
      </div>
      <span className={`${s.text} font-semibold text-gray-700 group-hover:text-gray-900 transition-colors`}>
        {label}
      </span>
    </div>
  )
}

export default CulinaryIcon
export const CULINARY_USE_SLUGS = Object.keys(CULINARY_USES)
