import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Check, X, RotateCcw, MessageCircle } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'
import { fmtDate } from '../../lib/format'

const TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'revoked', label: 'Revocados' }
]

function whatsappLink(phone, name) {
  const clean = String(phone || '').replace(/\D/g, '')
  if (!clean) return null
  const intl = clean.startsWith('57') ? clean : `57${clean}`
  const msg = encodeURIComponent(`Hola ${name || ''}, te contactamos de Avisander mayoristas. `)
  return `https://wa.me/${intl}?text=${msg}`
}

function Mayoristas() {
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, revoked: 0 })
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function load() {
    setLoading(true)
    try {
      const data = await api.get(`/api/mayoristas/admin/requests?status=${tab}`)
      setItems(data.items || [])
      setCounts(data.counts || counts)
    } catch (err) {
      toast.error(err.message || 'Error cargando solicitudes')
    } finally {
      setLoading(false)
    }
  }

  async function approve(userId) {
    try {
      await api.post(`/api/mayoristas/admin/${userId}/approve`)
      toast.success('Mayorista aprobado')
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo aprobar')
    }
  }

  async function revoke(userId) {
    if (!confirm('¿Revocar el acceso mayorista de este usuario?')) return
    try {
      await api.post(`/api/mayoristas/admin/${userId}/revoke`)
      toast.success('Acceso revocado')
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo revocar')
    }
  }

  async function submitReject() {
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      toast.error('Indica una razón breve')
      return
    }
    try {
      await api.post(`/api/mayoristas/admin/${rejectingId}/reject`, {
        reason: rejectReason.trim()
      })
      toast.success('Solicitud rechazada')
      setRejectingId(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo rechazar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase size={26} className="text-orange-500" /> Mayoristas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Solicitudes de acceso al programa de distribuidores.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {counts[t.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl shadow-sm text-center text-gray-400">
          No hay solicitudes en esta categoría.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-charcoal truncate">{u.business_name || u.name}</h3>
                    {u.business_type && (
                      <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {u.business_type}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <div>{u.name} · {u.email}</div>
                    {u.phone && <div>📞 {u.phone}</div>}
                    {u.nit && <div>NIT: {u.nit}</div>}
                    <div className="text-xs text-gray-400">
                      Solicitado: {fmtDate(u.wholesaler_requested_at) || '—'}
                      {u.wholesaler_approved_at && (
                        <> · Aprobado: {fmtDate(u.wholesaler_approved_at)}</>
                      )}
                    </div>
                    {u.wholesaler_rejection_reason && (
                      <div className="text-xs text-red-600 italic">
                        Motivo rechazo: {u.wholesaler_rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {whatsappLink(u.phone, u.name) && (
                    <a
                      href={whatsappLink(u.phone, u.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  {u.wholesaler_status === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(u.id)}
                        className="inline-flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold"
                      >
                        <Check size={14} /> Aprobar
                      </button>
                      <button
                        onClick={() => { setRejectingId(u.id); setRejectReason('') }}
                        className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold"
                      >
                        <X size={14} /> Rechazar
                      </button>
                    </>
                  )}
                  {u.wholesaler_status === 'approved' && (
                    <button
                      onClick={() => revoke(u.id)}
                      className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      <RotateCcw size={14} /> Revocar
                    </button>
                  )}
                  {u.wholesaler_status === 'rejected' && (
                    <button
                      onClick={() => approve(u.id)}
                      className="inline-flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold"
                    >
                      <Check size={14} /> Aprobar de todas formas
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Rechazar solicitud</h3>
            <p className="text-sm text-gray-600 mb-3">
              El usuario verá esta razón en su cuenta y podrá solicitar de nuevo.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ej: Volumen mensual estimado por debajo del mínimo del programa."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={submitReject}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Mayoristas
