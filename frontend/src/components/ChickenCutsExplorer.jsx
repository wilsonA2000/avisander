import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Drumstick, Utensils } from 'lucide-react'
import { api } from '../lib/apiClient'

// Despiece interactivo del pollo.
// Approach: imagen IA del pollo + hotspots circulares numerados posicionados
// sobre cada parte. Estilo infografía clásica de carnicería. No requiere
// mapeo anatómico pixel-perfect (a diferencia de polígonos) porque cada
// hotspot solo necesita estar dentro de su zona, no cubrirla.

const CUTS = [
  {
    id: 'pechuga',
    n: 1,
    label: 'Pechuga',
    short: 'El corte magro por excelencia',
    desc: 'Alta proteína, baja grasa. Ideal para plancha, horno o ensaladas. Cocción rápida — 6 a 8 min por lado.',
    protein: '23g',
    fat: '1.2g',
    kcal: '165',
    tips: ['Marinar 30 min en limón y hierbas', 'Plancha a fuego medio-alto', 'No sobrecocinar: queda seca'],
    // x,y en % del viewBox 100x100. Sobre la parte central-alta del pollo.
    pos: { x: 48, y: 42 },
    searchTerm: 'pechuga'
  },
  {
    id: 'alas',
    n: 2,
    label: 'Alas',
    short: 'Para picar en grande',
    desc: 'Sabor intenso, piel crujiente al freír u hornear. Clásico BBQ, snack con salsa o aperitivo compartido.',
    protein: '18g',
    fat: '7g',
    kcal: '203',
    tips: ['Marinar con soja, miel y ajo', 'Hornear a 200°C 25 min + broil final', 'Acompañar con salsa ranch o blue cheese'],
    pos: { x: 22, y: 46 },
    searchTerm: 'alas'
  },
  {
    id: 'muslos',
    n: 3,
    label: 'Muslos',
    short: 'Jugosos y con sabor',
    desc: 'Carne oscura con más sabor y menos riesgo de secarse. Perfecto para guisos, sudado, asado lento.',
    protein: '19g',
    fat: '10g',
    kcal: '209',
    tips: ['Dorar piel primero en sartén', 'Terminar al horno 25 min a 180°C', 'Va bien con papas y cebolla caramelizada'],
    pos: { x: 38, y: 70 },
    searchTerm: 'muslo'
  },
  {
    id: 'piernas',
    n: 4,
    label: 'Piernas (pernil)',
    short: 'Favorito de los niños',
    desc: 'Hueso grande, cocción pareja, fácil de sujetar. Estrella de las parrillas y almuerzos familiares.',
    protein: '16g',
    fat: '9g',
    kcal: '172',
    tips: ['Marinar 4h con paprika y ajo', 'Parrilla a fuego indirecto 35 min', 'Rotar 2 veces para dorado uniforme'],
    pos: { x: 72, y: 70 },
    searchTerm: 'pierna'
  },
  {
    id: 'rabadilla',
    n: 5,
    label: 'Rabadilla / espalda',
    short: 'La base de un buen caldo',
    desc: 'Menos carne pero más sabor. Ideal para caldos, fondos y sudados tradicionales colombianos.',
    protein: '12g',
    fat: '14g',
    kcal: '180',
    tips: ['Tostar 10 min al horno antes de hervir', 'Caldo con puerro, zanahoria y apio', 'Colar antes de usar de base'],
    pos: { x: 58, y: 26 },
    searchTerm: 'rabadilla'
  }
]

function Hotspot({ cut, active, onSelect }) {
  const isActive = cut.id === active
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(cut.id)}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${cut.pos.x}%`, top: `${cut.pos.y}%` }}
      aria-label={cut.label}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Pulso suave cuando está activo */}
      {isActive && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/40"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
      <span
        className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-sm md:text-base font-bold transition-all shadow-lg ${
          isActive
            ? 'bg-primary text-white ring-4 ring-primary/30'
            : 'bg-white/95 text-charcoal ring-2 ring-white/80 group-hover:bg-primary group-hover:text-white'
        }`}
      >
        {cut.n}
      </span>
      {/* Etiqueta flotante (solo al hover o active) */}
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 mt-2 top-full whitespace-nowrap text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full bg-charcoal/85 backdrop-blur-sm text-white transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {cut.label}
      </span>
    </motion.button>
  )
}

function ChickenCutsExplorer() {
  const [active, setActive] = useState(CUTS[0].id)
  const [products, setProducts] = useState({})

  useEffect(() => {
    let cancelled = false
    api.get('/api/products?per_page=200', { skipAuth: true })
      .then((data) => {
        if (cancelled) return
        const list = data.items || data || []
        const byCut = {}
        for (const cut of CUTS) {
          const match = list.find((p) =>
            (p.name || '').toLowerCase().includes(cut.searchTerm) &&
            (p.name || '').toLowerCase().includes('pollo')
          )
          if (match) byCut[cut.id] = match
        }
        setProducts(byCut)
      })
      .catch(() => { /* sin red, seguimos sin links */ })
    return () => { cancelled = true }
  }, [])

  const current = CUTS.find((c) => c.id === active) || CUTS[0]
  const product = products[current.id]

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10">
      {/* Imagen + hotspots */}
      <div className="relative rounded-3xl overflow-hidden bg-charcoal shadow-2xl aspect-[4/3]">
        <img
          src="/ai-despiece-pollo.webp"
          alt="Pollo entero con cortes identificados"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" aria-hidden="true" />

        {CUTS.map((cut) => (
          <Hotspot key={cut.id} cut={cut} active={active} onSelect={setActive} />
        ))}

        {/* Label flotante abajo con el corte activo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="absolute left-4 bottom-4 md:left-6 md:bottom-6 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg"
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              #{current.n} · Corte
            </p>
            <p className="font-display text-lg md:text-xl font-bold text-charcoal">{current.label}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Panel info */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-7"
          >
            <div className="flex items-center gap-2 mb-2">
              <Drumstick size={18} className="text-primary" />
              <span className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold">
                {current.short}
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-charcoal mb-3">
              {current.label}
            </h3>
            <p className="text-gray-700 leading-relaxed mb-5 text-sm md:text-base">
              {current.desc}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <Metric label="Proteína" value={current.protein} />
              <Metric label="Grasa" value={current.fat} />
              <Metric label="Kcal" value={current.kcal} />
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Utensils size={14} className="text-primary" />
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Cocción</span>
              </div>
              <ul className="space-y-1.5">
                {current.tips.map((t, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-primary mt-0.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {product ? (
              <Link
                to={`/producto/${product.id}`}
                className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-md"
              >
                Ver {product.name}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/productos?category=pollo"
                className="inline-flex items-center justify-center gap-2 w-full border border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Ver todos los cortes de pollo
                <ArrowRight size={16} />
              </Link>
            )}
          </motion.article>
        </AnimatePresence>

        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {CUTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 inline-flex items-center gap-1.5 ${
                c.id === active
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                c.id === active ? 'bg-white/25' : 'bg-primary/10 text-primary'
              }`}>
                {c.n}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-cream rounded-xl p-2.5 text-center border border-amber-100">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-base font-bold text-charcoal mt-0.5">{value}</p>
    </div>
  )
}

export default ChickenCutsExplorer
