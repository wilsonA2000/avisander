import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Drumstick, Utensils, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { api } from '../lib/apiClient'

// Explosion view: el pollo entero se descompone en 5 piezas que vuelan a sus
// posiciones con spring physics (Framer Motion), simulando un diagrama 3D
// despiezado. Click en pieza → foco (centrada y ampliada), panel info al lado.
// Cero Three.js, cero Blender — solo imágenes IA + animación 2D.

const CUTS = [
  {
    id: 'pechuga',
    n: 1,
    label: 'Pechuga',
    image: '/ai-pollo-pechuga.webp',
    short: 'El corte magro por excelencia',
    desc: 'Alta proteína, baja grasa. Ideal para plancha, horno o ensaladas. Cocción rápida — 6 a 8 min por lado.',
    protein: '23g', fat: '1.2g', kcal: '165',
    tips: ['Marinar 30 min en limón y hierbas', 'Plancha a fuego medio-alto', 'No sobrecocinar: queda seca'],
    // Posición en el espacio exploded (x,y en % del contenedor, relativo al centro)
    exploded: { x: 0, y: -38, rotate: -4, scale: 0.65 },
    searchTerm: 'pechuga'
  },
  {
    id: 'alas',
    n: 2,
    label: 'Alas',
    image: '/ai-pollo-ala.webp',
    short: 'Para picar en grande',
    desc: 'Sabor intenso, piel crujiente al freír u hornear. Clásico BBQ, snack con salsa o aperitivo compartido.',
    protein: '18g', fat: '7g', kcal: '203',
    tips: ['Marinar con soja, miel y ajo', 'Hornear a 200°C 25 min + broil final', 'Acompañar con salsa ranch o blue cheese'],
    exploded: { x: -40, y: -5, rotate: -18, scale: 0.55 },
    searchTerm: 'alas'
  },
  {
    id: 'muslos',
    n: 3,
    label: 'Muslos',
    image: '/ai-pollo-muslo.webp',
    short: 'Jugosos y con sabor',
    desc: 'Carne oscura con más sabor y menos riesgo de secarse. Perfecto para guisos, sudado, asado lento.',
    protein: '19g', fat: '10g', kcal: '209',
    tips: ['Dorar piel primero en sartén', 'Terminar al horno 25 min a 180°C', 'Va bien con papas y cebolla caramelizada'],
    exploded: { x: -28, y: 32, rotate: 8, scale: 0.62 },
    searchTerm: 'muslo'
  },
  {
    id: 'piernas',
    n: 4,
    label: 'Piernas (pernil)',
    image: '/ai-pollo-pierna.webp',
    short: 'Favorito de los niños',
    desc: 'Hueso grande, cocción pareja, fácil de sujetar. Estrella de las parrillas y almuerzos familiares.',
    protein: '16g', fat: '9g', kcal: '172',
    tips: ['Marinar 4h con paprika y ajo', 'Parrilla a fuego indirecto 35 min', 'Rotar 2 veces para dorado uniforme'],
    exploded: { x: 30, y: 30, rotate: -8, scale: 0.6 },
    searchTerm: 'pierna'
  },
  {
    id: 'rabadilla',
    n: 5,
    label: 'Rabadilla / espalda',
    image: '/ai-pollo-rabadilla.webp',
    short: 'La base de un buen caldo',
    desc: 'Menos carne pero más sabor. Ideal para caldos, fondos y sudados tradicionales colombianos.',
    protein: '12g', fat: '14g', kcal: '180',
    tips: ['Tostar 10 min al horno antes de hervir', 'Caldo con puerro, zanahoria y apio', 'Colar antes de usar de base'],
    exploded: { x: 38, y: -18, rotate: 16, scale: 0.55 },
    searchTerm: 'rabadilla'
  }
]

// Tres estados de la vista:
//   'assembled': pollo entero visible, piezas ocultas
//   'exploded':  pollo oculto, 5 piezas en formación explotada
//   'focused':   una pieza en el centro grande, las demás mini en los bordes
const springy = { type: 'spring', stiffness: 180, damping: 22, mass: 0.9 }

