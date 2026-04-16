// CRM: listado de clientes con métricas y botón directo a WhatsApp.

import { useEffect, useState } from 'react'
import { Search, MessageCircle, X, User as UserIcon, Package, DollarSign, Calendar } from 'lucide-react'
import { api } from '../../lib/apiClient'

function fmtCOP(n) { return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}` }
function fmtDate(s) { return s ? new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
function initials(name) {
  return String(name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}
function whatsappLink(phone, name) {
  const clean = String(phone || '').replace(/\D/g, '')
  if (!clean) return null
  const intl = clean.startsWith('57') ? clean : `57${clean}`
  const msg = encodeURIComponent(`Hola ${name || ''}, te contactamos de Avisander. `)
  return `https://wa.me/${intl}?text=${msg}`
}

function Customers() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    api.get(`/api/customers?${params}`)
      .then((r) => { setItems(r.items); setTotal(r.total) })
      .catch(() => { setItems([]); setTotal(0) })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-gray-500">{total} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-72 max-w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, email o teléfono…"
            className="input pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {q ? 'No hay clientes que coincidan con tu búsqueda.' : 'Todavía no hay clientes registrados.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-right">Pedidos</th>
                <th className="px-4 py-3 text-right">Gastado</th>
                <th className="px-4 py-3 text-center">1ª compra</th>
                <th className="px-4 py-3 text-right">Puntos</th>
                <th className="px-4 py-3 text-left">Último pedido</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/70 to-primary-dark text-white flex items-center justify-center font-semibold">
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium">{c.name || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500">Desde {fmtDate(c.created_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 truncate max-w-[220px]">{c.email || '—'}</p>
                    <p className="text-xs text-gray-500">{c.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{c.orders_count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{fmtCOP(c.total_spent)}</td>
                  <td className="px-4 py-3 text-center">
                    {c.discounts_used > 0 ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-600">
                        Usada
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${(c.loyalty_balance || 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {c.loyalty_balance || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(c.last_order_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.phone && (
                      <a
                        href={whatsappLink(c.phone, c.name)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <CustomerDetail id={selected.id} onClose={() => setSelected(null)} />}
    </div>
  )
}

function CustomerDetail({ id, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get(`/api/customers/${id}`).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Detalle del cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        {loading ? (
          <div className="p-8 text-center">Cargando…</div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-500">No se pudo cargar.</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/70 to-primary-dark text-white flex items-center justify-center text-xl font-bold">
                {initials(data.name)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{data.name || 'Sin nombre'}</h3>
                <p className="text-sm text-gray-600">{data.email}</p>
                <p className="text-sm text-gray-600">{data.phone || 'Sin teléfono'}</p>
                {data.address && <p className="text-sm text-gray-500 mt-1">📍 {data.address}</p>}
              </div>
              {data.phone && (
                <a
                  href={whatsappLink(data.phone, data.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Package size={16} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xl font-bold">{data.orders_count}</p>
                <p className="text-xs text-gray-500">Pedidos</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign size={16} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-primary">{fmtCOP(data.total_spent)}</p>
                <p className="text-xs text-gray-500">Gastado</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Calendar size={16} className="text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-semibold">{fmtDate(data.last_order_at)}</p>
                <p className="text-xs text-gray-500">Último pedido</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Historial de pedidos</h4>
              {data.orders.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no ha hecho pedidos.</p>
              ) : (
                <div className="space-y-2">
                  {data.orders.map((o) => (
                    <div key={o.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Pedido #{o.id}</p>
                        <p className="text-xs text-gray-500">
                          {fmtDate(o.created_at)} · {o.delivery_method === 'pickup' ? 'Recoge' : 'Domicilio'} · {o.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{fmtCOP(o.total)}</p>
                        <p className="text-xs">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                            o.status === 'completed' ? 'bg-green-100 text-green-800' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{o.status}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Customers
