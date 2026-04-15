// Carrusel adaptable: si <=4 items en desktop renderiza grid 4 columnas con tarjetas
// completas; si >4 usa scroll horizontal con tarjetas compactas más anchas que antes.

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductImage from './ProductImage'
import ProductCard from './ProductCard'

function CompactCard({ product }) {
  const isWeight = product.sale_type === 'by_weight'
  const price = isWeight ? product.price_per_kg ?? product.price : product.price
  return (
    <Link
      to={`/producto/${product.id}`}
      className="w-56 md:w-60 flex-shrink-0 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden block snap-start"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        <ProductImage product={product} size="sm" />
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-base font-bold text-primary">${Number(price).toLocaleString('es-CO')}</span>
          <span className="text-xs text-gray-500">/{isWeight ? 'kg' : product.unit || 'und'}</span>
        </div>
      </div>
    </Link>
  )
}

function ProductCarousel({ title, items, emptyText, mode = 'auto', gridThreshold = 4 }) {
  const ref = useRef(null)

  if (!items || items.length === 0) {
    if (!emptyText) return null
    return (
      <section>
        {title && <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>}
        <p className="text-gray-500 text-sm">{emptyText}</p>
      </section>
    )
  }

  // Decide: grid vs carousel.
  // - mode='grid': siempre grid.
  // - mode='carousel': siempre carrusel.
  // - mode='auto': grid cuando items.length<=gridThreshold (no sobra espacio); carrusel si excede.
  const useGrid =
    mode === 'grid' ||
    (mode === 'auto' && items.length <= gridThreshold)

  if (useGrid) {
    return (
      <section>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.slice(0, gridThreshold).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    )
  }

  const scroll = (dir) => {
    if (!ref.current) return
    const step = ref.current.clientWidth * 0.8
    ref.current.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scroll(-1)}
            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600"
            aria-label="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-1 px-1"
      >
        {items.map((p) => <CompactCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

export default ProductCarousel