function ChickenCutsExplorer() {
  const [view, setView] = useState('assembled')
  const [focusedId, setFocusedId] = useState(null)
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
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const focused = CUTS.find((c) => c.id === focusedId)
  const product = focused ? products[focused.id] : null

  const handleAssemble = () => { setView('assembled'); setFocusedId(null) }
  const handleExplode = () => { setView('exploded'); setFocusedId(null) }
  const handleFocus = (id) => { setView('focused'); setFocusedId(id) }

  return (
    <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6 lg:gap-10">
      {/* Escenario visual */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1a1410] shadow-2xl aspect-square lg:aspect-[4/3]">
        {/* Glow ambiental */}
        <div className="absolute inset-0 bg-gradient-radial from-amber-900/15 via-transparent to-transparent" aria-hidden="true" />

        {/* Pollo entero — fade completo fuera cuando se disecciona */}
        <motion.img
          src="/ai-pollo-entero.webp"
          alt="Pollo entero"
          className="absolute w-[72%] max-w-[500px] pointer-events-none"
          style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          animate={{
            opacity: view === 'assembled' ? 1 : 0,
            scale: view === 'assembled' ? 1 : 1.08
          }}
          transition={springy}
        />

        {/* Piezas — posicionadas con left/top en % del contenedor y x/y en %
            del elemento para centrar. Separar ambos evita el conflicto de
            calc(-50% + N%) que antes dejaba las piezas apiladas. */}
        {CUTS.map((cut) => {
          const isFocused = view === 'focused' && cut.id === focusedId
          let leftPct, topPct, scale, rotate, opacity
          if (view === 'assembled') {
            leftPct = 50; topPct = 50
            scale = 0.5; rotate = 0; opacity = 0
          } else if (view === 'exploded') {
            leftPct = 50 + cut.exploded.x
            topPct = 50 + cut.exploded.y
            scale = cut.exploded.scale
            rotate = cut.exploded.rotate
            opacity = 1
          } else if (isFocused) {
            leftPct = 50; topPct = 50
            scale = 1.1; rotate = 0; opacity = 1
          } else {
            // piezas no enfocadas: al borde según el ángulo original
            const angle = Math.atan2(cut.exploded.y || 0.001, cut.exploded.x || 0.001)
            const radius = 40
            leftPct = 50 + Math.cos(angle) * radius
            topPct = 50 + Math.sin(angle) * radius
            scale = 0.3; rotate = 0; opacity = 0.55
          }
          return (
            <motion.button
              key={cut.id}
              type="button"
              onClick={() => handleFocus(cut.id)}
              aria-label={cut.label}
              className="absolute w-[36%] max-w-[240px] cursor-pointer will-change-transform focus:outline-none"
              animate={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                x: '-50%',
                y: '-50%',
                scale,
                rotate,
                opacity
              }}
              transition={springy}
              whileHover={view !== 'assembled' && !isFocused ? { scale: scale * 1.08 } : undefined}
            >
              <div className="relative">
                <img
                  src={cut.image}
                  alt={cut.label}
                  className="w-full h-auto select-none"
                  draggable="false"
                />
                {(view === 'exploded' || isFocused) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs md:text-sm font-bold px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap"
                  >
                    {cut.n}
                  </motion.span>
                )}
              </div>
            </motion.button>
          )
        })}

        {/* Controles del escenario */}
        <div className="absolute left-4 bottom-4 md:left-6 md:bottom-6 flex gap-2">
          {view === 'assembled' ? (
            <motion.button
              type="button"
              onClick={handleExplode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-xl text-sm"
            >
              <Maximize2 size={14} /> Diseccionar
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleAssemble}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-charcoal font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-xl text-sm backdrop-blur-sm"
            >
              {view === 'focused' ? <><RotateCcw size={14} /> Ver todas</> : <><Minimize2 size={14} /> Unir</>}
            </motion.button>
          )}
          {view === 'focused' && (
            <motion.button
              type="button"
              onClick={handleAssemble}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-charcoal font-semibold px-4 py-2 rounded-full shadow-xl text-sm backdrop-blur-sm"
            >
              <Minimize2 size={14} /> Unir
            </motion.button>
          )}
        </div>

        {/* Hint inicial */}
        {view === 'assembled' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute right-4 top-4 md:right-6 md:top-6 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full"
          >
            Pulsa <span className="font-bold text-primary">Diseccionar</span> ↓
          </motion.div>
        )}
      </div>

      {/* Panel info */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {view === 'focused' && focused ? (
            <motion.article
              key={focused.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-7"
            >
              <div className="flex items-center gap-2 mb-2">
                <Drumstick size={18} className="text-primary" />
                <span className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold">
                  #{focused.n} · {focused.short}
                </span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-charcoal mb-3">
                {focused.label}
              </h3>
              <p className="text-gray-700 leading-relaxed mb-5 text-sm md:text-base">
                {focused.desc}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <Metric label="Proteína" value={focused.protein} />
                <Metric label="Grasa" value={focused.fat} />
                <Metric label="Kcal" value={focused.kcal} />
              </div>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils size={14} className="text-primary" />
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Cocción</span>
                </div>
                <ul className="space-y-1.5">
                  {focused.tips.map((t, i) => (
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
          ) : (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-7"
            >
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
                <Drumstick size={14} /> Guía del corte
              </p>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-charcoal mb-2">
                {view === 'assembled' ? 'Explora el pollo pieza por pieza' : 'Elige un corte'}
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-4">
                {view === 'assembled'
                  ? 'Pulsa "Diseccionar" para separar las 5 piezas del pollo. Después toca cualquiera para descubrir sus usos culinarios, valor nutricional y el producto del catálogo.'
                  : 'Toca la pieza que te interesa para ver descripción, macros, tips de cocción y llevarla directo al carrito.'}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {CUTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleFocus(c.id)}
                    className="group flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-cream transition-colors"
                    aria-label={c.label}
                  >
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      {c.n}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-center text-gray-600 leading-tight">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
