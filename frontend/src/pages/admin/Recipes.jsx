// Admin CRUD de recetas: tabla + modal de edición con búsqueda de productos para enlazar.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Eye, Search, ChefHat } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'

const EMPTY = {
  title: '', summary: '', cover_image_url: '', video_url: '',
  body_markdown: '', duration_min: '', difficulty: '',
  is_published: false, product_ids: []
}

function Recipes() {
  const toast = useToast()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState([])

  const load = () => {
    setLoading(true)
    api.get('/api/recipes?published=all')
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openModal = (r = null) => {
    if (r) {
      setEditing(r)
      setForm({
        title: r.title,
        summary: r.summary || '',
        cover_image_url: r.cover_image_url || '',
        video_url: r.video_url || '',
        body_markdown: r.body_markdown || '',
        duration_min: r.duration_min || '',
        difficulty: r.difficulty || '',
        is_published: !!r.is_published,
        product_ids: (r.products || []).map((p) => p.id)
      })
    } else {
      setEditing(null)
      setForm(EMPTY)
    }
    setProductQuery('')
    setProductResults([])
    setShowModal(true)
  }

  // Buscador de productos dentro del modal
  useEffect(() => {
    if (!showModal || productQuery.trim().length < 2) { setProductResults([]); return }
    const ac = new AbortController()
    fetch(`/api/products/suggestions?q=${encodeURIComponent(productQuery.trim())}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((arr) => setProductResults(Array.isArray(arr) ? arr : []))
      .catch(() => {})
    return () => ac.abort()
  }, [productQuery, showModal])

  const linkedProducts = useMemo(() => {
    // Combinamos los que ya estaban con los nuevos añadidos (por id) — mostramos nombre cuando podamos
    return form.product_ids
  }, [form.product_ids])

  const addProduct = (p) => {
    if (form.product_ids.includes(p.id)) return
    setForm((f) => ({ ...f, product_ids: [...f.product_ids, p.id] }))
    // guardamos nombre en un cache temporal en window para no repedir
    window.__avisanderProductNames ||= {}
    window.__avisanderProductNames[p.id] = p.name
    setProductQuery('')
    setProductResults([])
  }
  const removeProduct = (id) => setForm((f) => ({ ...f, product_ids: f.product_ids.filter((x) => x !== id) }))

  const productNameOf = (id) => {
    const fromForm = (editing?.products || []).find((p) => p.id === id)?.name
    return fromForm || window.__avisanderProductNames?.[id] || `Producto #${id}`
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('El título es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        duration_min: form.duration_min ? parseInt(form.duration_min) : null,
        difficulty: form.difficulty || null,
        product_ids: form.product_ids
      }
      if (editing) {
        await api.put(`/api/recipes/${editing.id}`, payload)
        toast.success('Receta actualizada')
      } else {
        await api.post('/api/recipes', payload)
        toast.success('Receta creada')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    try {
      await api.delete(`/api/recipes/${deleteId}`)
      toast.success('Receta eliminada')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recetas</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva receta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando…</div>
        ) : recipes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay recetas.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Receta</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Dificultad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Productos</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {r.cover_image_url ? <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ChefHat size={18} /></div>}
                      </div>
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-xs text-gray-500">/recetas/{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-sm">{r.difficulty || '—'}</td>
                  <td className="px-4 py-3 text-sm">{r.products?.length || 0}</td>
                  <td className="px-4 py-3">
                    {r.is_published ? (
                      <span className="badge bg-green-100 text-green-800">Publicada</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-700">Borrador</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/recetas/${r.slug}`} target="_blank" className="inline-flex p-2 text-gray-500 hover:text-emerald-600" title="Ver">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => openModal(r)} className="p-2 text-gray-500 hover:text-blue-600" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="p-2 text-gray-500 hover:text-red-600" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">{editing ? 'Editar receta' : 'Nueva receta'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resumen</label>
                <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="input" rows={2} maxLength={500} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Imagen de portada (URL)</label>
                  <input type="text" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} className="input" placeholder="/media/recetas/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video (URL opcional)</label>
                  <input type="text" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="input" placeholder="https://youtube.com/..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duración (min)</label>
                  <input type="number" min={1} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dificultad</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input">
                    <option value="">—</option>
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preparación (markdown)</label>
                <textarea value={form.body_markdown} onChange={(e) => setForm({ ...form, body_markdown: e.target.value })} className="input font-mono text-sm" rows={8} placeholder="# Pasos\n1. …" />
              </div>

              {/* Linkear productos */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold mb-2">Productos enlazados</label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Buscar producto por nombre…"
                    className="input pl-9"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  {productResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {productResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addProduct(p)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {p.name} <span className="text-xs text-gray-500">· {p.category_name || '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {linkedProducts.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {linkedProducts.map((id) => (
                      <li key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {productNameOf(id)}
                        <button type="button" onClick={() => removeProduct(id)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No hay productos enlazados todavía.</p>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                <span className="text-sm">Publicada (visible al público)</span>
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar receta?</h3>
            <p className="text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary">Cancelar</button>
              <button onClick={doDelete} className="flex-1 btn bg-red-500 hover:bg-red-600 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Recipes
