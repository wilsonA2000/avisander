import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Upload, Eye, Search, Download, CheckSquare, Square } from 'lucide-react'
import Pagination from '../../components/Pagination'
import { CULINARY_USES, CULINARY_USE_SLUGS } from '../../components/CulinaryIcon'
import { api, apiFetchFormData } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../../components/ConfirmDialog'

const PER_PAGE = 25

function Products() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Filtros y paginación leídos de la URL
  const q = searchParams.get('q') || ''
  const categoryFilter = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page')) || 1

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null) next.delete(k)
      else next.set(k, v)
    }
    // Cambios de filtro resetean a page 1
    if ('q' in patch || 'category' in patch || 'sort' in patch) next.delete('page')
    setSearchParams(next)
  }

  const [searchInput, setSearchInput] = useState(q)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) updateParams({ q: searchInput })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])
  useEffect(() => { setSearchInput(q) }, [q])
  const emptyForm = {
    name: '',
    description: '',
    sale_type: 'fixed',
    price: '',
    price_per_kg: '',
    original_price: '',
    unit: 'kg',
    brand: '',
    reference: '',
    packaging: '',
    cold_chain: 'refrigerado',
    ingredients: '',
    category_id: '',
    is_available: true,
    is_featured: false,
    is_on_sale: false,
    image_url: '',
    gallery_urls: [],
    video_url: '',
    barcode: '',
    stock_min: '',
    benefits: '',
    culinary_uses: []
  }
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileInputRef = useRef(null)

  useEffect(() => { fetchData() }, [q, categoryFilter, sort, page])
  useEffect(() => { fetchCategories() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (categoryFilter) params.set('category', categoryFilter)
      if (sort) params.set('sort', sort)
      params.set('page', page)
      params.set('per_page', PER_PAGE)
      params.set('include_unavailable', '1')

      const data = await api.get(`/api/products?${params.toString()}`)
      if (Array.isArray(data)) {
        setProducts(data)
        setTotal(data.length)
      } else {
        setProducts(data.items || [])
        setTotal(data.total || 0)
      }
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch (_e) {}
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === products.length) return new Set()
      return new Set(products.map((p) => p.id))
    })
  }

  const bulkAction = async (action) => {
    if (selectedIds.size === 0) return
    const ids = [...selectedIds]
    const labels = { delete: 'eliminar', available: 'marcar disponibles', unavailable: 'marcar agotados' }
    if (!confirm(`¿${labels[action]} ${ids.length} producto(s)?`)) return
    setBulkProcessing(true)
    try {
      if (action === 'delete') {
        await Promise.all(ids.map((id) => api.delete(`/api/products/${id}`)))
      } else {
        const is_available = action === 'available'
        await Promise.all(ids.map((id) => api.put(`/api/products/${id}`, { is_available })))
      }
      setMessage({ type: 'success', text: `${ids.length} producto(s) actualizado(s).` })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
      fetchData()
    } catch (e) {
      setMessage({ type: 'error', text: 'Error en acción en lote' })
    } finally {
      setBulkProcessing(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['id', 'nombre', 'categoria', 'precio', 'unidad', 'sale_type', 'disponible', 'marca'],
      ...products.map((p) => [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.category_name || '',
        p.sale_type === 'by_weight' ? p.price_per_kg : p.price,
        p.sale_type === 'by_weight' ? 'kg' : p.unit || '',
        p.sale_type || 'fixed',
        p.is_available ? '1' : '0',
        p.brand || ''
      ])
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos-avisander-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        sale_type: product.sale_type || 'fixed',
        price: product.price?.toString() || '',
        price_per_kg: product.price_per_kg?.toString() || '',
        original_price: product.original_price?.toString() || '',
        unit: product.unit || 'kg',
        brand: product.brand || '',
        reference: product.reference || '',
        packaging: product.packaging || '',
        cold_chain: product.cold_chain || 'refrigerado',
        ingredients: product.ingredients || '',
        category_id: product.category_id?.toString() || '',
        is_available: product.is_available !== false,
        is_featured: product.is_featured || false,
        is_on_sale: product.is_on_sale || false,
        image_url: product.image_url || '',
        gallery_urls: Array.isArray(product.gallery_urls) ? product.gallery_urls : [],
        video_url: product.video_url || '',
        barcode: product.barcode || '',
        stock_min: product.stock_min != null ? String(product.stock_min) : '',
        benefits: product.benefits || '',
        culinary_uses: Array.isArray(product.culinary_uses) ? product.culinary_uses : []
      })
    } else {
      setEditingProduct(null)
      setFormData(emptyForm)
    }
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)
      const data = await apiFetchFormData('/api/upload/image', formDataUpload)
      setFormData(prev => ({ ...prev, image_url: data.url }))
    } catch (error) {
      toast.error(error.message || 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  // Estado del modal de confirmación al editar producto existente. Al crear
  // no se pide confirmación: es menos crítico. Al editar sí: un error de
  // precio en prod puede afectar ventas en curso.
  const [pendingProductSave, setPendingProductSave] = useState(null)

  const fmtMoney = (v) => (v == null || v === '' ? '—' : `$${Number(v).toLocaleString('es-CO')}`)

  // Devuelve lista de cambios relevantes entre editingProduct y formData.
  const computeProductChanges = () => {
    if (!editingProduct) return []
    const diffs = []
    const price = formData.price ? parseFloat(formData.price) : 0
    const ppk = formData.price_per_kg ? parseFloat(formData.price_per_kg) : 0
    if (formData.sale_type === 'by_weight') {
      if (Number(editingProduct.price_per_kg || 0) !== ppk) {
        diffs.push({ label: 'Precio/kg', from: fmtMoney(editingProduct.price_per_kg), to: fmtMoney(ppk) })
      }
    } else {
      if (Number(editingProduct.price || 0) !== price) {
        diffs.push({ label: 'Precio', from: fmtMoney(editingProduct.price), to: fmtMoney(price) })
      }
    }
    const origNew = formData.original_price ? parseFloat(formData.original_price) : null
    if (Number(editingProduct.original_price || 0) !== Number(origNew || 0)) {
      diffs.push({ label: 'Precio original', from: fmtMoney(editingProduct.original_price), to: fmtMoney(origNew) })
    }
    if (!!editingProduct.is_available !== !!formData.is_available) {
      diffs.push({ label: 'Disponible', from: editingProduct.is_available ? 'Sí' : 'No', to: formData.is_available ? 'Sí' : 'No' })
    }
    if ((editingProduct.name || '').trim() !== formData.name.trim()) {
      diffs.push({ label: 'Nombre', from: editingProduct.name, to: formData.name })
    }
    return diffs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate whitespace-only input
    if (!formData.name.trim()) {
      toast.warn('El nombre del producto es requerido')
      return
    }
    if (formData.sale_type === 'by_weight') {
      if (!formData.price_per_kg || parseFloat(formData.price_per_kg) <= 0) {
        toast.warn('El precio por kg debe ser mayor a 0')
        return
      }
    } else if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.warn('El precio debe ser mayor a 0')
      return
    }

    // Si es edición, mostramos diff y confirmamos. Si es creación, saltamos
    // directo al guardado (menos fricción para la cajera agregando stock).
    if (editingProduct) {
      const diffs = computeProductChanges()
      if (diffs.length === 0) {
        // Nada cambió visiblemente; guardamos en silencio (puede haber cambios
        // en gallery, descripción, etc. que no mostramos en el diff).
        return doSave()
      }
      setPendingProductSave({ diffs })
      return
    }
    await doSave()
  }

  const doSave = async () => {
    setSaving(true)

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'

      const isWeight = formData.sale_type === 'by_weight'
      const payload = {
        ...formData,
        sale_type: formData.sale_type,
        price: isWeight
          ? (formData.price_per_kg ? parseFloat(formData.price_per_kg) : 0)
          : (formData.price ? parseFloat(formData.price) : 0),
        price_per_kg: isWeight && formData.price_per_kg ? parseFloat(formData.price_per_kg) : null,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        image_url: formData.image_url || null,
        gallery_urls: formData.gallery_urls?.length ? formData.gallery_urls : null,
        video_url: formData.video_url || null,
        unit: isWeight ? 'kg' : formData.unit,
        brand: formData.brand?.trim() || null,
        reference: formData.reference?.trim() || null,
        packaging: formData.packaging?.trim() || null,
        cold_chain: formData.cold_chain || 'refrigerado',
        ingredients: formData.ingredients?.trim() || null,
        barcode: formData.barcode?.trim() || null,
        stock_min: formData.stock_min !== '' ? parseFloat(formData.stock_min) : 0,
        benefits: formData.benefits?.trim() || null,
        culinary_uses: Array.isArray(formData.culinary_uses) ? formData.culinary_uses : []
      }

      if (editingProduct) await api.put(url, payload)
      else await api.post(url, payload)
      setShowModal(false)
      setPendingProductSave(null)
      setMessage({
        type: 'success',
        text: editingProduct ? 'Producto actualizado correctamente' : 'Producto creado correctamente'
      })
      fetchData()
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar producto' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`)
      setDeleteConfirm(null)
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Agregar Producto
        </button>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Toolbar: búsqueda, filtros, sort, export */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, marca…"
            className="input pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => updateParams({ category: e.target.value })}
          className="input w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="input w-auto"
        >
          <option value="newest">Más recientes</option>
          <option value="name_asc">Nombre A–Z</option>
          <option value="name_desc">Nombre Z–A</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
        </select>
        <button
          onClick={exportCSV}
          className="btn-secondary flex items-center gap-2 text-sm"
          title="Exportar productos actuales a CSV"
        >
          <Download size={14} /> CSV
        </button>
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {loading ? 'Cargando…' : (
            <><strong>{total}</strong> resultado{total !== 1 ? 's' : ''}</>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-primary flex-1">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button disabled={bulkProcessing} onClick={() => bulkAction('available')} className="btn-secondary text-xs">
            Marcar disponibles
          </button>
          <button disabled={bulkProcessing} onClick={() => bulkAction('unavailable')} className="btn-secondary text-xs">
            Marcar agotados
          </button>
          <button disabled={bulkProcessing} onClick={() => bulkAction('delete')} className="btn text-xs bg-red-500 hover:bg-red-600 text-white">
            Eliminar
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-600 underline">
            Limpiar
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : products.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-primary" aria-label="Seleccionar todos">
                    {selectedIds.size === products.length && products.length > 0
                      ? <CheckSquare size={16} className="text-primary" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Precio</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={`border-t ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleSelect(product.id)}
                      className="text-gray-400 hover:text-primary"
                      aria-label="Seleccionar"
                    >
                      {selectedIds.has(product.id)
                        ? <CheckSquare size={16} className="text-primary" />
                        : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        {product.image_url && (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category_name || 'Sin categoria'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      ${Number(product.sale_type === 'by_weight' ? product.price_per_kg : product.price).toLocaleString('es-CO')}
                      /{product.sale_type === 'by_weight' ? 'kg' : product.unit}
                    </p>
                    {!!product.is_on_sale && product.original_price && (
                      <p className="text-sm text-gray-400 line-through">
                        ${product.original_price.toLocaleString('es-CO')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const stock = Number(product.stock) || 0
                      const min = Number(product.stock_min) || 0
                      const low = stock <= min
                      return (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            stock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : low
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                          title={`Mínimo: ${min}`}
                        >
                          {stock.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.is_available ? (
                        <span className="badge bg-green-100 text-green-800">Disponible</span>
                      ) : (
                        <span className="badge bg-red-100 text-red-800">Agotado</span>
                      )}
                      {product.sale_type === 'by_weight' && (
                        <span className="badge bg-amber-100 text-amber-800">Por peso</span>
                      )}
                      {product.is_featured && (
                        <span className="badge bg-blue-100 text-blue-800">Destacado</span>
                      )}
                      {!!product.is_on_sale && (
                        <span className="badge bg-yellow-100 text-yellow-800">Oferta</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/producto/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-2 text-gray-500 hover:text-emerald-600"
                      title="Ver detalle (cómo lo ve el cliente)"
                    >
                      <Eye size={18} />
                    </Link>
                    <button
                      onClick={() => openModal(product)}
                      className="p-2 text-gray-500 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-2 text-gray-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No hay productos</div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              updateParams({ page: p > 1 ? p : '' })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripcion</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <div className="flex items-center gap-4">
                  {formData.image_url ? (
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      <Upload size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn-secondary text-sm"
                    >
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="ml-2 text-red-500 text-sm hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      También puedes asignar fotos desde <a href="/admin/biblioteca" target="_blank" rel="noreferrer" className="text-primary underline">la biblioteca</a>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Galería */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Galería <span className="text-gray-400 font-normal">({formData.gallery_urls?.length || 0}/8)</span>
                </label>
                {formData.gallery_urls?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.gallery_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
                        <img src={url} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            gallery_urls: formData.gallery_urls.filter((_, i) => i !== idx)
                          })}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Quitar de galería"
                        >
                          <X size={12} />
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...formData.gallery_urls]
                              ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
                              setFormData({ ...formData, gallery_urls: arr })
                            }}
                            className="absolute bottom-1 left-1 bg-white/90 text-gray-700 rounded px-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Mover a la izquierda"
                          >
                            ←
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Sin imágenes adicionales. Agrega fotos desde{' '}
                    <a href="/admin/biblioteca" target="_blank" rel="noreferrer" className="text-primary underline">
                      la biblioteca
                    </a>{' '}(opción "+ Galería").
                  </p>
                )}
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-medium mb-1">Video del producto</label>
                {formData.video_url ? (
                  <div className="flex items-center gap-3">
                    <video src={formData.video_url} className="w-24 h-24 object-cover rounded bg-black" muted preload="metadata" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate" title={formData.video_url}>{formData.video_url}</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, video_url: '' })}
                        className="text-red-500 text-sm hover:underline mt-1"
                      >
                        Quitar video
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Sin video. Asígnalo desde{' '}
                    <a href="/admin/biblioteca?type=video" target="_blank" rel="noreferrer" className="text-primary underline">
                      la biblioteca de videos
                    </a>.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de venta *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`border rounded-lg p-3 cursor-pointer text-sm ${
                    formData.sale_type === 'fixed' ? 'border-primary bg-red-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="sale_type"
                      value="fixed"
                      checked={formData.sale_type === 'fixed'}
                      onChange={() => setFormData({ ...formData, sale_type: 'fixed' })}
                      className="mr-2"
                    />
                    <strong>Bandeja / pieza</strong>
                    <p className="text-xs text-gray-500 mt-1">Precio fijo total</p>
                  </label>
                  <label className={`border rounded-lg p-3 cursor-pointer text-sm ${
                    formData.sale_type === 'by_weight' ? 'border-primary bg-red-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="sale_type"
                      value="by_weight"
                      checked={formData.sale_type === 'by_weight'}
                      onChange={() => setFormData({ ...formData, sale_type: 'by_weight' })}
                      className="mr-2"
                    />
                    <strong>Por peso</strong>
                    <p className="text-xs text-gray-500 mt-1">Cliente pide gramos</p>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.sale_type === 'by_weight' ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Precio por kg *</label>
                    <input
                      type="number"
                      value={formData.price_per_kg}
                      onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                      className="input"
                      required
                      min="100"
                      max="10000000"
                      step="100"
                      placeholder="Ej: 35000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El cliente verá este precio /kg y podrá pedir cualquier cantidad de gramos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Precio *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input"
                        required
                        min="100"
                        max="10000000"
                        step="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Precio Original</label>
                      <input
                        type="number"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        className="input"
                        min="0"
                        max="10000000"
                        step="100"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input"
                    disabled={formData.sale_type === 'by_weight'}
                  >
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="lb">Libra (lb)</option>
                    <option value="unidad">Unidad</option>
                    <option value="paquete">Paquete</option>
                    <option value="bandeja">Bandeja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Sin categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Información del producto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Marca</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="input"
                      placeholder="Ej: Avisander Premium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Referencia / SKU</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="input"
                      placeholder="Ej: LRP-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Empaque</label>
                    <input
                      type="text"
                      value={formData.packaging}
                      onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                      className="input"
                      placeholder="Ej: Bandeja al vacío 500 g"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cadena de frío</label>
                    <select
                      value={formData.cold_chain}
                      onChange={(e) => setFormData({ ...formData, cold_chain: e.target.value })}
                      className="input"
                    >
                      <option value="refrigerado">Refrigerado</option>
                      <option value="congelado">Congelado</option>
                      <option value="ambiente">Temperatura ambiente</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Ingredientes / información nutricional <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Ej: 100% carne de res sin aditivos. Conservar entre 0–4 °C."
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Código de barras <span className="text-gray-400 font-normal">(EAN/GTIN)</span>
                    </label>
                    <input
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="input font-mono"
                      placeholder="7701234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Stock mínimo <span className="text-gray-400 font-normal">(alerta)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stock_min}
                      onChange={(e) => setFormData({ ...formData, stock_min: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                  {editingProduct && (
                    <div className="col-span-2 text-xs text-gray-500">
                      Stock actual:{' '}
                      <strong>
                        {Number(editingProduct.stock || 0).toLocaleString('es-CO', {
                          maximumFractionDigits: 2
                        })}
                      </strong>{' '}
                      — para modificarlo usa{' '}
                      <a href="/admin/inventario" target="_blank" className="text-primary underline">
                        /admin/inventario
                      </a>{' '}
                      o registra una compra.
                    </div>
                  )}
                </div>
              </div>

              {/* Bondades y usos culinarios */}
              <div className="border-t pt-4 mt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bondades nutricionales <span className="text-gray-400 font-normal">(se muestra en el detalle público)</span>
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="input"
                    rows={5}
                    placeholder="Descripción breve de aportes nutricionales, vitaminas y recomendación de consumo..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Soporta Markdown básico: **negrita**, listas con "-", saltos de línea.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Usos culinarios sugeridos
                    <span className="text-gray-400 font-normal"> (pulsa para activar/desactivar)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CULINARY_USE_SLUGS.map((slug) => {
                      const active = formData.culinary_uses.includes(slug)
                      const use = CULINARY_USES[slug]
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => {
                            setFormData((f) => ({
                              ...f,
                              culinary_uses: active
                                ? f.culinary_uses.filter((s) => s !== slug)
                                : [...f.culinary_uses, slug]
                            }))
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                            active
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-lg leading-none">{use.emoji}</span>
                          {use.label}
                        </button>
                      )
                    })}
                  </div>
                  {formData.culinary_uses.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.culinary_uses.length} uso{formData.culinary_uses.length !== 1 ? 's' : ''} seleccionado{formData.culinary_uses.length !== 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 border-t pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  />
                  <span>Disponible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <span>Destacado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_on_sale}
                    onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })}
                  />
                  <span>En oferta</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Eliminar producto?</h3>
            <p className="text-gray-600 mb-4">Esta accion no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 btn bg-red-500 hover:bg-red-600 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingProductSave}
        title={`Confirmar cambios — ${editingProduct?.name || ''}`}
        confirmLabel="Sí, guardar cambios"
        loading={saving}
        changes={pendingProductSave?.diffs || []}
        message={pendingProductSave?.diffs?.some((d) => d.label === 'Precio' || d.label === 'Precio/kg')
          ? 'Los clientes con el producto ya en su carrito verán un aviso y el carrito se actualizará al intentar pagar.'
          : null}
        onConfirm={doSave}
        onCancel={() => setPendingProductSave(null)}
      />
    </div>
  )
}

export default Products
