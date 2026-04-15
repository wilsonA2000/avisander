// Fallback elegante para recetas sin cover_image_url.
// Gradiente temático + ícono lucide (reemplaza emojis por estética premium).

import { ChefHat, Flame, Utensils } from 'lucide-react'

const DIFFICULTY_STYLE = {
  facil: { bg: 'from-emerald-100 via-green-50 to-lime-100', Icon: ChefHat, iconColor: 'text-emerald-600' },
  media: { bg: 'from-amber-100 via-orange-50 to-red-100', Icon: Flame, iconColor: 'text-orange-600' },
  dificil: { bg: 'from-rose-100 via-red-50 to-orange-100', Icon: Utensils, iconColor: 'text-rose-600' }
}

const DEFAULT = { bg: 'from-amber-100 via-orange-50 to-red-100', Icon: Flame, iconColor: 'text-orange-600' }

function RecipeImage({ recipe, size = 'md', className = '' }) {
  if (recipe?.cover_image_url) {
    return (
      <img
        src={recipe.cover_image_url}
        alt={recipe.title}
        loading="lazy"
        className={`w-full h-full object-cover ${className}`}
      />
    )
  }
  const style = DIFFICULTY_STYLE[recipe?.difficulty] || DEFAULT
  const iconPx = size === 'sm' ? 56 : 96
  const { Icon } = style
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${style.bg} ${className}`}
      aria-label={recipe?.title || 'Receta'}
    >
      <Icon size={iconPx} className={`${style.iconColor} opacity-70 drop-shadow-sm`} strokeWidth={1.4} />
    </div>
  )
}

export default RecipeImage
