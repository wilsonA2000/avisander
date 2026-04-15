import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  DollarSign,
  Truck,
  Users,
  Repeat,
  Receipt,
  AlertTriangle,
  TrendingUp,
  CreditCard
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { api } from '../../lib/apiClient'
import { fmtCOP } from '../../lib/format'

const RANGES = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: '7d', label: '7 días', days: 6 },
  { key: '30d', label: '30 días', days: 29 },
  { key: 'mtd', label: 'Este mes', days: null }
]

const PAYMENT_COLORS = { bold: '#6366f1', whatsapp: '#10b981', cash: '#f59e0b', unknown: '#9ca3af' }
const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
}
const PAYMENT_LABEL = { bold: 'Bold', whatsapp: 'WhatsApp', cash: 'Efectivo', unknown: 'N/A' }
const STATUS_LABEL = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  unknown: 'N/A'
}

function rangeFor(key) {
  const today = new Date()
  if (key === 'today') {
    const d = today.toISOString().slice(0, 10)
    return { from: d, to: d }
  }
  if (key === 'mtd') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      from: first.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10)
    }
  }
  const days = RANGES.find((r) => r.key === key)?.days ?? 29
  const from = new Date(today.getTime() - days * 86400_000)
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10)
  }
}

function StatCard({ label, value, icon: Icon, accent = 'bg-gray-100 text-gray-600', hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className={`${accent} p-2.5 rounded-lg`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const [rangeKey, setRangeKey] = useState('30d')
  const [customRange, setCustomRange] = useState(null) // {from, to} si el usuario los pone a mano
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  const effectiveRange = useMemo(() => customRange || rangeFor(rangeKey), [rangeKey, customRange])

  useEffect(() => {
    setLoading(true)
    const qs = `from=${effectiveRange.from}&to=${effectiveRange.to}&granularity=day`
    Promise.all([
      api.get(`/api/reports/summary?${qs}`).catch(() => null),
      api.get(`/api/reports/top-products?${qs}&limit=10`).catch(() => []),
      api.get('/api/inventory?low_stock=1').catch(() => [])
    ])
      .then(([s, tp, ls]) => {
        setSummary(s)
        setTopProducts(Array.isArray(tp) ? tp : [])
        setLowStock(Array.isArray(ls) ? ls : [])
      })
      .finally(() => setLoading(false))
  }, [effectiveRange.from, effectiveRange.to])

  const totals = summary?.totals || {}
  const series = summary?.series || []
  const paymentData = Object.entries(summary?.by_payment_method || {}).map(([k, v]) => ({
    name: PAYMENT_LABEL[k] || k,
    value: v.total,
    count: v.count,
    fill: PAYMENT_COLORS[k] || '#9ca3af'
  }))
  const statusData = Object.entries(summary?.by_status || {}).map(([k, v]) => ({
    name: STATUS_LABEL[k] || k,
    value: v.count,
    fill: STATUS_COLORS[k] || '#9ca3af'
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {effectiveRange.from} — {effectiveRange.to}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => { setCustomRange(null); setRangeKey(r.key) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !customRange && rangeKey === r.key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="date"
              className="input w-auto text-sm py-1.5"
              value={customRange?.from || effectiveRange.from}
              onChange={(e) =>
                setCustomRange({ from: e.target.value, to: customRange?.to || effectiveRange.to })
              }
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              className="input w-auto text-sm py-1.5"
              value={customRange?.to || effectiveRange.to}
              onChange={(e) =>
                setCustomRange({ from: customRange?.from || effectiveRange.from, to: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Fila 1: ingresos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Ingresos brutos"
          value={loading ? '—' : fmtCOP(totals.revenue_gross)}
          icon={DollarSign}
          accent="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Ingresos productos"
          value={loading ? '—' : fmtCOP(totals.revenue_products)}
          icon={Package}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Domicilios cobrados"
          value={loading ? '—' : fmtCOP(totals.revenue_delivery)}
          icon={Truck}
          accent="bg-sky-100 text-sky-600"
        />
        <StatCard
          label="Pedidos"
          value={loading ? '—' : totals.orders_count || 0}
          icon={ShoppingBag}
          accent="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Fila 2: clientes + ticket + comisiones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Clientes nuevos"
          value={loading ? '—' : totals.new_customers || 0}
          icon={Users}
          accent="bg-violet-100 text-violet-600"
        />
        <StatCard
          label="Clientes recurrentes"
          value={loading ? '—' : totals.returning_customers || 0}
          icon={Repeat}
          accent="bg-fuchsia-100 text-fuchsia-600"
        />
        <StatCard
          label="Ticket promedio"
          value={loading ? '—' : fmtCOP(totals.avg_ticket)}
          icon={Receipt}
          accent="bg-teal-100 text-teal-600"
        />
        <StatCard
          label="Comisiones estim. Bold"
          value={loading ? '—' : fmtCOP(totals.commissions_estimated)}
          icon={CreditCard}
          accent="bg-rose-100 text-rose-600"
          hint="2.69%+$300 sobre aprobados"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> Ventas en el período
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            {series.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) =>
                      d.length === 10 ? d.slice(5).replace('-', '/') : d
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip formatter={(v) => fmtCOP(v)} labelFormatter={(l) => `Fecha: ${l}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B1F28"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#8B1F28' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin datos para este período
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-primary" /> Por método de pago
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            {paymentData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {paymentData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <ReTooltip formatter={(v) => fmtCOP(v)} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Estado de pedidos</h3>
          <div style={{ width: '100%', height: 220 }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={statusData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ReTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </div>
        </div>

        {/* Bajo stock */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" /> Bajo stock
            </h3>
            <Link to="/admin/inventario" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Todos los productos en nivel adecuado 🎯</p>
          ) : (
            <ul className="space-y-2 max-h-52 overflow-auto">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-rose-600 font-semibold whitespace-nowrap">
                    {Number(p.stock).toLocaleString('es-CO')} / {Number(p.stock_min).toLocaleString('es-CO')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Top productos del período</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas en el período.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {topProducts.slice(0, 8).map((p, idx) => (
                <li key={p.product_id} className="flex items-center justify-between">
                  <span className="truncate pr-2">
                    <span className="text-gray-400 font-mono text-xs mr-2">{String(idx + 1).padStart(2, '0')}</span>
                    {p.product_name}
                  </span>
                  <span className="font-semibold text-gray-700 whitespace-nowrap">{fmtCOP(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
