import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FAQ } from '../data/faq'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, whatsappLink } from '../context/SettingsContext'

function Item({ item, open, onToggle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-charcoal pr-4">{item.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-600 leading-relaxed text-sm">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Ayuda() {
  useScrollToTop()
  const { settings } = useSettings()
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <SEO title="Centro de ayuda · Avisander" description="Respuestas a las preguntas más frecuentes sobre Avisander." />

      <div className="text-center mb-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <HelpCircle size={26} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-3">Centro de ayuda</h1>
        <p className="text-gray-600">Las preguntas más frecuentes de nuestros clientes.</p>
      </div>

      <div className="space-y-3 mb-10">
        {FAQ.map((item, i) => (
          <Item key={i} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
        ))}
      </div>

      <div className="bg-cream rounded-2xl p-7 text-center">
        <h3 className="font-display text-xl font-bold text-charcoal mb-2">¿No encontraste tu respuesta?</h3>
        <p className="text-gray-600 text-sm mb-4">Escríbenos, te contactamos lo antes posible.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <Link to="/pqrs" className="btn-outline text-sm">
            Enviar PQRS
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Ayuda
