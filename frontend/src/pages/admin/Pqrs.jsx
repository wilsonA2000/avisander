import { useEffect, useState } from 'react'
import { MessageSquare, Mail, Phone, CheckCircle2, Clock, Filter, X } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { fmtDateTime } from '../../lib/format'

const TYPE_LABEL = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' }
const TYPE_COLOR = {
  peticion: 'bg-sky-100 text-sky-700',
  queja: 'bg-rose-100 text-rose-700',
  reclamo: 'bg-amber-100 text-amber-700',
  sugerencia: 'bg-emerald-100 text-emerald-700'
}
const STATUS_LABEL = { new: 'Nuevo', in_progress: 'En proceso', resolved: 'Resuelto' }
const STATUS_COLOR = {
  new: 'bg-primary/10 text-primary',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700'
}

function Pqrs() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [notes, setNotes] = useState('')
  const toast = useToast()

  const load = () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (typeFilter) qs.set('type', typeFilter)
    if (statusFilter) qs.set('status', statusFilter)
    api
      .get(`/api/pqrs?${qs}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [typeFilter, statusFilter])

  useEffect(() => {
    setNotes(selected?.admin_notes || '')
  }, [selected?.id])

  const updateStatus = async (status) => {
    if (!selected) return
    try {
      const updated = await api.put(`/api/pqrs/${selected.id}`, { status, admin_notes: notes })
      setSelected(updated)
      load()
      toast.success('Ticket actualizado')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare size={22} /> PQRS
          </h1>
          <p className="text-sm text-gray-500">
            {items.length} ticket{items.length !== 1 ? 's' : ''}
            {(typeFilter || statusFilter) && ' (filtrado)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-auto text-sm py-1.5"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto text-sm py-1.5"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Sin tickets.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Mensaje</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{t.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[t.type]}`}>
                      {TYPE_LABEL[t.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-sm truncate">{t.message}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[selected.type]}`}>
                  {TYPE_LABEL[selected.type]}
                </span>
                <h2 className="text-lg font-semibold">#{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase">De</p>
                <p className="font-medium">{selected.name}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                  <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                    <Mail size={12} /> {selected.email}
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Phone size={12} /> {selected.phone}
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Mensaje</p>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{selected.message}</div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Notas internas</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Anotaciones para el equipo…"
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-gray-600 text-xs">
                  Recibido: {fmtDateTime(selected.created_at)}
                  {selected.resolved_at && <> · Resuelto: {fmtDateTime(selected.resolved_at)}</>}
                </span>
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <button onClick={() => updateStatus('new')} className="btn-outline text-xs">
                  <Clock size={12} className="inline mr-1" />
                  Marcar nuevo
                </button>
                <button onClick={() => updateStatus('in_progress')} className="btn-secondary text-xs">
                  En proceso
                </button>
                <button onClick={() => updateStatus('resolved')} className="btn-primary text-xs">
                  <CheckCircle2 size={12} className="inline mr-1" />
                  Resuelto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pqrs
