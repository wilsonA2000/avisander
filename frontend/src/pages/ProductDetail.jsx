import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useScrollToTop from '../hooks/useScrollToTop'
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Snowflake,
  Tag,
  Award,
  Info,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react'
import { api } from '../lib/apiClient'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import ProductCarousel from '../components/ProductCarousel'
import VideoPlayer from '../components/VideoPlayer'
import ProductImage from '../components/ProductImage'
import ProductGallery from '../components/ProductGallery'
import RecipeImage from '../components/RecipeImage'
import SEO from '../components/SEO'
import CulinaryIcon from '../components/CulinaryIcon'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'

const PRESETS_GRAMS = [250, 500, 750, 1000, 1500, 2000]

const COLD_CHAIN_LABEL = {
  refrigerado: { text: 'Refrigerado', icon: '❄️', color: 'bg-blue-100 text-blue-800' },
  congelado: { text: 'Congelado', icon: '🧊', color: 'bg-cyan-100 text-cyan-800' },
  ambiente: { text: 'Temp. ambiente', icon: '🌡️', color: 'bg-amber-100 text-amber-800' }
}

function formatCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

function ProductDetail() {
  const { id } = useParams()
  // Scroll a top en cada cambio de producto (cliente entra desde un grid scrolleado).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])
  useScrollToTop()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState([])
  const [productRecipes, setProductRecipes] = useState([])
  const { items: recentlyViewed, push: pushViewed } = useRecentlyViewed(Number(id))
  const [error, setError] = useState('')

  // Selección de cantidad
  const [grams, setGrams] = useState(500)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')

  // Galería
  // galleryIdx queda fijo en 0 porque ProductGallery maneja la selección
  // internamente. Sólo lo mantenemos para construir el currentImage usado en SEO.
  const galleryIdx = 0

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/api/products/${id}`, { skipAuth: true })
      .then((data) => {
        if (active) {
          setProduct(data)
          setError('')
          pushViewed(data)
        }
      })
      .catch((e) => {
        if (active) setError(e.message || 'No pudimos cargar el producto')
      })
      .finally(() => active && setLoading(false))

    // Paralelo: relacionados y recetas
    Promise.all([
      api.get(`/api/products/${id}/related?limit=8`, { skipAuth: true }).catch(() => []),
      api.get(`/api/recipes?by_product=${id}`, { skipAuth: true }).catch(() => [])
    ]).then(([r, rec]) => {
      if (!active) return
      setRelated(Array.isArray(r) ? r : [])
      setProductRecipes(Array.isArray(rec) ? rec : [])
    })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-6 bg-gray-100 rounded w-2/3 animate-pulse" />
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{error || 'Producto no encontrado'}</p>
        <Link to="/productos" className="btn-primary">Volver al catálogo</Link>
      </div>
    )
  }

  const isWeight = product.sale_type === 'by_weight'
  const hasStockField = product.stock !== undefined && product.stock !== null
  const stock = Number(product.stock) || 0
  const isAvailable = product.is_available !== false && (!hasStockField || stock > 0)
  const lowStock = hasStockField && stock > 0 && stock <= 3
  const pricePerKg = product.price_per_kg ?? product.price
  const computedTotal = isWeight ? (pricePerKg * grams) / 1000 : product.price * qty

  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean)
  const currentImage = allImages[galleryIdx] || null
  const cold = COLD_CHAIN_LABEL[product.cold_chain] || null

  const handleAdd = () => {
    if (isWeight) {
      const g = Number(grams)
      if (!g || g < 50 || g > 20000) {
        toast.error('Cantidad entre 50 y 20.000 gramos')
        return
      }
      addItem(product, { weight_grams: g, notes: notes.trim() })
      toast.success(`✓ ${product.name} (${g} g) agregado al carrito`)
      window.dispatchEvent(new CustomEvent('avisander:cart-bump'))
      return
    }
    const q = Number(qty)
    if (!q || q < 1) {
      toast.error('Cantidad mínima 1')
      return
    }
    if (hasStockField && stock <= 0) {
      toast.error('Producto agotado')
      return
    }
    if (hasStockField && q > stock) {
      toast.warn(`Solo quedan ${stock} unidades de "${product.name}"`)
      return
    }
    const result = addItem(product, { quantity: q, notes: notes.trim() })
    if (result?.added <= 0) {
      toast.error(`${product.name} sin stock disponible.`)
      return
    }
    if (result?.added < result?.requested) {
      toast.warn(`Solo agregamos ${result.added} (queda ${result.stock} en stock).`)
    } else {
      toast.success(`✓ ${product.name} (${q} ${product.unit || 'und'}) agregado al carrito`)
    }
    window.dispatchEvent(new CustomEvent('avisander:cart-bump'))
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — ${product.category_name || 'Avisander'}`,
    image: currentImage ? (currentImage.startsWith('http') ? currentImage : `${window.location.origin}${currentImage}`) : undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.reference || `AVI-${product.id}`,
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'COP',
      price: isWeight ? pricePerKg : product.price,
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Avisander' }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <SEO
        title={product.name}
        description={product.description || `${product.name} en Avisander · ${product.category_name || 'Carnicería Premium'} Bucaramanga.`}
        image={currentImage && !currentImage.startsWith('http') ? `${window.location.origin}${currentImage}` : currentImage}
        type="product"
        jsonLd={jsonLd}
      />
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <span>/</span>
        <Link to="/productos" className="hover:text-primary">Productos</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <span className="text-gray-700">{product.category_name}</span>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-10">
        {/* GALERÍA — ocupa la mayor parte del ancho, sticky en desktop. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            product={product}
            badges={
              <>
                {product.is_on_sale && <span className="badge-sale">Oferta</span>}
                {isWeight && <span className="badge-by-weight">Por peso</span>}
                {!isAvailable && <span className="badge-out-of-stock">Agotado</span>}
                {isAvailable && lowStock && (
                  <span className="badge bg-amber-500 text-white">Últimas unidades</span>
                )}
              </>
            }
          />
        </div>

        {/* INFO + CTA */}
        <div>
          {product.category_name && (
            <p className="text-sm text-primary font-medium uppercase tracking-wide mb-1">
              {product.category_name}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {(product.brand || product.reference) && (
            <p className="text-sm text-gray-500 mb-4">
              {product.brand && (
                <span className="inline-flex items-center gap-1 mr-3">
                  <Award size={14} /> {product.brand}
                </span>
              )}
              {product.reference && (
                <span className="inline-flex items-center gap-1">
                  <Tag size={14} /> Ref: {product.reference}
                </span>
              )}
            </p>
          )}

          {/* Precio */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {formatCOP(isWeight ? pricePerKg : product.price)}
              </span>
              <span className="text-gray-500">/ {isWeight ? 'kg' : product.unit || 'und'}</span>
              {product.is_on_sale && product.original_price && (
                <span className="text-gray-400 line-through ml-1">
                  {formatCOP(product.original_price)}
                </span>
              )}
            </div>
            {isWeight && (
              <p className="text-xs text-gray-500 mt-1">
                Pide la cantidad exacta en gramos. El cortador ajusta al pesar real.
              </p>
            )}
          </div>

          {/* Atributos rápidos */}
          <div className="flex flex-wrap gap-2 mb-5">
            {cold && (
              <span className={`badge ${cold.color}`}>
                {cold.icon} {cold.text}
              </span>
            )}
            {product.packaging && (
              <span className="badge bg-gray-100 text-gray-700">
                <Package size={12} className="inline mr-1" />
                {product.packaging}
              </span>
            )}
            {isAvailable ? (
              <span className="badge bg-green-100 text-green-800">✓ Disponible</span>
            ) : (
              <span className="badge bg-red-100 text-red-800">Agotado</span>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Descripción</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* SELECTOR + AGREGAR */}
          {isAvailable ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              {isWeight ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuántos gramos quieres?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS_GRAMS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrams(g)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          Number(grams) === g
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={20000}
                      step={50}
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      className="input"
                    />
                    <span className="text-gray-500 font-medium">g</span>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                  <div className="flex items-center border rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-100"
                      aria-label="Reducir"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-14 text-center font-semibold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="p-3 hover:bg-gray-100"
                      aria-label="Aumentar"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: sin piel, en pedazos, en bolsas separadas, molida fina…"
                  className="input resize-none"
                />
              </div>

              <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-gray-600 text-sm">Subtotal estimado</span>
                <span className="text-2xl font-bold text-primary">{formatCOP(computedTotal)}</span>
              </div>

              <button
                onClick={handleAdd}
                disabled={!isAvailable}
                className={`mt-4 w-full py-3 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
                  isAvailable
                    ? 'btn-primary'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={20} />
                {isAvailable ? 'Agregar al carrito' : 'Agotado · sin stock'}
              </button>

              {/* Signos de confianza */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><span>✓</span> Fresco hoy</div>
                <div className="flex items-center gap-1.5"><span>❄️</span> Cadena de frío</div>
                <div className="flex items-center gap-1.5"><span>🚚</span> Envío en Bucaramanga desde $2.000</div>
                <div className="flex items-center gap-1.5"><span>💬</span> Cambios por WhatsApp</div>
              </div>
            </div>
          ) : (
            <button disabled className="w-full btn bg-gray-300 text-gray-500 cursor-not-allowed mb-5">
              No disponible por ahora
            </button>
          )}

          {/* Bondades nutricionales */}
          {product.benefits && (
            <div className="bg-gradient-to-br from-cream to-white border border-primary/15 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-charcoal mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm">✦</span>
                Bondades y beneficios
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {product.benefits.split('\n').map((line, i) => {
                  const trimmed = line.trim()
                  if (!trimmed) return <br key={i} />
                  // Negrita simple con **...**
                  const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
                  const rendered = parts.map((p, j) =>
                    p.startsWith('**') && p.endsWith('**')
                      ? <strong key={j} className="text-charcoal">{p.slice(2, -2)}</strong>
                      : <span key={j}>{p}</span>
                  )
                  if (trimmed.startsWith('- ')) {
                    return <li key={i} className="ml-4 mb-1 list-disc text-sm">{rendered.map((r, idx) => idx === 0 ? <span key={idx}>{trimmed.slice(2)}</span> : r)}</li>
                  }
                  return <p key={i} className="mb-2">{rendered}</p>
                })}
              </div>
            </div>
          )}

          {/* Usos culinarios sugeridos */}
          {Array.isArray(product.culinary_uses) && product.culinary_uses.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-accent/15 text-accent-dark flex items-center justify-center text-sm">🍳</span>
                Ideal para
              </h2>
              <p className="text-sm text-gray-500 mb-4">Métodos de cocción recomendados para este producto.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {product.culinary_uses.map((slug) => (
                  <CulinaryIcon key={slug} slug={slug} variant="card" size="md" />
                ))}
              </div>
            </div>
          )}

          {/* Especificaciones detalladas */}
          {(product.packaging || product.cold_chain || product.brand || product.reference || product.ingredients) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Info size={16} /> Información del producto
              </h2>
              <dl className="text-sm divide-y divide-gray-100">
                {product.brand && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Marca</dt>
                    <dd className="col-span-2 text-gray-800">{product.brand}</dd>
                  </div>
                )}
                {product.reference && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Referencia</dt>
                    <dd className="col-span-2 text-gray-800">{product.reference}</dd>
                  </div>
                )}
                {product.packaging && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Empaque</dt>
                    <dd className="col-span-2 text-gray-800">{product.packaging}</dd>
                  </div>
                )}
                {cold && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Cadena de frío</dt>
                    <dd className="col-span-2 text-gray-800 inline-flex items-center gap-1">
                      <Snowflake size={14} /> {cold.text}
                    </dd>
                  </div>
                )}
                {product.unit && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Unidad de venta</dt>
                    <dd className="col-span-2 text-gray-800">{product.unit}</dd>
                  </div>
                )}
                {product.ingredients && (
                  <div className="py-2 grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Ingredientes</dt>
                    <dd className="col-span-2 text-gray-800 whitespace-pre-line">{product.ingredients}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Video ya integrado como slide dentro de ProductGallery. */}

      {/* Recetas que usan este producto */}
      {productRecipes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Recetas con {product.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productRecipes.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to={`/recetas/${r.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-shadow block"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <RecipeImage recipe={r} size="sm" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{r.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {r.duration_min && <span>⏱ {r.duration_min} min</span>}
                    {r.difficulty && <span className="capitalize">· {r.difficulty}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-10">
          <ProductCarousel title="Productos similares" items={related} />
        </section>
      )}

      {/* Recientemente vistos */}
      {recentlyViewed.length > 0 && (
        <section className="mt-10 mb-4">
          <ProductCarousel title="Vistos recientemente" items={recentlyViewed} />
        </section>
      )}
    </div>
  )
}

export default ProductDetail
