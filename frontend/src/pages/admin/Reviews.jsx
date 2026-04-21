import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Trash2, RefreshCw, Star, ExternalLink } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import Stars from '../../components/Stars'

const FILTERS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobadas' },
  { key: 'all', label: 'Todas' }
]

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export default function AdminReviews() {
  const toast = useToast()
  const [filter, setFilter] = useState('pending')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.get(`/api/reviews/admin?status=${filter}`)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  async function moderate(id, approved) {
    try {
      await api.patch(`/api/reviews/admin/${id}`, { approved })
      setRows((prev) =>
        filter === 'all'
          ? prev.map((r) => (r.id === id ? { ...r, approved: approved ? 1 : 0 } : r))
          : prev.filter((r) => r.id !== id)
      )
      toast?.success?.(approved ? 'Reseña aprobada' : 'Reseña ocultada')
    } catch (err) {
      toast?.error?.(err?.message || 'No se pudo actualizar')
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/reviews/${id}`)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast?.success?.('Reseña eliminada')
    } catch (err) {
      toast?.error?.(err?.message || 'No se pudo eliminar')
    }
  }

  const counts = {
    pending: rows.filter((r) => r.approved === 0).length,
    approved: rows.filter((r) => r.approved === 1).length
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-amber-500" /> Reseñas
          </h1>
          <p className="text-sm text-gray-500">Moderá las opiniones de clientes con compra verificada</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
          No hay reseñas con este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <header className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.product_name || `Producto #${r.product_id}`}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {r.user_name || 'Cliente'} · {r.user_email} · Pedido #{r.order_id}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars value={r.rating} size={14} />
                      <span className="text-[11px] text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.approved === 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Publicada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  )}
                  <Link
                    to={`/producto/${r.product_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-primary transition-colors"
                    title="Ver producto"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </header>

              {r.comment && (
                <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{r.comment}</p>
              )}

              <footer className="mt-3 flex items-center gap-2">
                {r.approved === 0 ? (
                  <button
                    type="button"
                    onClick={() => moderate(r.id, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => moderate(r.id, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
                  >
                    <XCircle size={14} /> Ocultar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 hover:text-red-600"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
