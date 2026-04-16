import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useScrollToTop from '../hooks/useScrollToTop'
import {
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
import Icon3D from '../components/Icon3D'
import { api } from '../lib/apiClient'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import ProductCarousel from '../components/ProductCarousel'
import VideoPlayer from '../components/VideoPlayer'
import ProductImage from '../components/ProductImage'
import ProductGallery from '../components/ProductGallery'
import RecipeImage from '../components/RecipeImage'
import TrustIcon3D from '../components/TrustIcon3D'
import SEO from '../components/SEO'
import CulinaryIcon from '../components/CulinaryIcon'
import SaleRibbon from '../components/SaleRibbon'
import LowStockBadge from '../components/LowStockBadge'
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

      <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_480px] gap-3 lg:gap-4">
        {/* GALERÍA — ocupa la mayor parte del ancho, sticky en desktop. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            product={product}
            badges={
              <>
                {!!product.is_on_sale && <SaleRibbon className="!relative !top-auto !left-auto" />}
                {isWeight && <span className="badge-by-weight">Por peso</span>}
                {!isAvailable && <span className="badge-out-of-stock">Agotado</span>}
                {isAvailable && lowStock && <LowStockBadge />}
              </>
            }
          />
        </div>

        {/* INFO + CTA — estilo buy-box eBay, compacto */}
        <div>
          {/* Breadcrumb category + brand */}
          <div className="flex items-center justify-between mb-1">
            {product.category_name && (
              <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">
                {product.category_name}
                {product.subcategory && <span className="text-gray-400"> · {product.subcategory}</span>}
              </p>
            )}
            {product.brand && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Award size={11} /> {product.brand}
              </span>
            )}
          </div>

          {/* Título grande en bold — eBay-style */}
          <h1 className="font-display text-[1.75rem] lg:text-[1.875rem] font-bold text-charcoal leading-[1.15] tracking-tight mb-1.5">
            {product.name}
          </h1>

          {/* Micro-trust line */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                En stock · listo para despachar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-700 font-medium">Agotado temporalmente</span>
            )}
            {product.reference && (
              <span className="text-gray-400">· Ref: {product.reference}</span>
            )}
          </div>

          <hr className="border-gray-200 mb-3" />

          {/* Price block grande */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[2.25rem] font-bold text-charcoal leading-none">
                {formatCOP(isWeight ? pricePerKg : product.price)}
              </span>
              <span className="text-gray-500 text-sm">/ {isWeight ? 'kg' : product.unit || 'und'}</span>
              {!!product.is_on_sale && product.original_price && (
                <>
                  <span className="text-gray-400 line-through text-sm">
                    {formatCOP(product.original_price)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                   bg-gradient-to-r from-accent-dark to-[#E63946] text-white
                                   text-[10px] font-display font-bold uppercase tracking-wider
                                   shadow-[0_2px_6px_-1px_rgba(160,32,32,0.4)]">
                    Oferta
                  </span>
                </>
              )}
            </div>
            {isWeight && (
              <p className="text-xs text-gray-500 mt-1">
                Pide la cantidad exacta en gramos. El cortador ajusta al pesar real.
              </p>
            )}
          </div>

          {/* Descripción corta */}
          {product.description && (
            <p className="text-sm text-gray-600 leading-snug whitespace-pre-line line-clamp-3 mb-3">
              {product.description}
            </p>
          )}

          {/* SELECTOR (cantidad o gramos) — compacto, filas tipo eBay */}
          {isAvailable && (
            <>
              {isWeight ? (
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ¿Cuántos gramos?
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESETS_GRAMS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrams(g)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition ${
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
                      className="input py-2 text-sm"
                    />
                    <span className="text-gray-500 text-sm font-medium">g</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm font-semibold text-gray-700 w-20">Cantidad</label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-2.5 py-1.5 hover:bg-gray-100 transition"
                      aria-label="Reducir"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-bold text-charcoal text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="px-2.5 py-1.5 hover:bg-gray-100 transition"
                      aria-label="Aumentar"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: sin piel, en pedazos, molida fina…"
                  className="input resize-none text-sm py-2"
                />
              </div>

              <div className="flex items-center justify-between bg-cream border border-primary/15 rounded-md px-3 py-2 mb-3">
                <span className="text-gray-600 text-xs">Subtotal estimado</span>
                <span className="text-xl font-bold text-primary">{formatCOP(computedTotal)}</span>
              </div>
            </>
          )}

          {/* CTA principal */}
          <button
            onClick={handleAdd}
            disabled={!isAvailable}
            className={`w-full py-3 mb-3 flex items-center justify-center gap-2 rounded-full font-semibold text-base transition-all shadow-sm ${
              isAvailable
                ? 'btn-primary hover:shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Icon3D name="shopping-cart" size="xs" />
            {isAvailable ? 'Agregar al carrito' : 'Agotado · sin stock'}
          </button>

          {/* Info rows estilo eBay: compactas */}
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white mb-3">
            <InfoRow icon={<TrustIcon3D name="truck" className="w-7 h-7" />} label="Entrega" value="Envío en Bucaramanga desde $2.000 · o recoges en tienda" />
            <InfoRow icon={<TrustIcon3D name="cold" className="w-7 h-7" />} label="Cadena de frío" value={cold ? cold.text : 'Garantizada hasta tu puerta'} />
            <InfoRow icon={<TrustIcon3D name="fresh" className="w-7 h-7" />} label="Frescura" value="Fresco del día · procesado al momento" />
            <InfoRow icon={<TrustIcon3D name="chat" className="w-7 h-7" />} label="Cambios" value="Coordinamos cambios por WhatsApp si algo no te gusta" />
          </div>

          {/* Trust band compacto */}
          <div className="bg-gradient-to-br from-cream to-white border border-primary/20 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
            <TrustIcon3D name="medal" className="w-10 h-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-charcoal text-[13px] leading-tight">Compra con tranquilidad</p>
              <p className="text-[11px] text-gray-600 leading-tight mt-0.5">Calidad garantizada · pago seguro con Bold · atención personalizada.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS estilo "About this item" de eBay */}
      <ProductTabs product={product} cold={cold} />

      {/* Bondades + Usos culinarios detallados en ancho completo */}
      {product.benefits && (
        <section className="mt-10 bg-gradient-to-br from-cream to-white border border-primary/15 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-charcoal mb-3 flex items-center gap-2">
            <TrustIcon3D name="medal" className="w-10 h-10 shrink-0" />
            Bondades y beneficios
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {product.benefits.split('\n').map((line, i) => {
              const trimmed = line.trim()
              if (!trimmed) return <br key={i} />
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
        </section>
      )}

      {Array.isArray(product.culinary_uses) && product.culinary_uses.length > 0 && (
        <section className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-charcoal mb-1 flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-accent/15 text-accent-dark flex items-center justify-center text-base">🍳</span>
            Ideal para
          </h2>
          <p className="text-sm text-gray-500 mb-4">Métodos de cocción recomendados para este producto.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {product.culinary_uses.map((slug) => (
              <CulinaryIcon key={slug} slug={slug} variant="card" size="md" />
            ))}
          </div>
        </section>
      )}

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

// Fila de información estilo eBay (icono + label + value)
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-xs text-charcoal leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// Tabs "About this item" estilo eBay — descripción, especificaciones, ingredientes
function ProductTabs({ product, cold }) {
  const [tab, setTab] = useState('descripcion')
  const tabs = [
    { key: 'descripcion', label: 'Descripción' },
    { key: 'especificaciones', label: 'Especificaciones' },
  ]
  if (product.ingredients) tabs.push({ key: 'ingredientes', label: 'Ingredientes' })

  return (
    <section className="mt-10 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-semibold transition relative ${
              tab === t.key
                ? 'text-primary bg-white'
                : 'text-gray-600 hover:text-charcoal hover:bg-white/50'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === 'descripcion' && (
          <div className="prose prose-sm max-w-none text-gray-700">
            {product.description ? (
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            ) : (
              <p className="text-gray-500 italic">Sin descripción disponible.</p>
            )}
          </div>
        )}

        {tab === 'especificaciones' && (
          <dl className="grid sm:grid-cols-2 gap-x-8 text-sm">
            {product.brand && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Marca</dt>
                <dd className="text-charcoal font-medium text-right">{product.brand}</dd>
              </div>
            )}
            {product.reference && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Referencia</dt>
                <dd className="text-charcoal font-medium text-right">{product.reference}</dd>
              </div>
            )}
            {product.category_name && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Categoría</dt>
                <dd className="text-charcoal font-medium text-right">{product.category_name}</dd>
              </div>
            )}
            {product.subcategory && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Subcategoría</dt>
                <dd className="text-charcoal font-medium text-right">{product.subcategory}</dd>
              </div>
            )}
            {product.packaging && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Empaque</dt>
                <dd className="text-charcoal font-medium text-right">{product.packaging}</dd>
              </div>
            )}
            {cold && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Cadena de frío</dt>
                <dd className="text-charcoal font-medium text-right">{cold.text}</dd>
              </div>
            )}
            {product.unit && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Unidad de venta</dt>
                <dd className="text-charcoal font-medium text-right">{product.unit}</dd>
              </div>
            )}
            {product.sale_type && (
              <div className="py-2 border-b border-gray-100 flex justify-between gap-2">
                <dt className="text-gray-500">Tipo de venta</dt>
                <dd className="text-charcoal font-medium text-right">
                  {product.sale_type === 'by_weight' ? 'Por peso' : 'Por unidad'}
                </dd>
              </div>
            )}
          </dl>
        )}

        {tab === 'ingredientes' && product.ingredients && (
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {product.ingredients}
          </p>
        )}
      </div>
    </section>
  )
}

export default ProductDetail
