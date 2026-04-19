import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, Plus, X, Package, CheckCircle2, DollarSign, Trash2, Eye } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { fmtDate } from '../../lib/format'
import ConfirmDialog from '../../components/ConfirmDialog'

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

const STATUS = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  received: { label: 'Recibida', color: 'bg-emerald-100 text-emerald-700' },
  paid: { label: 'Pagada', color: 'bg-sky-100 text-sky-700' },
  cancelled: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700' }
}

function Compras() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  const [draft, setDraft] = useState({
    supplier_id: '',
    reference: '',
    notes: '',
    items: []
  })
  const [productPick, setProductPick] = useState({ product_id: '', quantity: '', unit_cost: '' })

  const toast = useToast()

  const load = () => {
    setLoading(true)
    api
      .get('/api/purchases')
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/api/suppliers').then(setSuppliers).catch(() => {})
    api.get('/api/products').then((r) => setProducts(Array.isArray(r) ? r : r.items || [])).catch(() => {})
  }, [])

  const draftTotal = useMemo(
    () => draft.items.reduce((acc, it) => acc + it.quantity * it.unit_cost, 0),
    [draft.items]
  )

  const addItem = () => {
    const pid = Number(productPick.product_id)
    const qty = Number(productPick.quantity)
    const cost = Number(productPick.unit_cost)
    if (!pid || !qty || qty <= 0 || cost < 0) {
      return toast.warn('Selecciona producto, cantidad y costo válidos')
    }
    const prod = products.find((p) => p.id === pid)
    setDraft({
      ...draft,
      items: [
        ...draft.items,
        { product_id: pid, product_name: prod?.name || `#${pid}`, quantity: qty, unit_cost: cost }
      ]
    })
    setProductPick({ product_id: '', quantity: '', unit_cost: '' })
  }

  const removeItem = (idx) => {
    setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) })
  }

  const submitDraft = async (e) => {
    e.preventDefault()
    if (draft.items.length === 0) return toast.warn('Agrega al menos un item')
    try {
      await api.post('/api/purchases', {
        supplier_id: draft.supplier_id ? Number(draft.supplier_id) : null,
        reference: draft.reference || null,
        notes: draft.notes || null,
        items: draft.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost
        }))
      })
      toast.success('Compra creada como borrador')
      setCreating(false)
      setDraft({ supplier_id: '', reference: '', notes: '', items: [] })
      load()
    } catch (err) {
      toast.error(err.message || 'Error al crear compra')
    }
  }

  const [pendingReceive, setPendingReceive] = useState(null) // purchase completa
  const [savingReceive, setSavingReceive] = useState(false)

  const requestReceive = (purchase) => {
    setPendingReceive(purchase)
  }

  const confirmReceive = async () => {
    if (!pendingReceive) return
    setSavingReceive(true)
    try {
      await api.post(`/api/purchases/${pendingReceive.id}/receive`)
      toast.success('Compra recibida, stock actualizado')
      load()
      if (viewing?.id === pendingReceive.id) {
        const d = await api.get(`/api/purchases/${pendingReceive.id}`)
        setViewing(d)
      }
      setPendingReceive(null)
    } catch (err) {
      toast.error(err.message || 'Error')
    } finally {
      setSavingReceive(false)
    }
  }

  const pay = async (id) => {
    try {
      await api.post(`/api/purchases/${id}/pay`)
      toast.success('Compra marcada como pagada')
      load()
    } catch (err) {
      toast.error(err.message || 'Error')
    }
  }

  const open = async (id) => {
    try {
      const d = await api.get(`/api/purchases/${id}`)
      setViewing(d)
    } catch (err) {
      toast.error(err.message || 'Error')
    }
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar / cancelar esta compra?')) return
    try {
      await api.delete(`/api/purchases/${id}`)
      toast.info('Compra eliminada/cancelada')
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
            <ShoppingBag size={24} /> Compras
          </h1>
          <p className="text-sm text-gray-500">{list.length} compra{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Nueva compra
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Sin compras registradas.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Proveedor</th>
                <th className="text-left px-4 py-3">Ref.</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => {
                const s = STATUS[p.status] || STATUS.draft
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                    <td className="px-4 py-3">{p.supplier_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.reference || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{p.items_count}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCOP(p.total)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {fmtDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => open(p.id)} className="p-1.5 text-gray-500 hover:text-primary" title="Ver">
                        <Eye size={16} />
                      </button>
                      {p.status === 'draft' && (
                        <button
                          onClick={() => requestReceive(p)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600"
                          title="Marcar recibida"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {p.status === 'received' && (
                        <button
                          onClick={() => pay(p.id)}
                          className="p-1.5 text-gray-500 hover:text-sky-600"
                          title="Marcar pagada"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nueva compra */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Nueva compra</h3>
              <button onClick={() => setCreating(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitDraft} className="p-4 space-y-4 overflow-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Proveedor</label>
                  <select
                    className="input"
                    value={draft.supplier_id}
                    onChange={(e) => setDraft({ ...draft, supplier_id: e.target.value })}
                  >
                    <option value="">— Sin proveedor —</option>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Referencia (factura)</label>
                  <input
                    className="input"
                    value={draft.reference}
                    onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Notas</label>
                <textarea
                  className="input"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Package size={16} /> Items
                </h4>
                <div className="grid grid-cols-[1fr_100px_130px_auto] gap-2 mb-2">
                  <select
                    className="input"
                    value={productPick.product_id}
                    onChange={(e) => setProductPick({ ...productPick, product_id: e.target.value })}
                  >
                    <option value="">— Elegir producto —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="Cantidad"
                    value={productPick.quantity}
                    onChange={(e) => setProductPick({ ...productPick, quantity: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    step="1"
                    placeholder="Costo unit."
                    value={productPick.unit_cost}
                    onChange={(e) => setProductPick({ ...productPick, unit_cost: e.target.value })}
                  />
                  <button type="button" onClick={addItem} className="btn-secondary px-3">
                    <Plus size={16} />
                  </button>
                </div>

                {draft.items.length > 0 && (
                  <table className="w-full text-sm border-t">
                    <tbody className="divide-y">
                      {draft.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2">{it.product_name}</td>
                          <td className="py-2 text-right w-20">{it.quantity}</td>
                          <td className="py-2 text-right w-28">{fmtCOP(it.unit_cost)}</td>
                          <td className="py-2 text-right w-32 font-medium">
                            {fmtCOP(it.quantity * it.unit_cost)}
                          </td>
                          <td className="py-2 pl-2">
                            <button
                              type="button"
                              onClick={() => removeItem(i)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 font-semibold bg-gray-50">
                        <td className="py-2">TOTAL</td>
                        <td></td>
                        <td></td>
                        <td className="py-2 text-right">{fmtCOP(draftTotal)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setCreating(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={draft.items.length === 0}>
                  Guardar borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ver compra */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  Compra #{viewing.id}{' '}
                  <span
                    className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      (STATUS[viewing.status] || STATUS.draft).color
                    }`}
                  >
                    {(STATUS[viewing.status] || STATUS.draft).label}
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  {viewing.supplier_name || 'Sin proveedor'} · {viewing.reference || 'sin referencia'}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-right px-3 py-2">Cant.</th>
                    <th className="text-right px-3 py-2">Costo unit.</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(viewing.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2">{it.product_name || `#${it.product_id}`}</td>
                      <td className="px-3 py-2 text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmtCOP(it.unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmtCOP(it.subtotal)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold bg-gray-50">
                    <td className="px-3 py-2">TOTAL</td>
                    <td></td>
                    <td></td>
                    <td className="px-3 py-2 text-right">{fmtCOP(viewing.total)}</td>
                  </tr>
                </tbody>
              </table>
              {viewing.notes && (
                <div className="mt-3 text-sm bg-gray-50 p-3 rounded">
                  <strong>Notas:</strong> {viewing.notes}
                </div>
              )}
            </div>
            {viewing.status === 'draft' && (
              <div className="p-4 border-t flex justify-end gap-2">
                <button onClick={() => requestReceive(viewing)} className="btn-primary inline-flex items-center gap-2">
                  <CheckCircle2 size={16} /> Marcar recibida
                </button>
              </div>
            )}
            {viewing.status === 'received' && (
              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => pay(viewing.id)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <DollarSign size={16} /> Marcar pagada
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingReceive}
        title={`Recibir compra #${pendingReceive?.id || ''}`}
        confirmLabel="Sí, recibir y sumar al stock"
        loading={savingReceive}
        changes={pendingReceive ? [
          { label: 'Proveedor', from: '', to: pendingReceive.supplier_name || '—' },
          { label: 'Items', from: '', to: String(pendingReceive.items_count ?? '—') },
          { label: 'Total', from: '', to: fmtCOP(pendingReceive.total) }
        ] : []}
        message="Al confirmar se sumará al stock de cada producto la cantidad de esta compra y se registrará en el kardex. No es reversible."
        onConfirm={confirmReceive}
        onCancel={() => setPendingReceive(null)}
      />
    </div>
  )
}

export default Compras
