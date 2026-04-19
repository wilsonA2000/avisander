import { useEffect, useState } from 'react'
import { Boxes, AlertTriangle, History, Edit3, X, Search, EyeOff, Power } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { fmtDateTime } from '../../lib/format'

function fmt(n, unit = '') {
  const v = Number(n) || 0
  return `${v.toLocaleString('es-CO', { maximumFractionDigits: 2 })}${unit ? ' ' + unit : ''}`
}

const TYPE_LABEL = {
  purchase: 'Compra',
  sale: 'Venta',
  adjustment: 'Ajuste',
  waste: 'Merma',
  return: 'Devolución'
}

function Inventario() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lowOnly, setLowOnly] = useState(false)
  const [q, setQ] = useState('')
  const [kardex, setKardex] = useState(null) // {product, movements}
  const [adjusting, setAdjusting] = useState(null) // product
  const [form, setForm] = useState({ quantity: '', type: 'adjustment', notes: '' })
  const toast = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (lowOnly) params.set('low_stock', '1')
    api
      .get(`/api/inventory?${params}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [lowOnly])

  const filtered = items.filter((p) =>
    !q ? true : p.name.toLowerCase().includes(q.toLowerCase())
  )

  const openKardex = async (product) => {
    try {
      const data = await api.get(`/api/inventory/kardex/${product.id}`)
      setKardex(data)
    } catch (err) {
      toast.error(err.message || 'Error cargando kardex')
    }
  }

  const openAdjust = (product) => {
    setAdjusting(product)
    setForm({ quantity: '', type: 'adjustment', notes: '' })
  }

  const enableAvailability = async (productId) => {
    try {
      await api.patch(`/api/inventory/availability/${productId}`, { is_available: true })
      toast.success('Producto activado para venta')
      setAdjusting((prev) => (prev ? { ...prev, is_available: 1 } : prev))
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo activar el producto')
    }
  }

  const submitAdjust = async (e) => {
    e.preventDefault()
    const qty = Number(form.quantity)
    if (!qty || isNaN(qty)) return toast.warn('Cantidad requerida (positivo o negativo)')
    if (!form.notes.trim()) return toast.warn('Razón del ajuste requerida')
    try {
      await api.post('/api/inventory/adjust', {
        product_id: adjusting.id,
        quantity: qty,
        type: form.type,
        notes: form.notes.trim()
      })
      toast.success('Ajuste registrado')
      setAdjusting(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Error al ajustar')
    }
  }

  const lowCount = items.filter((p) => Number(p.stock) <= Number(p.stock_min)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes size={24} /> Inventario
          </h1>
          <p className="text-sm text-gray-500">
            {items.length} producto{items.length !== 1 ? 's' : ''}
            {lowCount > 0 && (
              <span className="ml-2 text-rose-600 font-medium inline-flex items-center gap-1">
                <AlertTriangle size={12} /> {lowCount} bajo mínimo
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-64"
              placeholder="Buscar producto…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm bg-white px-3 rounded-lg border">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Solo bajo mínimo
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Sin productos.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Cat.</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-right px-4 py-3">Mínimo</th>
                <th className="text-right px-4 py-3">Costo</th>
                <th className="text-left px-4 py-3">Último mov.</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => {
                const low = Number(p.stock) <= Number(p.stock_min)
                return (
                  <tr key={p.id} className={low ? 'bg-rose-50/50' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url && (
                          <img
                            src={p.image_url.startsWith('http') ? p.image_url : p.image_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            {p.name}
                            {Number(p.is_available) === 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200" title="No disponible para venta">
                                <EyeOff size={9} /> No disponible
                              </span>
                            )}
                          </div>
                          {p.barcode && (
                            <div className="text-[10px] text-gray-400 font-mono">{p.barcode}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={low ? 'text-rose-600' : ''}>{fmt(p.stock, p.unit)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(p.stock_min)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {p.cost_price ? `$${Math.round(p.cost_price).toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.last_movement_at ? (
                        <>
                          {TYPE_LABEL[p.last_movement_type] || p.last_movement_type}
                          <div>{fmtDateTime(p.last_movement_at)}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openAdjust(p)}
                        className="p-1.5 text-gray-500 hover:text-primary"
                        title="Ajustar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => openKardex(p)}
                        className="p-1.5 text-gray-500 hover:text-primary"
                        title="Kardex"
                      >
                        <History size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal ajuste */}
      {adjusting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Ajuste manual</h3>
              <button onClick={() => setAdjusting(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitAdjust} className="p-4 space-y-3">
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">{adjusting.name}</div>
                <div>Stock actual: <span className="font-semibold">{fmt(adjusting.stock, adjusting.unit)}</span></div>
              </div>

              {Number(adjusting.is_available) === 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <EyeOff size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 flex-1">
                      <p className="font-semibold mb-0.5">Producto no disponible para venta</p>
                      <p className="text-amber-800">
                        Aunque tenga stock, los clientes no lo verán en el catálogo. Actívalo si quieres venderlo ahora.
                      </p>
                      <button
                        type="button"
                        onClick={() => enableAvailability(adjusting.id)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Power size={12} /> Activar disponibilidad
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">Cantidad (positivo suma, negativo resta)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tipo</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="adjustment">Corrección / inventario inicial</option>
                  <option value="waste">Merma / caducidad</option>
                  <option value="return">Devolución</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Razón *</label>
                <textarea
                  className="input"
                  rows={2}
                  required
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdjusting(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal kardex */}
      {kardex && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Kardex — {kardex.product.name}</h3>
                <p className="text-sm text-gray-500">Stock actual: {fmt(kardex.product.stock)}</p>
              </div>
              <button onClick={() => setKardex(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2">Fecha</th>
                    <th className="text-left px-4 py-2">Tipo</th>
                    <th className="text-right px-4 py-2">Cantidad</th>
                    <th className="text-right px-4 py-2">Saldo</th>
                    <th className="text-left px-4 py-2">Nota</th>
                    <th className="text-left px-4 py-2">Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kardex.movements.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {fmtDateTime(m.created_at)}
                      </td>
                      <td className="px-4 py-2">{TYPE_LABEL[m.type] || m.type}</td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {m.quantity > 0 ? '+' : ''}
                        {fmt(m.quantity)}
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(m.balance_after)}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{m.notes || '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{m.user_name || '—'}</td>
                    </tr>
                  ))}
                  {kardex.movements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        Sin movimientos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventario
