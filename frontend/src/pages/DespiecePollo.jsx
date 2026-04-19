import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Info } from 'lucide-react'
import ChickenCutsExplorer from '../components/ChickenCutsExplorer'
import SEO from '../components/SEO'

function DespiecePollo() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <SEO
        title="Despiece del pollo | Avisander"
        description="Conoce cada corte del pollo, su uso culinario y valor nutricional. Explora pechuga, muslos, piernas, alas y rabadilla. Carnicería premium en Bucaramanga."
      />

      {/* Migas + back */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={14} /> Volver al inicio
      </Link>

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 md:mb-12 max-w-3xl"
      >
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
          <Info size={12} /> Guía del corte
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-charcoal leading-[1.05] mb-3">
          El pollo, corte por corte
        </h1>
        <p className="text-gray-600 md:text-lg leading-relaxed max-w-2xl">
          Haz clic sobre cada parte del pollo para descubrir sus usos culinarios, valor nutricional y qué producto lleva a tu mesa.
        </p>
      </motion.header>

      <ChickenCutsExplorer />

      {/* Próximamente: cerdo y res */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-12 md:mt-20 grid md:grid-cols-2 gap-4"
      >
        {[
          { slug: 'cerdo', label: 'Despiece del cerdo', subtitle: 'Próximamente' },
          { slug: 'res', label: 'Despiece de la res', subtitle: 'Próximamente' }
        ].map((c) => (
          <div
            key={c.slug}
            className="rounded-2xl border border-dashed border-gray-300 p-6 md:p-8 bg-cream/30 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                {c.subtitle}
              </p>
              <p className="font-display text-xl font-bold text-charcoal">{c.label}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 text-2xl">
              ·
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default DespiecePollo
