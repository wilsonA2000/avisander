// Detalle de receta: hero + body markdown simple + lista de productos + "agregar todos".

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, ChefHat, ShoppingCart, ArrowLeft, MessageCircle, BookOpen, PlayCircle, Users, Share2, Copy, Printer, Check } from 'lucide-react'
import { api } from '../lib/apiClient'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useSettings, whatsappLink } from '../context/SettingsContext'
import VideoPlayer from '../components/VideoPlayer'
import RecipeImage from '../components/RecipeImage'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'

// Convertidor de markdown muy simple (sin librería extra): sólo párrafos, listas y negritas.
function renderMarkdown(md) {
  if (!md) return null
  const lines = md.split('\n')
  const blocks = []
  let list = null
  let para = []
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={blocks.length} className="text-gray-700 leading-relaxed mb-3">{inlineMd(para.join(' '))}</p>)
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push(<ul key={blocks.length} className="list-disc pl-6 mb-3 space-y-1 text-gray-700">{list}</ul>)
      list = null
    }
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushPara(); flushList(); continue }
    if (/^#{1,3}\s/.test(line)) {
      flushPara(); flushList()
      const level = line.match(/^(#+)\s/)[1].length
      const text = line.replace(/^#+\s/, '')
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
      blocks.push(<Tag key={blocks.length} className="font-bold text-gray-900 mt-4 mb-2">{text}</Tag>)
      continue
    }
    if (/^[-*]\s/.test(line)) {
      flushPara()
      list = list || []
      list.push(<li key={list.length}>{inlineMd(line.replace(/^[-*]\s/, ''))}</li>)
      continue
    }
    para.push(line)
  }
  flushPara(); flushList()
  return blocks
}
function inlineMd(text) {
  // **bold** e *italic*
  const parts = []
  let rest = text
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/
  while (true) {
    const m = rest.match(re)
    if (!m) { parts.push(rest); break }
    if (m.index > 0) parts.push(rest.slice(0, m.index))
    if (m[2]) parts.push(<strong key={parts.length}>{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={parts.length}>{m[3]}</em>)
    rest = rest.slice(m.index + m[1].length)
  }
  return parts
}

function RecipeDetail() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const toast = useToast()
  const { settings } = useSettings()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState([])
  const [copied, setCopied] = useState(false)

  useScrollToTop()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setLoading(true)
    api.get(`/api/recipes/by-slug/${slug}`, { skipAuth: true })
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!recipe?.meal_type) { setRelated([]); return }
    api.get(`/api/recipes?meal_type=${recipe.meal_type}&limit=6`, { skipAuth: true })
      .then((list) => {
        const filtered = (list || []).filter((r) => r.id !== recipe.id).slice(0, 3)
        setRelated(filtered)
      })
      .catch(() => setRelated([]))
  }, [recipe?.id, recipe?.meal_type])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = recipe ? `Mira esta receta de ${recipe.title} en Avisander:` : ''
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handlePrint = () => window.print()

  const addAll = () => {
    if (!recipe?.products?.length) return
    let added = 0
    for (const p of recipe.products) {
      if (!p.is_available) continue
      if (p.sale_type === 'by_weight') {
        addItem(p, { weight_grams: 500 })
      } else {
        addItem(p, { quantity: 1 })
      }
      added++
    }
    if (added > 0) {
      toast.success(`✓ ${added} producto(s) agregados al carrito`)
      window.dispatchEvent(new CustomEvent('avisander:cart-bump'))
    } else {
      toast.warn('Ninguno de los productos está disponible en este momento.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="aspect-video bg-gray-100 rounded-xl animate-pulse mb-4" />
        <div className="h-8 bg-gray-100 rounded animate-pulse w-2/3 mb-2" />
        <div className="h-24 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }
  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">Receta no encontrada.</p>
        <Link to="/recetas" className="btn-primary">Ver todas las recetas</Link>
      </div>
    )
  }

  const recipeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.summary || recipe.title,
    image: recipe.cover_image_url,
    totalTime: recipe.duration_min ? `PT${recipe.duration_min}M` : undefined,
    recipeCategory: 'Carnes',
    recipeIngredient: (recipe.products || []).map((p) => p.name),
    author: { '@type': 'Organization', name: 'Avisander' }
  }

  // Mensaje WhatsApp pre-llenado para CTA cuando la receta no tiene cuerpo.
  const waUrl = whatsappLink(
    settings.whatsapp_number,
    `Hola, vi la receta "${recipe.title}" en Avisander y me gustaría que me ayuden con la preparación.`
  )

  return (
    <div className="container mx-auto px-4 py-6 pb-16 md:pb-24 recipe-page">
      <SEO
        title={recipe.title}
        description={recipe.summary || `Receta de ${recipe.title} con productos de Avisander.`}
        image={recipe.cover_image_url}
        type="article"
        jsonLd={recipeJsonLd}
      />

      {/* Header de impresión: solo aparece al imprimir (ver @media print en index.css) */}
      <div className="print-only print-header">
        <div className="print-brand">
          <img src="/logo.png" alt="Avisander" className="print-logo" />
          <div className="print-tagline">Carnicería Premium · Bucaramanga</div>
        </div>
        <div className="print-meta">
          <div>{new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <Link to="/recetas" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 no-print">
        <ArrowLeft size={14} /> Volver a recetas
      </Link>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <article>
          <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <RecipeImage recipe={recipe} />

          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          {recipe.summary && <p className="text-gray-600 mb-4">{recipe.summary}</p>}

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 flex-wrap">
            {recipe.duration_min && <span className="inline-flex items-center gap-1"><Clock size={14} /> {recipe.duration_min} minutos</span>}
            {recipe.servings && <span className="inline-flex items-center gap-1"><Users size={14} /> {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>}
            {recipe.difficulty && <span className="inline-flex items-center gap-1 capitalize"><ChefHat size={14} /> {recipe.difficulty}</span>}
          </div>

          {recipe.video_url && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle size={20} className="text-primary" />
                <h2 className="font-display text-lg font-bold text-charcoal">Video paso a paso</h2>
              </div>
              <VideoPlayer src={recipe.video_url} title={recipe.title} />
            </div>
          )}

          <div className="prose max-w-none">
            {renderMarkdown(recipe.body_markdown) || (
              <div className="bg-cream rounded-2xl p-7 border border-amber-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-bold text-charcoal mb-1">
                      Esta receta aún no tiene la preparación detallada
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Tenemos los ingredientes listos para ti. Si quieres, te asesoramos por WhatsApp con
                      la preparación, gramajes y trucos de nuestro maestro carnicero.
                    </p>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-colors"
                    >
                      <MessageCircle size={16} />
                      Pedir asesoría por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        <aside className="no-print space-y-4">
          {/* Card resumen visual */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {recipe.duration_min && (
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock size={18} className="mx-auto text-amber-700 mb-1" />
                  <div className="text-lg font-bold text-gray-900">{recipe.duration_min}</div>
                  <div className="text-[10px] text-gray-500 uppercase">minutos</div>
                </div>
              )}
              {recipe.servings && (
                <div className="p-2 rounded-lg bg-orange-50">
                  <Users size={18} className="mx-auto text-orange-700 mb-1" />
                  <div className="text-lg font-bold text-gray-900">{recipe.servings}</div>
                  <div className="text-[10px] text-gray-500 uppercase">porciones</div>
                </div>
              )}
              {recipe.difficulty && (
                <div className="p-2 rounded-lg bg-emerald-50">
                  <ChefHat size={18} className="mx-auto text-emerald-700 mb-1" />
                  <div className="text-sm font-bold text-gray-900 capitalize leading-tight mt-0.5">{recipe.difficulty}</div>
                  <div className="text-[10px] text-gray-500 uppercase">nivel</div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones: compartir e imprimir */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Share2 size={14} /> Compartir e imprimir
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-medium"
                title="Compartir por WhatsApp"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
              <button
                onClick={handleCopy}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-medium"
                title="Copiar link"
              >
                {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-medium"
                title="Imprimir receta"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart size={18} className="text-primary" />
              <h2 className="text-lg font-bold">Productos para esta receta</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Compra en un click todo lo que necesitas. Los frescos, listos en tu carrito.
            </p>
            {recipe.products?.length > 0 ? (
              <>
                <ul className="space-y-2 mb-4">
                  {recipe.products.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <Link
                        to={`/producto/${p.id}`}
                        className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden block"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingCart size={14} />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/producto/${p.id}`} className="text-sm font-medium text-gray-800 hover:text-primary block truncate">
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          ${Number(p.sale_type === 'by_weight' ? p.price_per_kg : p.price).toLocaleString('es-CO')}
                          /{p.sale_type === 'by_weight' ? 'kg' : p.unit || 'und'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <button onClick={addAll} className="w-full btn-primary flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> Agregar todos al carrito
                </button>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Esta receta aún no tiene productos enlazados.</p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <MessageCircle size={12} /> Pregúntanos por WhatsApp
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Recetas similares */}
      {related.length > 0 && (
        <section className="mt-12 no-print">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-5">También te podría gustar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/recetas/${r.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <RecipeImage recipe={r} />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                  {r.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>}
                  <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {r.duration_min && <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.duration_min} min</span>}
                    {r.servings && <span className="inline-flex items-center gap-1"><Users size={12} /> {r.servings}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer de impresión: solo aparece al imprimir */}
      <div className="print-only print-footer">
        <div className="print-footer-brand">
          <strong>{settings.store_name || 'Avisander'}</strong> · Carnicería Premium
        </div>
        <div className="print-footer-info">
          <span>📍 {settings.store_address || 'Bucaramanga, Santander'}</span>
          <span>📱 WhatsApp: {settings.whatsapp_number}</span>
        </div>
        <div className="print-footer-hours">
          Horarios: L-V {settings.business_hours_weekday} · Sáb-Dom {settings.business_hours_weekend}
        </div>
        <div className="print-footer-note">
          Receta impresa desde avisander.com — Comparte la cocina colombiana.
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail
