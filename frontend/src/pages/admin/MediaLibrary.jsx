// Biblioteca de medios: grid de miniaturas con búsqueda, filtro y asignación a productos.

import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, Film, Trash2, Link as LinkIcon, X } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'

const PER_PAGE = 60

function MediaLibrary() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (q) params.set('q', q)
    params.set('page', page)
    params.set('per_page', PER_PAGE)
    api.get(`/api/media?${params.toString()}`)
      .then((r) => {
        setItems(r.items)
        setTotal(r.total)
      })
      .catch(() => { setItems([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type, page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const fmtSize = (bytes) => bytes ? `${(bytes / 1024).toFixed(0)} KB` : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de medios</h1>
          <p className="text-sm text-gray-500">{total} archivos · {type || 'imágenes + videos'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre…"
              className="input pl-9 w-64"
            />
          </div>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="input w-auto">
            <option value="">Todos</option>
            <option value="image">Imágenes</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <ImageIcon className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">No hay medios que coincidan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              title={m.original_name}
            >
              {m.type === 'image' ? (
                <img src={m.url} alt={m.original_name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                /* Para videos NO hacemos preload: cargar 60 metadatos simultáneos rompe.
                   Mostramos un placeholder con ícono y un patrón sutil. El preview real
                   ocurre en el modal al hacer click. */
                <div className="relative w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                  <Film size={28} className="text-white/70" />
                  <div className="absolute bottom-1 left-1 right-1 text-center">
                    <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">Video</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{m.original_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
          >Anterior</button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
          >Siguiente</button>
        </div>
      )}

      {/* Modal de detalle / asignar */}
      {selected && (
        <MediaDetailModal
          media={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { setSelected(null); load() }}
          toast={toast}
          fmtSize={fmtSize}
        />
      )}
    </div>
  )
}

function MediaDetailModal({ media, onClose, onChanged, toast, fmtSize }) {
  const [fullMedia, setFullMedia] = useState(media)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState([])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    api.get(`/api/media/${media.id}`).then(setFullMedia).catch(() => {})
  }, [media.id])

  useEffect(() => {
    if (productQuery.trim().length < 2) { setProductResults([]); return }
    const ac = new AbortController()
    fetch(`/api/products/suggestions?q=${encodeURIComponent(productQuery.trim())}`, { signal: ac.signal })
      .then((r) => r.json())
      .then(setProductResults)
      .catch(() => {})
    return () => ac.abort()
  }, [productQuery])

  const assign = async (productId, productName, field) => {
    setAssigning(true)
    try {
      const useField = field || (media.type === 'video' ? 'video_url' : 'image_url')
      await api.post(`/api/media/${media.id}/assign`, { product_id: productId, field: useField })
      const labels = { image_url: 'foto principal', gallery: 'galería', video_url: 'video' }
      toast.success(`Asignada como ${labels[useField]} de "${productName}"`)
      onChanged()
    } catch (err) {
      toast.error(err.message || 'Error al asignar')
    } finally {
      setAssigning(false)
    }
  }

  const doDelete = async () => {
    if (!confirm('¿Eliminar este medio? No se puede deshacer.')) return
    try {
      await api.delete(`/api/media/${media.id}`)
      toast.success('Medio eliminado')
      onChanged()
    } catch (err) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden grid md:grid-cols-[1fr_360px]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gray-900 flex items-center justify-center overflow-hidden">
          {media.type === 'image' ? (
            <img src={media.url} alt={media.original_name} className="max-h-[80vh] max-w-full object-contain" />
          ) : (
            <video src={media.url} controls className="max-h-[80vh] max-w-full" />
          )}
        </div>
        <div className="p-4 overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800" aria-label="Cerrar">
            <X size={20} />
          </button>
          <h3 className="text-sm font-bold truncate pr-8">{media.original_name}</h3>
          <p className="text-xs text-gray-500 mt-1 break-all">{media.url}</p>
          <dl className="text-xs text-gray-600 mt-3 space-y-1">
            <div className="flex justify-between"><dt>Tipo</dt><dd className="font-medium">{media.type}</dd></div>
            <div className="flex justify-between"><dt>Tamaño</dt><dd>{fmtSize(media.size)}</dd></div>
          </dl>

          {fullMedia.used_in_products?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-1">Usado en</h4>
              <ul className="space-y-1">
                {fullMedia.used_in_products.map((p, i) => (
                  <li key={`${p.id}-${i}`} className="text-xs flex items-center justify-between gap-2">
                    <span className="text-primary flex items-center gap-1 truncate">
                      <LinkIcon size={10} /> {p.name}
                      {p.usage && <span className="text-gray-500">({p.usage})</span>}
                    </span>
                    <button
                      onClick={async () => {
                        const fieldMap = { principal: 'image_url', galería: 'gallery', video: 'video_url' }
                        const f = fieldMap[p.usage] || 'image_url'
                        try {
                          await api.post(`/api/media/${media.id}/unassign`, { product_id: p.id, field: f })
                          toast.success('Desasignado')
                          onChanged()
                        } catch (err) {
                          toast.error(err.message || 'Error')
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-[10px] px-1"
                      title="Quitar de este producto"
                    >
                      quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Asignar a producto</h4>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Buscar producto…"
                className="input pl-9 text-sm"
              />
            </div>
            {productResults.length > 0 && (
              <ul className="max-h-72 overflow-y-auto border rounded-lg divide-y">
                {productResults.map((p) => (
                  <li key={p.id} className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{p.category_name}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {media.type === 'image' ? (
                        <>
                          <button
                            disabled={assigning}
                            onClick={() => assign(p.id, p.name, 'image_url')}
                            className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                            title="Usar como imagen principal (reemplaza la actual)"
                          >
                            Foto principal
                          </button>
                          <button
                            disabled={assigning}
                            onClick={() => assign(p.id, p.name, 'gallery')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            title="Agregar a galería (además de la principal)"
                          >
                            + Galería
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={assigning}
                          onClick={() => assign(p.id, p.name, 'video_url')}
                          className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                        >
                          Asignar como video
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={doDelete} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} /> Eliminar de la biblioteca
          </button>
        </div>
      </div>
    </div>
  )
}

export default MediaLibrary
