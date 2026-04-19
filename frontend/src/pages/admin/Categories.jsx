import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react'
import CategoryIcon from '../../components/CategoryIcon'
import { api, apiFetchFormData } from '../../lib/apiClient'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', icon: '', display_order: 0, hero_image: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategories(await api.get('/api/categories'))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (category = null) => {
    setError('')
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        icon: category.icon || '',
        display_order: category.display_order || 0,
        hero_image: category.hero_image || ''
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', icon: '', display_order: categories.length, hero_image: '' })
    }
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const data = await apiFetchFormData('/api/upload/image', fd)
      setFormData((prev) => ({ ...prev, hero_image: data.url }))
    } catch (err) {
      alert(err.message || 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      if (editingCategory) await api.put(url, formData)
      else await api.post(url, formData)
      setShowModal(false)
      fetchCategories()
    } catch (error) {
      setError(error.message || 'Error al guardar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/categories/${id}`)
      setDeleteConfirm(null)
      fetchCategories()
    } catch (error) {
      alert(error.message || 'No se puede eliminar la categoria')
      setDeleteConfirm(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Nueva Categoria
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : categories.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Orden</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Foto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Icono</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-3 text-gray-500">{category.display_order}</td>
                  <td className="px-4 py-3">
                    {category.hero_image ? (
                      <img
                        src={category.hero_image}
                        alt={category.name}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3">
                        <CategoryIcon category={category.name} variant="inline" size="sm" />
                      </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openModal(category)}
                      className="p-2 text-gray-500 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category.id)}
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
          <div className="p-8 text-center text-gray-500">No hay categorias</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
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
                <label className="block text-sm font-medium mb-1">Icono (emoji o codigo)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="input"
                  placeholder="Nombre o icono (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Orden</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Foto de categoría (hero)</label>
                <p className="text-xs text-gray-500 mb-2">
                  Se muestra en las tarjetas destacadas del home. Pega una URL o sube una imagen.
                </p>

                {formData.hero_image ? (
                  <div className="relative mb-2 inline-block">
                    <img
                      src={formData.hero_image}
                      alt="Preview"
                      className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.3'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hero_image: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                      title="Quitar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 mb-2 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    <ImageIcon size={28} />
                  </div>
                )}

                <input
                  type="text"
                  value={formData.hero_image}
                  onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                  className="input"
                  placeholder="https://... (URL de imagen)"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploading ? 'Subiendo...' : 'O subir desde mi equipo'}
                </button>
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
            <h3 className="text-lg font-semibold mb-2">Eliminar categoria?</h3>
            <p className="text-gray-600 mb-4">
              Si hay productos en esta categoria, no se podra eliminar.
            </p>
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
    </div>
  )
}

export default Categories
