import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  X,
  Search,
  Printer,
  Download,
  Filter,
  Truck,
  Store,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { api } from '../../lib/apiClient'
import { fmtCOP, fmtDateTime } from '../../lib/format'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}
const STATUS_LABEL = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}
const PAYMENT_LABEL = { bold: 'Bold', whatsapp: 'WhatsApp', cash: 'Efectivo' }
const PAYMENT_STATUS = {
  approved: { label: 'Aprobado', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  declined: { label: 'Rechazado', icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'text-rose-600 bg-rose-50' }
}

function printOrder(order) {
  const win = window.open('', '_blank', 'width=700,height=900')
  if (!win) return
  const rows = (order.items || [])
    .map((it, i) => {
      const qty =
        it.sale_type === 'by_weight' ? `${it.weight_grams} g` : `${it.quantity} und`
      const notes = it.notes ? `<br/><span class="note">Obs: ${it.notes}</span>` : ''
      return `
        <tr>
          <td class="n">${String(i + 1).padStart(2, '0')}</td>
          <td class="p">${it.product_name}${notes}</td>
          <td class="q">${qty}</td>
          <td class="u">${fmtCOP(it.unit_price)}</td>
          <td class="s">${fmtCOP(it.subtotal)}</td>
        </tr>`
    })
    .join('')
  const subtotal = (order.total || 0) - (order.delivery_cost || 0)
  const delivery = order.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Domicilio'
  const payStatus = order.payment_status
    ? `<span class="badge badge-${order.payment_status}">${order.payment_status.toUpperCase()}</span>`
    : ''

  win.document.write(`<!doctype html><html lang="es"><head>
    <meta charset="utf-8" />
    <title>Orden de pedido #${order.id} · Avisander</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box}
      body{font-family:Inter,system-ui,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#1A1A1A;background:#FFFAF3}
      .header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-radius:16px;background:linear-gradient(135deg,#F58220 0%,#D86E12 100%);color:#fff;margin-bottom:18px;box-shadow:0 8px 24px -8px rgba(245,130,32,0.4)}
      .brand{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;letter-spacing:0.5px;line-height:1}
      .brand small{display:block;font-family:Inter,sans-serif;font-size:10px;font-weight:500;opacity:0.9;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
      .order-id{text-align:right}
      .order-id .label{font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.9}
      .order-id .num{font-family:'Playfair Display',serif;font-size:28px;font-weight:900}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#fff;border:1px solid #F0E8DC;border-radius:12px;padding:14px 18px;margin-bottom:16px;font-size:12px}
      .meta .k{color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-size:10px;margin-bottom:2px}
      .meta .v{color:#1A1A1A;font-weight:500}
      .meta strong{display:block}
      h2{font-family:'Playfair Display',serif;font-size:14px;color:#F58220;text-transform:uppercase;letter-spacing:2px;margin:18px 0 8px}
      table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
      thead{background:#0A0A0A;color:#fff}
      th{text-align:left;padding:10px 12px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px}
      td{padding:10px 12px;font-size:12px;border-bottom:1px solid #F0E8DC}
      tr:last-child td{border-bottom:none}
      .n{color:#9ca3af;font-family:monospace;width:30px}
      .p{color:#1A1A1A;font-weight:500}
      .q{color:#6b7280;width:70px}
      .u{color:#6b7280;width:80px;text-align:right}
      .s{text-align:right;font-weight:700;color:#0A0A0A;width:100px}
      .note{color:#9a7741;font-style:italic;font-size:11px}
      th.u,th.s{text-align:right}
      .totals{background:#fff;border:1px solid #F0E8DC;border-radius:12px;padding:14px 18px;margin-top:14px}
      .totals .row{display:flex;justify-content:space-between;padding:4px 0;color:#4b5563;font-size:13px}
      .totals .final{border-top:2px dashed #F58220;margin-top:8px;padding-top:10px;font-family:'Playfair Display',serif;font-weight:900;font-size:20px;color:#F58220}
      .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:1px;margin-left:6px}
      .badge-approved{background:#dcfce7;color:#166534}
      .badge-pending{background:#fef3c7;color:#92400e}
      .badge-declined,.badge-rejected{background:#fee2e2;color:#991b1b}
      .footer{margin-top:22px;padding-top:14px;border-top:1px solid #F0E8DC;text-align:center;color:#6b7280;font-size:11px;line-height:1.6}
      .footer .stamp{font-family:'Playfair Display',serif;font-size:13px;color:#F58220;font-weight:700;margin-bottom:6px}
      @media print{body{background:#fff}.header{box-shadow:none}}
    </style></head><body>

    <div class="header">
      <div class="brand">
        AVISANDER
        <small>Distribuidora Avícola de Santander</small>
      </div>
      <div class="order-id">
        <div class="label">Orden de pedido</div>
        <div class="num">#${String(order.id).padStart(5, '0')}</div>
      </div>
    </div>

    <div class="meta">
      <div><span class="k">Fecha</span><span class="v">${fmtDateTime(order.created_at)}</span></div>
      <div><span class="k">Entrega</span><span class="v">${delivery}</span></div>
      <div><span class="k">Cliente</span><span class="v">${order.customer_name || '—'}</span></div>
      <div><span class="k">Teléfono</span><span class="v">${order.customer_phone || '—'}</span></div>
      <div style="grid-column:span 2"><span class="k">Dirección</span><span class="v">${order.customer_address || '—'}</span></div>
      <div><span class="k">Método pago</span><span class="v">${PAYMENT_LABEL[order.payment_method] || order.payment_method || '—'} ${payStatus}</span></div>
      ${order.payment_reference ? `<div><span class="k">Referencia</span><span class="v" style="font-family:monospace;font-size:10px">${order.payment_reference}</span></div>` : '<div></div>'}
    </div>

    <h2>Detalle de productos</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Producto</th><th>Cant.</th><th class="u">V. unit.</th><th class="s">Subtotal</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal productos</span><span>${fmtCOP(subtotal)}</span></div>
      <div class="row"><span>Domicilio</span><span>${fmtCOP(order.delivery_cost)}</span></div>
      <div class="row final"><span>TOTAL A PAGAR</span><span>${fmtCOP(order.total)}</span></div>
    </div>

    <div class="footer">
      <div class="stamp">Gracias por elegir Avisander · Expertos en Carnes</div>
      <div>Cra 30 #20-70 Local 2, San Alonso · Bucaramanga, Santander</div>
      <div>Tel: 312 300 5253 · L-V 6:30 AM – 1:00 PM y 3:00 PM – 8:00 PM · Sáb hasta 7:00 PM</div>
      <div style="margin-top:6px;font-size:10px;opacity:0.7">Esta orden de pedido no reemplaza la factura electrónica DIAN.</div>
    </div>

    </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// Escapa valores para CSV respetando comas, comillas y saltos de línea.
function csvField(v) {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCSV(rows, filename) {
  const csv = rows.map((r) => r.map(csvField).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [q, setQ] = useState('')

  // Filtros
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (paymentFilter && o.payment_method !== paymentFilter) return false
      if (paymentStatusFilter && o.payment_status !== paymentStatusFilter) return false
      if (deliveryFilter && o.delivery_method !== deliveryFilter) return false
      if (fromDate && o.created_at < fromDate) return false
      if (toDate && o.created_at > `${toDate} 23:59:59`) return false
      if (!needle) return true
      return (
        String(o.id).includes(needle) ||
        (o.customer_name || '').toLowerCase().includes(needle) ||
        (o.customer_phone || '').includes(needle) ||
        (o.payment_reference || '').toLowerCase().includes(needle)
      )
    })
  }, [orders, q, statusFilter, paymentFilter, paymentStatusFilter, deliveryFilter, fromDate, toDate])

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status })
      fetchOrders()
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status })
    } catch (error) {
      alert(error.message || 'Error al actualizar estado')
    }
  }

  const exportCSV = () => {
    const header = [
      'ID',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Total',
      'Subtotal',
      'Domicilio',
      'Método pago',
      'Estado pago',
      'Estado pedido',
      'Fuente',
      'Ciudad',
      'Referencia',
      'Items'
    ]
    const rows = filtered.map((o) => [
      o.id,
      fmtDateTime(o.created_at),
      o.customer_name || '',
      o.customer_phone || '',
      o.total,
      (o.total || 0) - (o.delivery_cost || 0),
      o.delivery_cost || 0,
      PAYMENT_LABEL[o.payment_method] || o.payment_method || '',
      o.payment_status || '',
      STATUS_LABEL[o.status] || o.status,
      o.source || 'web',
      o.delivery_city || '',
      o.payment_reference || '',
      (o.items || [])
        .map((it) => `${it.product_name} x${it.sale_type === 'by_weight' ? it.weight_grams + 'g' : it.quantity}`)
        .join(' | ')
    ])
    downloadCSV([header, ...rows], `avisander-ventas-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const PaymentChip = ({ method, status }) => {
    const ps = PAYMENT_STATUS[status]
    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-700">
          {PAYMENT_LABEL[method] || method || '—'}
        </div>
        {ps ? (
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${ps.color}`}
          >
            <ps.icon size={10} />
            {ps.label}
          </div>
        ) : (
          <div className="text-[10px] text-gray-400">—</div>
        )}
      </div>
    )
  }

  const DeliveryIcon = ({ method }) =>
    method === 'pickup' ? (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <Store size={13} /> Recoge
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
        <Truck size={13} /> Domicilio
      </span>
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, cliente, teléfono, ref…"
              className="input pl-9 w-64"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary inline-flex items-center gap-2 ${showFilters ? 'bg-primary/10 text-primary' : ''}`}
          >
            <Filter size={14} />
            Filtros
          </button>
          <button onClick={exportCSV} className="btn-secondary inline-flex items-center gap-2">
            <Download size={14} />
            Exportar CSV
          </button>
          <span className="text-sm text-gray-500">
            {filtered.length} de {orders.length}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input w-full text-sm py-1.5"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input w-full text-sm py-1.5"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Estado pedido</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full text-sm py-1.5"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Método pago</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input w-full text-sm py-1.5"
            >
              <option value="">Todos</option>
              <option value="bold">Bold</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Estado pago</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="input w-full text-sm py-1.5"
            >
              <option value="">Todos</option>
              <option value="approved">Aprobado</option>
              <option value="pending">Pendiente</option>
              <option value="declined">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Entrega</label>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="input w-full text-sm py-1.5"
            >
              <option value="">Todas</option>
              <option value="delivery">Domicilio</option>
              <option value="pickup">Recoge</option>
            </select>
          </div>
          {(fromDate || toDate || statusFilter || paymentFilter || paymentStatusFilter || deliveryFilter) && (
            <div className="col-span-full">
              <button
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                  setStatusFilter('')
                  setPaymentFilter('')
                  setPaymentStatusFilter('')
                  setDeliveryFilter('')
                }}
                className="text-xs text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-left">Entrega</th>
                  <th className="px-4 py-3 text-left">Fuente</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-mono text-xs">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCOP(order.total)}</td>
                    <td className="px-4 py-3">
                      <PaymentChip method={order.payment_method} status={order.payment_status} />
                    </td>
                    <td className="px-4 py-3"><DeliveryIcon method={order.delivery_method} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                      {order.source || 'web'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`badge cursor-pointer ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="processing">En proceso</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => printOrder(order)}
                        className="p-2 text-gray-500 hover:text-green-600"
                        title="Imprimir"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {orders.length === 0 ? 'No hay pedidos' : 'Ningún pedido coincide con los filtros'}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Teléfono</p>
                  <p className="font-medium">{selectedOrder.customer_phone || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase">Dirección</p>
                  <p className="font-medium">{selectedOrder.customer_address || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Método pago</p>
                  <p className="font-medium">
                    {PAYMENT_LABEL[selectedOrder.payment_method] || selectedOrder.payment_method || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Estado pago</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_status || '—'}</p>
                </div>
                {selectedOrder.payment_reference && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Referencia</p>
                    <p className="font-mono text-xs break-all">{selectedOrder.payment_reference}</p>
                  </div>
                )}
                {selectedOrder.payment_transaction_id && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase">ID transacción</p>
                    <p className="font-mono text-xs break-all">{selectedOrder.payment_transaction_id}</p>
                  </div>
                )}
                {selectedOrder.payment_paid_at && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs uppercase">Pagado el</p>
                    <p className="font-medium">{fmtDateTime(selectedOrder.payment_paid_at)}</p>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="text-sm">
                  <p className="text-gray-500 text-xs uppercase mb-1">Notas</p>
                  <p className="bg-gray-50 p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-xs uppercase mb-2">Productos</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className={`flex justify-between py-2 ${i > 0 ? 'border-t' : ''}`}>
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.sale_type === 'by_weight'
                            ? `${item.weight_grams} g · `
                            : `${item.quantity} x `}
                          {fmtCOP(item.unit_price)}
                        </p>
                        {item.notes && <p className="text-xs text-amber-700 italic mt-0.5">"{item.notes}"</p>}
                      </div>
                      <p className="font-medium text-sm">{fmtCOP(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmtCOP(selectedOrder.total - (selectedOrder.delivery_cost || 0))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Domicilio</span>
                  <span>{fmtCOP(selectedOrder.delivery_cost || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{fmtCOP(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600 text-sm">Estado pedido:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className={`badge cursor-pointer ${STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.pending}`}
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">En proceso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
