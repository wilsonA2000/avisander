import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, MessageSquare } from 'lucide-react'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { api } from '../lib/apiClient'
import { useToast } from '../context/ToastContext'

const TYPES = [
  { value: 'peticion', label: 'Petición' },
  { value: 'queja', label: 'Queja' },
  { value: 'reclamo', label: 'Reclamo' },
  { value: 'sugerencia', label: 'Sugerencia' }
]

function Pqrs() {
  useScrollToTop('#pqrs-name')
  const toast = useToast()
  const [form, setForm] = useState({
    type: 'peticion',
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/pqrs', form, { skipAuth: true })
      setSubmitted(true)
      toast.success('Ticket enviado. Te contactaremos pronto.')
    } catch (err) {
      toast.error(err.message || 'No pudimos enviar tu solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 text-center shadow-soft border border-gray-100"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-3">¡Mensaje recibido!</h2>
          <p className="text-gray-600 mb-6">
            Gracias por escribirnos. Un miembro del equipo se pondrá en contacto contigo en las próximas
            horas hábiles.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm({ type: 'peticion', name: '', email: '', phone: '', message: '' })
            }}
            className="btn-outline text-sm"
          >
            Enviar otro mensaje
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <SEO title="PQRS · Avisander" description="Envíanos una petición, queja, reclamo o sugerencia." />

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquare size={26} />
        </div>
        <h1 className="font-display text-4xl font-bold text-charcoal mb-3">PQRS</h1>
        <p className="text-gray-600">
          Peticiones, Quejas, Reclamos y Sugerencias. Leemos cada mensaje y te respondemos por correo o WhatsApp.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl p-7 shadow-soft border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de solicitud *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                  form.type === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pqrs-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              id="pqrs-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label htmlFor="pqrs-email" className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
            <input
              id="pqrs-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="tu@correo.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pqrs-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
          <input
            id="pqrs-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
            placeholder="3001234567"
          />
        </div>

        <div>
          <label htmlFor="pqrs-message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
          <textarea
            id="pqrs-message"
            required
            minLength={10}
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="input"
            placeholder="Describe tu solicitud con detalle (mínimo 10 caracteres)"
          />
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? 'Enviando…' : 'Enviar solicitud'}
        </motion.button>
      </form>
    </div>
  )
}

export default Pqrs
