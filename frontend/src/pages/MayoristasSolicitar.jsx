import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Truck, Shield, Star, ArrowRight, Clock, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/apiClient'
import SEO from '../components/SEO'

const HIGHLIGHTS = [
  { Icon: BadgeCheck, title: 'Precios mayoristas', text: 'Tarifas según volumen mensual.' },
  { Icon: Truck, title: 'Logística dedicada', text: 'Entrega a tu punto de venta.' },
  { Icon: Shield, title: 'Cadena de frío', text: 'Trazabilidad y empaque al vacío.' },
  { Icon: Star, title: 'Asesor directo', text: 'Soporte comercial personalizado.' }
]

function MayoristasSolicitar() {
  const { isAuthenticated, user, refreshUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    business_name: user?.business_name || '',
    nit: user?.nit || '',
    business_type: user?.business_type || ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        business_name: user.business_name || '',
        nit: user.nit || '',
        business_type: user.business_type || ''
      })
    }
  }, [user])

  const status = user?.wholesaler_status

  async function submit(e) {
    e.preventDefault()
    if (!form.business_name.trim() || !form.nit.trim() || !form.business_type.trim()) {
      toast.error('Completa los 3 campos para enviar tu solicitud.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/mayoristas/request', form)
      await refreshUser()
      toast.success('Solicitud enviada. Te contactaremos pronto.')
      navigate('/mi-cuenta?mayorista=pendiente')
    } catch (err) {
      toast.error(err.message || 'No se pudo enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <SEO
        title="Programa Mayoristas · Avisander"
        description="Solicita acceso al programa de distribuidores Avisander."
      />

      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
          >
            🤝 Programa Mayorista
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-black mb-4 drop-shadow-lg"
          >
            Crece con Avisander
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto"
          >
            Carnes premium con precios preferenciales para tu restaurante, hotel o tienda.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-orange-100/60 shadow-sm text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <h.Icon size={22} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-sm text-charcoal mb-1">{h.title}</h3>
              <p className="text-xs text-gray-500">{h.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-orange-100/60 p-8 md:p-10">
          {!isAuthenticated && (
            <>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                Inicia sesión para solicitar
              </h2>
              <p className="text-gray-600 mb-6">
                Necesitas una cuenta para enviarnos tu solicitud y darte seguimiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-full"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold px-5 py-3 rounded-full"
                >
                  Crear cuenta
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && status === 'pending' && (
            <div className="text-center py-6">
              <Clock size={42} className="mx-auto text-yellow-500 mb-3" />
              <h2 className="font-bold text-xl text-charcoal mb-2">Tu solicitud está en revisión</h2>
              <p className="text-gray-600 mb-4">
                Nuestro equipo comercial te contactará en menos de 24 horas hábiles.
              </p>
              <Link to="/mi-cuenta" className="text-primary font-semibold">Ver mi cuenta</Link>
            </div>
          )}

          {isAuthenticated && status === 'approved' && (
            <div className="text-center py-6">
              <BadgeCheck size={42} className="mx-auto text-emerald-500 mb-3" />
              <h2 className="font-bold text-xl text-charcoal mb-2">Ya eres mayorista aprobado</h2>
              <Link
                to="/mayoristas"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-full mt-2"
              >
                Ir al portal mayorista <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {isAuthenticated &&
            (status === null || status === undefined || status === 'rejected' || status === 'revoked') && (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-charcoal mb-1">
                    {status === 'rejected' || status === 'revoked'
                      ? 'Vuelve a solicitar acceso'
                      : 'Solicitar acceso mayorista'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Cuéntanos sobre tu negocio. Es rápido.
                  </p>
                </div>

                {status === 'rejected' && user?.wholesaler_rejection_reason && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex gap-2">
                    <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">Solicitud anterior rechazada</div>
                      <div>{user.wholesaler_rejection_reason}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Razón social</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                    placeholder="Restaurante La Brasa S.A.S"
                    className="input"
                    maxLength={150}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NIT</label>
                    <input
                      type="text"
                      value={form.nit}
                      onChange={(e) => setForm((p) => ({ ...p, nit: e.target.value }))}
                      placeholder="900.123.456-7"
                      className="input"
                      maxLength={40}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de negocio</label>
                    <select
                      value={form.business_type}
                      onChange={(e) => setForm((p) => ({ ...p, business_type: e.target.value }))}
                      className="input"
                      required
                    >
                      <option value="">Selecciona...</option>
                      <option value="restaurante">Restaurante</option>
                      <option value="hotel">Hotel</option>
                      <option value="catering">Catering / Eventos</option>
                      <option value="supermercado">Supermercado / Tienda</option>
                      <option value="distribuidor">Distribuidor</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-full transition-colors"
                >
                  {submitting ? 'Enviando…' : 'Enviar solicitud'} <ArrowRight size={16} />
                </button>
              </form>
            )}
        </div>
      </section>
    </div>
  )
}

export default MayoristasSolicitar
