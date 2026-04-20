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
  CreditCard,
  Star,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  Eye,
  Globe,
  Activity
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
  shipped: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#ef4444',
  abandoned: '#9ca3af'
}
const PAYMENT_LABEL = { bold: 'Bold', whatsapp: 'WhatsApp', cash: 'Efectivo', unknown: 'N/A' }
const STATUS_LABEL = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'En camino',
  completed: 'Completado',
  cancelled: 'Cancelado',
  abandoned: 'Abandonado',
  unknown: 'N/A'
}

// Siempre trabajamos con fechas "Bogotá" para que los rangos Hoy / 7d / mtd
// coincidan con el día del negocio y no con UTC (que se adelanta 5 h).
function todayBogotaISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}
function addDaysISO(iso, delta) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

function rangeFor(key) {
  const todayISO = todayBogotaISO()
  if (key === 'today') return { from: todayISO, to: todayISO }
  if (key === 'mtd') return { from: todayISO.slice(0, 7) + '-01', to: todayISO }
  const days = RANGES.find((r) => r.key === key)?.days ?? 29
  return { from: addDaysISO(todayISO, -days), to: todayISO }
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
  const [byHour, setByHour] = useState([])
  const [byWeekday, setByWeekday] = useState([])
  const [loyaltySummary, setLoyaltySummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const effectiveRange = useMemo(() => customRange || rangeFor(rangeKey), [rangeKey, customRange])

  useEffect(() => {
    setLoading(true)
    const qs = `from=${effectiveRange.from}&to=${effectiveRange.to}&granularity=day`
    Promise.all([
      api.get(`/api/reports/summary?${qs}`).catch(() => null),
      api.get(`/api/reports/top-products?${qs}&limit=10`).catch(() => []),
      api.get('/api/inventory?low_stock=1').catch(() => []),
      api.get(`/api/reports/by-hour?${qs}`).catch(() => []),
      api.get(`/api/reports/by-weekday?${qs}`).catch(() => []),
      api.get(`/api/reports/loyalty-summary?${qs}`).catch(() => null)
    ])
      .then(([s, tp, ls, bh, bw, ly]) => {
        setSummary(s)
        setTopProducts(Array.isArray(tp) ? tp : [])
        setLowStock(Array.isArray(ls) ? ls : [])
        setByHour(Array.isArray(bh) ? bh : [])
        setByWeekday(Array.isArray(bw) ? bw : [])
        setLoyaltySummary(ly)
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

      {/* Tráfico del sitio */}
      <TrafficWidget />

      {/* Fila 1: ingresos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Ingresos brutos"
          value={loading ? '—' : fmtCOP(totals.revenue_gross)}
          icon={DollarSign}
          accent="bg-emerald-100 text-emerald-600"
          hint={loading ? null : `Confirmado: ${fmtCOP(totals.revenue_confirmed || 0)}`}
        />
        <StatCard
          label="Ingresos productos"
          value={loading ? '—' : fmtCOP(totals.revenue_products)}
          icon={Package}
          accent="bg-primary/10 text-primary"
          hint="Sin cancelados ni abandonados"
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
          hint={loading ? null : `${totals.cancelled_count || 0} cancelados · ${totals.abandoned_count || 0} abandonados`}
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

      {/* Fila 3: fidelización + conversión */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Tasa completados"
          value={loading ? '—' : `${totals.orders_count_all ? Math.round(((summary?.by_status?.completed?.count || 0) / totals.orders_count_all) * 100) : 0}%`}
          icon={CheckCircle2}
          accent="bg-green-100 text-green-600"
          hint="Completados / total (incl. cancelados y abandonados)"
        />
        <StatCard
          label="Puntos emitidos"
          value={loading ? '—' : (loyaltySummary?.points_earned || 0).toLocaleString('es-CO')}
          icon={Star}
          accent="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Puntos canjeados"
          value={loading ? '—' : (loyaltySummary?.points_redeemed || 0).toLocaleString('es-CO')}
          icon={Award}
          accent="bg-orange-100 text-orange-600"
        />
        <StatCard
          label="Clientes con puntos"
          value={loading ? '—' : loyaltySummary?.active_loyalty_users || 0}
          icon={Users}
          accent="bg-indigo-100 text-indigo-600"
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
      {/* Fila 4: ventas por hora + por día de la semana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Ventas por hora
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            {byHour.some((h) => h.orders > 0) ? (
              <ResponsiveContainer>
                <BarChart data={byHour} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ReTooltip formatter={(v, name) => name === 'revenue' ? fmtCOP(v) : v} />
                  <Bar dataKey="orders" fill="#8B1F28" radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Ventas por día de la semana
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            {byWeekday.some((d) => d.orders > 0) ? (
              <ResponsiveContainer>
                <BarChart data={byWeekday} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip formatter={(v) => fmtCOP(v)} />
                  <Bar dataKey="revenue" fill="#C79B5B" radius={[4, 4, 0, 0]} name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Widget de tráfico en tiempo real. Refresca cada 30s para que "Ahora
// navegando" se sienta vivo sin saturar el backend.
function TrafficWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    const fetchIt = () => {
      api.get('/api/analytics/summary')
        .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
        .catch(() => { if (!cancelled) setLoading(false) })
    }
    fetchIt()
    const int = setInterval(fetchIt, 30_000)
    return () => { cancelled = true; clearInterval(int) }
  }, [])

  const activeNow = data?.active_now ?? 0
  const todayVisits = data?.today?.visits ?? 0
  const todayUnique = data?.today?.unique ?? 0
  const totalVisits = data?.total_visits ?? 0

  // Normalizar 7 días (rellenar días sin data con 0)
  const chart7d = useMemo(() => {
    if (!data?.last_7_days) return []
    const map = Object.fromEntries(data.last_7_days.map((r) => [r.date, r]))
    const out = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400_000)
      const iso = d.toISOString().slice(0, 10)
      const row = map[iso] || { visits: 0, unique: 0 }
      out.push({
        label: d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
        visits: row.visits,
        unique: row.unique
      })
    }
    return out
  }, [data])

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-primary" /> Tráfico del sitio
          </h2>
          <p className="text-xs text-gray-400">Actualización automática cada 30 s</p>
        </div>
        {loading && <span className="text-xs text-gray-400">Cargando…</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Ahora navegando */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span className={`relative flex h-2 w-2 ${activeNow > 0 ? '' : 'opacity-30'}`}>
              {activeNow > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Ahora
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{activeNow}</p>
          <p className="text-[11px] text-gray-500">navegando (5 min)</p>
        </div>
        {/* Hoy visitas */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <Eye size={12} /> Hoy
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{todayVisits}</p>
          <p className="text-[11px] text-gray-500">páginas vistas</p>
        </div>
        {/* Hoy únicos */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <Users size={12} /> Hoy
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{todayUnique}</p>
          <p className="text-[11px] text-gray-500">visitantes únicos</p>
        </div>
        {/* Total histórico */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <Globe size={12} /> Total
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalVisits.toLocaleString('es-CO')}</p>
          <p className="text-[11px] text-gray-500">desde el inicio</p>
        </div>
      </div>

      {/* 7 días + top páginas */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Últimos 7 días</h3>
          <div className="h-32">
            {chart7d.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart7d} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReTooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(v, n) => [v, n === 'visits' ? 'Vistas' : 'Únicos']}
                  />
                  <Bar dataKey="visits" fill="#F58220" radius={[4, 4, 0, 0]} name="visits" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Sin datos aún</div>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top páginas (hoy)</h3>
          {data?.top_paths?.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {data.top_paths.slice(0, 5).map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-gray-600 truncate" title={p.path}>{p.path || '/'}</span>
                  <span className="font-bold text-primary text-xs">{p.visits}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">Sin visitas hoy</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
