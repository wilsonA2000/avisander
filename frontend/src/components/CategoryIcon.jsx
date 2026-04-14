// Ícono 3D de categoría sobre superficie glassmórfica.
// Los PNG los servimos desde /media/iconos/categorias/ (ver backend/media/).
// Son Microsoft Fluent Emoji en su versión 3D (MIT license).

const CATEGORY_MAP = {
  // categoría del Excel → slug de archivo + gradiente de fondo
  'carne de res': { icon: 'res', bg: 'from-red-200/70 via-red-100/60 to-rose-200/70' },
  res: { icon: 'res', bg: 'from-red-200/70 via-red-100/60 to-rose-200/70' },
  cerdo: { icon: 'cerdo', bg: 'from-pink-200/70 via-pink-100/60 to-rose-200/70' },
  'pollo fresco': { icon: 'pollo', bg: 'from-amber-200/70 via-yellow-100/60 to-orange-200/70' },
  'pollo marinado': { icon: 'pollo', bg: 'from-amber-200/70 via-yellow-100/60 to-orange-200/70' },
  pollo: { icon: 'pollo', bg: 'from-amber-200/70 via-yellow-100/60 to-orange-200/70' },
  'visceras pollo': { icon: 'pollo', bg: 'from-amber-200/60 via-yellow-100/60 to-orange-200/60' },
  huevos: { icon: 'huevos', bg: 'from-yellow-200/70 via-amber-100/60 to-yellow-200/70' },
  'carnes frias': { icon: 'carnes-frias', bg: 'from-rose-200/70 via-pink-100/60 to-red-200/70' },
  embutidos: { icon: 'embutidos', bg: 'from-rose-200/70 via-pink-100/60 to-red-200/70' },
  congelado: { icon: 'congelado', bg: 'from-cyan-200/70 via-sky-100/60 to-blue-200/70' },
  lacteos: { icon: 'lacteos', bg: 'from-amber-200/70 via-yellow-100/60 to-orange-200/70' },
  fruver: { icon: 'fruver', bg: 'from-emerald-200/70 via-green-100/60 to-lime-200/70' },
  varios: { icon: 'varios', bg: 'from-slate-200/70 via-gray-100/60 to-slate-200/70' },
  otros: { icon: 'varios', bg: 'from-slate-200/70 via-gray-100/60 to-slate-200/70' }
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
function CategoryIcon({ category, variant = 'card', size = 'md', className = '' }) {
  const { icon, bg } = pick(category)
  const src = `/media/iconos/categorias/${icon}.png`

  const iconSize = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size] || 'w-16 h-16'

  if (variant === 'inline') {
    return <img src={src} alt={category || ''} className={`${iconSize} ${className}`} />
  }

  if (variant === 'circle') {
    // Círculo glassmórfico (para categorías del home)
    return (
      <div className={`relative rounded-full bg-gradient-to-br ${bg} p-1 shadow-md ${className}`}>
        <div className="w-full h-full rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt={category || ''}
            loading="lazy"
            className="w-3/4 h-3/4 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
          />
        </div>
      </div>
    )
  }

  // card: placeholder dentro de una tarjeta de producto
  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${bg} overflow-hidden ${className}`}>
      {/* Pelotitas de luz para efecto glass */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-12 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" aria-hidden="true" />
      {/* Panel glassmórfico central */}
      <div className="relative z-10 bg-white/25 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-xl">
        <img
          src={src}
          alt={category || ''}
          loading="lazy"
          className={`${iconSize} object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]`}
        />
      </div>
    </div>
  )
}

export default CategoryIcon
