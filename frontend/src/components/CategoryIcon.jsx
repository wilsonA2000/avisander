// Ícono 3D de categoría sobre superficie glassmórfica.
// Intenta primero el PNG premium de /media/iconos/3d/ (clay style Iconscout);
// si no está disponible, cae a /media/iconos/categorias/ (Fluent Emoji 3D actuales).
// El fallback es automático vía onError.

// Paleta unificada premium: gradient base crema→ámbar suave (tierra), con un
// "acento" sutil por categoría (ring/sombra). Evita el efecto arcoiris cuando
// muchas categorías aparecen juntas en el MegaMenu.
const BASE_BG = 'from-stone-100 via-amber-50 to-orange-100/70'

const CATEGORY_MAP = {
  'carne de res': { icon: 'res', accent: 'ring-red-900/20 shadow-red-900/10' },
  res: { icon: 'res', accent: 'ring-red-900/20 shadow-red-900/10' },
  cerdo: { icon: 'cerdo', accent: 'ring-rose-800/20 shadow-rose-800/10' },
  'pollo fresco': { icon: 'pollo', accent: 'ring-amber-700/20 shadow-amber-700/10' },
  'pollo marinado': { icon: 'pollo', accent: 'ring-amber-700/20 shadow-amber-700/10' },
  pollo: { icon: 'pollo', accent: 'ring-amber-700/20 shadow-amber-700/10' },
  'visceras pollo': { icon: 'pollo', accent: 'ring-amber-700/20 shadow-amber-700/10' },
  huevos: { icon: 'huevos', accent: 'ring-yellow-700/20 shadow-yellow-700/10' },
  'carnes frias': { icon: 'carnes-frias', accent: 'ring-red-800/20 shadow-red-800/10' },
  embutidos: { icon: 'embutidos', accent: 'ring-red-800/20 shadow-red-800/10' },
  congelado: { icon: 'congelado', accent: 'ring-slate-500/20 shadow-slate-500/10' },
  lacteos: { icon: 'lacteos', accent: 'ring-amber-600/20 shadow-amber-600/10' },
  fruver: { icon: 'fruver', accent: 'ring-emerald-800/20 shadow-emerald-800/10' },
  varios: { icon: 'varios', accent: 'ring-stone-500/20 shadow-stone-500/10' },
  otros: { icon: 'varios', accent: 'ring-stone-500/20 shadow-stone-500/10' }
}

function pick(categoryName) {
  const key = String(categoryName || '').toLowerCase().trim()
  return CATEGORY_MAP[key] || CATEGORY_MAP.varios
}

/**
 * variant:
 *  - 'card'    → contenedor cuadrado grande para placeholders de producto
 *  - 'circle'  → redondo, para la fila de categorías del home
 *  - 'inline'  → pequeño sin marco, para uso junto a texto
 */
// Helper: intenta primero /3d/, y al fallar hace swap a /categorias/
function onPngError(e, fallbackSrc) {
  const img = e.currentTarget
  if (img.src !== fallbackSrc && !img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = '1'
    img.src = fallbackSrc
  }
}

function CategoryIcon({ category, variant = 'card', size = 'md', className = '' }) {
  const { icon, accent } = pick(category)
  const src = `/media/iconos/3d/${icon}.png`
  const fallbackSrc = `/media/iconos/categorias/${icon}.png`

  const iconSize = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size] || 'w-16 h-16'

  if (variant === 'inline') {
    return <img src={src} alt={category || ''} className={`${iconSize} ${className}`} onError={(e) => onPngError(e, fallbackSrc)} />
  }

  if (variant === 'circle') {
    // Círculo glass: base crema→ámbar (unified) + ring sutil con el acento.
    return (
      <div className={`relative rounded-full bg-gradient-to-br ${BASE_BG} p-1 ring-1 ${accent} shadow-lg ${className}`}>
        <div className="w-full h-full rounded-full bg-white/50 backdrop-blur-md border border-white/70 flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt={category || ''}
            loading="lazy"
            className="w-3/4 h-3/4 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
            onError={(e) => onPngError(e, fallbackSrc)}
          />
        </div>
      </div>
    )
  }

  // card: placeholder dentro de una tarjeta de producto
  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${BASE_BG} overflow-hidden ${className}`}>
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-12 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" aria-hidden="true" />
      <div className={`relative z-10 bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl ring-1 ${accent}`}>
        <img
          src={src}
          alt={category || ''}
          loading="lazy"
          className={`${iconSize} object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]`}
          onError={(e) => onPngError(e, fallbackSrc)}
        />
      </div>
    </div>
  )
}

export default CategoryIcon
