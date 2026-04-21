import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Stars from './Stars'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function Bar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ReviewForm({ productId, onCreated }) {
  const { user } = useAuth()
  const toast = useToast()
  const [eligible, setEligible] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let alive = true
    api.get('/api/reviews/eligible')
      .then((data) => {
        if (!alive) return
        const filtered = (Array.isArray(data) ? data : []).filter((r) => r.product_id === productId)
        setEligible(filtered)
        if (filtered[0]) setOrderId(String(filtered[0].order_id))
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [user, productId])

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <a href="/login" className="font-semibold text-primary hover:underline">Iniciá sesión</a> con tu cuenta para dejar tu opinión sobre los productos que pediste.
      </div>
    )
  }
  if (loading) {
    return <div className="text-sm text-gray-400">Cargando…</div>
  }
  if (eligible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        Podrás opinar sobre este producto cuando recibas un pedido que lo incluya.
      </div>
    )
  }

  async function submit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const body = {
        product_id: productId,
        order_id: Number(orderId),
        rating,
        comment: comment.trim() || null
      }
      const created = await api.post('/api/reviews', body)
      setComment('')
      setRating(5)
      toast?.success?.('¡Gracias por tu reseña!')
      onCreated?.(created)
    } catch (err) {
      toast?.error?.(err?.message || 'No pudimos guardar tu reseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <MessageCircle size={16} className="text-primary" />
        Dejá tu reseña
      </div>
      {eligible.length > 1 && (
        <label className="block text-xs font-medium text-gray-600">
          Pedido:
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 text-sm px-3 py-2"
          >
            {eligible.map((e) => (
              <option key={e.order_id} value={e.order_id}>
                #{e.order_id} · {formatDate(e.ordered_at)}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600">Tu calificación:</span>
        <Stars value={rating} size={24} interactive onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Contanos cómo estuvo el producto (opcional)"
        className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Enviando…' : 'Publicar reseña'}
        </button>
      </div>
    </form>
  )
}

export default function ProductReviews({ productId, productName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.get(`/api/reviews/product/${productId}?page=${page}&limit=10`)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false))
  }, [productId, page])

  function handleCreated() {
    setPage(1)
    api.get(`/api/reviews/product/${productId}?page=1&limit=10`)
      .then((d) => setData(d))
      .catch(() => {})
  }

  const summary = data?.summary || { total: 0, avg_rating: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
  const items = data?.items || []

  const jsonLd = useMemo(() => {
    if (!summary.total) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(summary.avg_rating.toFixed(2)),
        reviewCount: summary.total
      }
    }
  }, [productName, summary.avg_rating, summary.total])

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Opiniones de clientes</h2>
      </div>

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <div className="rounded-xl bg-white border border-gray-200 p-4">
          {summary.total > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">{summary.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">/ 5</span>
              </div>
              <Stars value={summary.avg_rating} size={18} className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">
                {summary.total} {summary.total === 1 ? 'opinión' : 'opiniones'}
              </p>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-4 text-right">{r}</span>
                    <div className="flex-1"><Bar value={summary.breakdown[r] || 0} total={summary.total} /></div>
                    <span className="w-6 text-right tabular-nums text-gray-400">{summary.breakdown[r] || 0}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Stars value={0} size={18} className="justify-center" />
              <p className="mt-2 text-sm text-gray-500">Sé el primero en opinar</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ReviewForm productId={productId} onCreated={handleCreated} />
          <div className="space-y-3">
            {loading && <div className="text-sm text-gray-400">Cargando reseñas…</div>}
            {!loading && items.length === 0 && (
              <div className="rounded-xl bg-white border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Todavía no hay reseñas publicadas.
              </div>
            )}
            {items.map((r) => (
              <article key={r.id} className="rounded-xl bg-white border border-gray-200 p-4">
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(r.user_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.user_name || 'Cliente'}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 size={12} /> Compra verificada
                  </span>
                </header>
                <div className="mt-2"><Stars value={r.rating} size={15} /></div>
                {r.comment && <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{r.comment}</p>}
              </article>
            ))}
          </div>
          {summary.total > 10 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Anteriores
              </button>
              <button
                type="button"
                disabled={items.length < 10}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                Siguientes
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
