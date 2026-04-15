// Detalle de receta: hero + body markdown simple + lista de productos + "agregar todos".

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, ChefHat, ShoppingCart, ArrowLeft, MessageCircle, BookOpen } from 'lucide-react'
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

  useScrollToTop()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setLoading(true)
    api.get(`/api/recipes/by-slug/${slug}`, { skipAuth: true })
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false))
  }, [slug])

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
    <div className="container mx-auto px-4 py-6 pb-16 md:pb-24">
      <SEO
        title={recipe.title}
        description={recipe.summary || `Receta de ${recipe.title} con productos de Avisander.`}
        image={recipe.cover_image_url}
        type="article"
        jsonLd={recipeJsonLd}
      />
      <Link to="/recetas" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft size={14} /> Volver a recetas
      </Link>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <article>
          <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <RecipeImage recipe={recipe} />

          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          {recipe.summary && <p className="text-gray-600 mb-4">{recipe.summary}</p>}

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            {recipe.duration_min && <span className="inline-flex items-center gap-1"><Clock size={14} /> {recipe.duration_min} minutos</span>}
            {recipe.difficulty && <span className="inline-flex items-center gap-1 capitalize"><ChefHat size={14} /> {recipe.difficulty}</span>}
          </div>

          {recipe.video_url && (
            <div className="mb-6">
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

        <aside>
          <div className="sticky top-[140px] bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold mb-3">Ingredientes</h2>
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
              <p className="text-sm text-gray-500">Esta receta aún no tiene productos enlazados.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default RecipeDetail
