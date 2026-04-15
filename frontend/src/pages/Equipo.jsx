import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { TEAM } from '../data/team'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { initials } from '../lib/format'

function Equipo() {
  useScrollToTop()
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <SEO title="Nuestro equipo · Avisander" description="Conoce al equipo humano detrás de Avisander." />

      <div className="text-center mb-10">
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
          Personas detrás de la marca
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-3">Nuestro equipo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Un grupo de personas comprometidas con que cada pedido llegue exactamente como lo esperas.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {TEAM.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center mb-4 overflow-hidden">
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-primary">{initials(m.name)}</span>
              )}
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal">{m.name}</h3>
            <p className="text-sm text-accent-dark font-medium mb-2">{m.role}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{m.bio}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Equipo
