// Fallback elegante para recetas sin cover_image_url.
// Gradiente temático + emoji grande evoca la experiencia gastronómica.

const DIFFICULTY_STYLE = {
  facil: { bg: 'from-emerald-100 via-green-50 to-lime-100', emoji: '🍳' },
  media: { bg: 'from-amber-100 via-orange-50 to-red-100', emoji: '🔥' },
  dificil: { bg: 'from-rose-100 via-red-50 to-orange-100', emoji: '🍽️' }
}

const DEFAULT = { bg: 'from-amber-100 via-orange-50 to-red-100', emoji: '🔥' }

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
  const emojiSize = size === 'sm' ? 'text-5xl' : 'text-7xl'
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${style.bg} ${className}`}
      aria-label={recipe?.title || 'Receta'}
    >
      <span className={`${emojiSize} opacity-80 drop-shadow-sm`} role="img" aria-hidden="true">
        {style.emoji}
      </span>
    </div>
  )
}

export default RecipeImage
