import { useEffect, useState } from 'react'
import { Plus, Truck, Pencil, Trash2, X, Phone, Mail, MapPin } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

const EMPTY = {
  name: '',
  nit: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  is_active: true
}

function Proveedores() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { ...data } o 'new' o null
  const toast = useToast()

  const load = () => {
    setLoading(true)
    api
      .get('/api/suppliers')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async (e) => {
    e.preventDefault()
    const form = editing
    try {
      if (form.id) {
        await api.put(`/api/suppliers/${form.id}`, form)
        toast.success('Proveedor actualizado')
      } else {
        await api.post('/api/suppliers', form)
        toast.success('Proveedor creado')
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Error al guardar')
    }
  }

  const remove = async (id, name) => {
    if (!confirm(`¿Eliminar/desactivar "${name}"?`)) return
    try {
      await api.delete(`/api/suppliers/${id}`)
      toast.info('Proveedor eliminado')
      load()
    } catch (err) {
      toast.error(err.message || 'Error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck size={24} /> Proveedores
          </h1>
          <p className="text-sm text-gray-500">{items.length} proveedor{items.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Sin proveedores. Crea el primero con el botón de arriba.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Proveedor</th>
                <th className="text-left px-4 py-3">NIT</th>
                <th className="text-left px-4 py-3">Contacto</th>
                <th className="text-right px-4 py-3">#Compras</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((s) => (
                <tr key={s.id} className={s.is_active ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    {s.address && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {s.address}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.nit || '—'}</td>
                  <td className="px-4 py-3">
                    <div>{s.contact_name || '—'}</div>
                    <div className="text-xs text-gray-500 flex gap-2">
                      {s.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={10} />
                          {s.phone}
                        </span>
                      )}
                      {s.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={10} />
                          {s.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{s.purchases_count}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtCOP(s.total_purchased)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing({ ...s, is_active: !!s.is_active })}
                      className="p-1.5 text-gray-500 hover:text-primary"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => remove(s.id, s.name)}
                      className="p-1.5 text-gray-500 hover:text-rose-600"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editing.id ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nombre *</label>
                <input
                  className="input"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">NIT</label>
                  <input
                    className="input"
                    value={editing.nit || ''}
                    onChange={(e) => setEditing({ ...editing, nit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Teléfono</label>
                  <input
                    className="input"
                    value={editing.phone || ''}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Contacto (persona)</label>
                <input
                  className="input"
                  value={editing.contact_name || ''}
                  onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  className="input"
                  value={editing.email || ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Dirección</label>
                <input
                  className="input"
                  value={editing.address || ''}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Notas</label>
                <textarea
                  className="input"
                  rows={2}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Activo
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores
