import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', icon: '', display_order: 0 })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setCategories(await response.json())
      }
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
        display_order: category.display_order || 0
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', icon: '', display_order: categories.length })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        fetchCategories()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar')
      }
    } catch (error) {
      setError('Error al guardar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        setDeleteConfirm(null)
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'No se puede eliminar la categoria')
        setDeleteConfirm(null)
      }
    } catch (error) {
      alert('Error al eliminar')
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Icono</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t">
                  <td className="px-4 py-3 text-gray-500">{category.display_order}</td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-gray-500">{category.icon || '-'}</td>
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
                  placeholder="🥩"
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
