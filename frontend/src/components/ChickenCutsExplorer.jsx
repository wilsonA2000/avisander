import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Drumstick, Utensils, X } from 'lucide-react'
import { api } from '../lib/apiClient'

const CUTS = [
  {
    id: 'pechuga', label: 'Pechuga', image: '/cut-pechuga.webp',
    short: 'El magro por excelencia',
    desc: 'Alta proteína, baja grasa. Ideal para plancha, horno o ensaladas. Cocción rápida — 6 a 8 min por lado.',
    protein: '23g', fat: '1.2g', kcal: '165',
    tips: ['Marinar 30 min en limón y hierbas', 'Plancha a fuego medio-alto', 'No sobrecocinar: queda seca'],
    pos: { left: 18, top: 22 }, size: 14, curve: -14, searchTerm: 'pechuga'
  },
  {
    id: 'muslos', label: 'Muslos', image: '/real-pollo-muslo.webp',
    short: 'Jugosos y con sabor',
    desc: 'Carne oscura con más sabor y menos riesgo de secarse. Perfecto para guisos, sudado, asado lento.',
    protein: '19g', fat: '10g', kcal: '209',
    tips: ['Dorar piel primero en sartén', 'Terminar al horno 25 min a 180°C', 'Va bien con papas y cebolla caramelizada'],
    pos: { left: 82, top: 22 }, size: 14, curve: 14, searchTerm: 'muslo'
  },
  {
    id: 'alas', label: 'Alas', image: '/real-pollo-ala.webp',
    short: 'Para picar en grande',
    desc: 'Sabor intenso, piel crujiente al freír u hornear. Clásico BBQ, snack con salsa o aperitivo compartido.',
    protein: '18g', fat: '7g', kcal: '203',
    tips: ['Marinar con soja, miel y ajo', 'Hornear a 200°C 25 min + broil final', 'Acompañar con salsa ranch o blue cheese'],
    pos: { left: 11, top: 52 }, size: 14, curve: 16, searchTerm: 'alas'
  },
  {
    id: 'contramuslos', label: 'Contramuslos', image: '/cut-contramuslo.webp',
    short: 'El favorito de los chefs',
    desc: 'Parte superior de la pierna, con piel y hueso. Mantiene jugosidad, perfecto al horno, guisado o ahumado.',
    protein: '20g', fat: '11g', kcal: '215',
    tips: ['Sellar piel 4 min a fuego alto', 'Terminar al horno 20 min a 190°C', 'Ideal para pollo desmechado'],
    pos: { left: 89, top: 52 }, size: 14, curve: -16, searchTerm: 'contramuslo'
  },
  {
    id: 'perniles', label: 'Perniles', image: '/cut-pernil.webp',
    short: 'Favorito de los niños',
    desc: 'Pierna completa con muslo y contramuslo. Hueso grande, cocción pareja, estrella de parrilla y almuerzos familiares.',
    protein: '16g', fat: '9g', kcal: '172',
    tips: ['Marinar 4h con paprika y ajo', 'Parrilla a fuego indirecto 35 min', 'Rotar 2 veces para dorado uniforme'],
    pos: { left: 18, top: 78 }, size: 14, curve: 18, searchTerm: 'pernil'
  },
  {
    id: 'rabadilla', label: 'Rabadilla', image: '/cut-rabadilla.webp',
    short: 'La base de un buen caldo',
    desc: 'Menos carne pero más sabor. Ideal para caldos, fondos y sudados tradicionales colombianos.',
    protein: '12g', fat: '14g', kcal: '180',
    tips: ['Tostar 10 min al horno antes de hervir', 'Caldo con puerro, zanahoria y apio', 'Colar antes de usar de base'],
    pos: { left: 82, top: 78 }, size: 14, curve: -18, searchTerm: 'rabadilla'
  }
]

const VISCERAS = [
  {
    id: 'higado', label: 'Hígado', image: '/cut-higado.webp',
    short: 'Rico en hierro y vitamina A',
    desc: 'Textura suave, sabor intenso. Se prepara encebollado, en paté o salteado con hierbas.',
    protein: '17g', fat: '5g', kcal: '119', searchTerm: 'higado'
  },
  {
    id: 'molleja', label: 'Molleja', image: '/cut-molleja.webp',
    short: 'Clásico de parrilla',
    desc: 'Textura firme, sabor profundo. Perfecta en parrilla, guisos o al ajillo.',
    protein: '18g', fat: '2g', kcal: '94', searchTerm: 'molleja'
  },
  {
    id: 'corazon', label: 'Corazón', image: '/cut-corazon.webp',
    short: 'Pequeño y sabroso',
    desc: 'Carne magra, sabor pronunciado. Se asan en brocheta, parrilla o salteados.',
    protein: '16g', fat: '7g', kcal: '153', searchTerm: 'corazon'
  }
]

const CENTER = { x: 50, y: 50 }

function ChickenCutsExplorer() {
  const [focusedId, setFocusedId] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const [products, setProducts] = useState({})

  useEffect(() => {
    let cancelled = false
    api.get('/api/products?per_page=200', { skipAuth: true })
      .then((data) => {
        if (cancelled) return
        const list = data.items || data || []
        const byCut = {}
        for (const cut of [...CUTS, ...VISCERAS]) {
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

  const focused = [...CUTS, ...VISCERAS].find((c) => c.id === focusedId)
  const product = focused ? products[focused.id] : null
  const activeId = hoverId || focusedId

  return (
    <div className="space-y-8">
      {/* Escenario editorial */}
      <div className="relative rounded-[28px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(83,60,30,0.25)] border border-amber-100/50">
        {/* Fondo papel crema con textura sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, #fcf4e4 0%, #efe3c8 100%)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent 0, transparent 8px, rgba(139,92,46,0.025) 8px, rgba(139,92,46,0.025) 9px)`,
          }}
          aria-hidden="true"
        />

        {/* Ramas decorativas esquinas (hojas SVG de perejil minimalistas) */}
        <DecorativeHerbs />

        <div className="relative aspect-[4/5] md:aspect-[5/4] lg:aspect-[16/9] max-h-[720px]">
          {/* Cuerdas curvadas animadas (Bezier) pollo → presas */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CUTS.map((cut, idx) => {
              const isActive = activeId === cut.id
              // Bezier cuadrático: control point desplazado perpendicular al vector,
              // cantidad = cut.curve. Signo determina lado (derecha/izquierda).
              const dx = cut.pos.left - CENTER.x
              const dy = cut.pos.top - CENTER.y
              // Perpendicular normalizado
              const len = Math.sqrt(dx * dx + dy * dy) || 1
              const px = -dy / len
              const py = dx / len
              const mx = (CENTER.x + cut.pos.left) / 2 + px * cut.curve
              const my = (CENTER.y + cut.pos.top) / 2 + py * cut.curve
              const path = `M ${CENTER.x} ${CENTER.y} Q ${mx} ${my} ${cut.pos.left} ${cut.pos.top}`
              return (
                <motion.path
                  key={cut.id}
                  d={path}
                  fill="none"
                  stroke={isActive ? '#F58220' : '#6f5230'}
                  strokeWidth={isActive ? 1.4 : 1.0}
                  strokeDasharray="2.5 2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={isActive ? 1 : 0.85}
                  animate={{ strokeDashoffset: [0, -5] }}
                  transition={{
                    duration: 1.6 + idx * 0.2,
                    ease: 'linear',
                    repeat: Infinity
                  }}
                  style={{ filter: isActive ? 'drop-shadow(0 0 2px rgba(245,130,32,0.5))' : 'none' }}
                />
              )
            })}
          </svg>

          {/* Pollo entero centrado */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] max-w-[260px] z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="aspect-square rounded-[28px] bg-white ring-1 ring-amber-100 shadow-[0_24px_60px_-18px_rgba(83,60,30,0.32)] p-3 md:p-4"
            >
              <img
                src="/real-pollo-entero.webp"
                alt="Pollo entero Avisander"
                className="w-full h-full object-contain select-none"
                draggable="false"
              />
            </motion.div>
          </div>

          {/* Presas posicionadas alrededor */}
          {CUTS.map((cut, idx) => {
            const isActive = activeId === cut.id
            return (
              <motion.button
                key={cut.id}
                type="button"
                onClick={() => setFocusedId(cut.id)}
                onMouseEnter={() => setHoverId(cut.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(cut.id)}
                onBlur={() => setHoverId(null)}
                aria-label={cut.label}
                className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
                style={{ left: `${cut.pos.left}%`, top: `${cut.pos.top}%`, width: `${cut.size}%`, animationDelay: `${0.15 + idx * 0.08}s` }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="relative">
                  <div className={`aspect-square rounded-2xl bg-white overflow-hidden p-2 transition-all duration-300 ${
                    isActive
                      ? 'ring-2 ring-primary shadow-[0_14px_32px_-8px_rgba(245,130,32,0.4)]'
                      : 'ring-1 ring-amber-100/80 shadow-[0_8px_20px_-6px_rgba(83,60,30,0.22)]'
                  }`}>
                    <img
                      src={cut.image}
                      alt={cut.label}
                      className="w-full h-full object-contain select-none"
                      draggable="false"
                    />
                  </div>
                  <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-3 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'bg-white text-charcoal border border-amber-100 shadow-sm'
                  }`}>
                    {cut.label}
                  </span>
                </div>
              </motion.button>
            )
          })}

        </div>
      </div>

      {/* Panel de vísceras — estilo carta/cuadro aparte */}
      <div className="rounded-[24px] bg-white border border-amber-100/70 shadow-[0_12px_32px_-16px_rgba(83,60,30,0.18)] p-5 md:p-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
          <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-amber-700/80 font-semibold">
            Las vísceras
          </p>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {VISCERAS.map((v, idx) => {
            const isActive = activeId === v.id
            return (
              <motion.button
                key={v.id}
                type="button"
                onClick={() => setFocusedId(v.id)}
                onMouseEnter={() => setHoverId(v.id)}
                onMouseLeave={() => setHoverId(null)}
                aria-label={v.label}
                className="group flex flex-col items-center text-center focus:outline-none"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <div className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-cream/40 flex items-center justify-center p-2 md:p-3 transition-all duration-300 ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : 'ring-1 ring-amber-100'
                }`}>
                  <img
                    src={v.image}
                    alt={v.label}
                    className="w-full h-full object-contain select-none transition-transform duration-500 group-hover:scale-105"
                    draggable="false"
                    loading="lazy"
                  />
                </div>
                <p className={`mt-2 md:mt-3 font-display text-sm md:text-base font-bold transition-colors ${
                  isActive ? 'text-primary' : 'text-charcoal'
                }`}>
                  {v.label}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 leading-tight hidden md:block mt-0.5">
                  {v.short}
                </p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Ficha lateral modal-sheet con detalle */}
      <AnimatePresence>
        {focused && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
            onClick={() => setFocusedId(null)}
          >
            <motion.article
              key={focused.id}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              className="relative w-full md:max-w-lg bg-white rounded-t-[28px] md:rounded-[24px] shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setFocusedId(null)}
                className="absolute top-3 right-3 md:top-4 md:right-4 w-9 h-9 rounded-full bg-cream hover:bg-amber-100 flex items-center justify-center text-charcoal transition-colors z-10"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
              <div className="aspect-[4/3] bg-cream/40 flex items-center justify-center p-6">
                <img src={focused.image} alt={focused.label} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="p-5 md:p-7">
                <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-2">
                  <Drumstick size={12} /> {focused.short}
                </p>
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
                {focused.tips && (
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
                )}
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
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-cream/70 rounded-xl p-2.5 text-center border border-amber-100">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-base font-bold text-charcoal mt-0.5">{value}</p>
    </div>
  )
}

function DecorativeHerbs() {
  return (
    <>
      <svg className="absolute -top-2 -left-2 w-24 h-24 md:w-32 md:h-32 opacity-50 pointer-events-none" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="#7a8c5a">
          <path d="M8 8 Q18 12 22 22 Q20 14 14 10 Z" />
          <path d="M12 18 Q20 20 24 28 Q22 22 16 18 Z" />
          <path d="M8 26 Q16 28 22 34 Q18 28 12 26 Z" />
        </g>
      </svg>
      <svg className="absolute -bottom-2 -right-2 w-24 h-24 md:w-32 md:h-32 opacity-50 pointer-events-none rotate-180" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="#7a8c5a">
          <path d="M8 8 Q18 12 22 22 Q20 14 14 10 Z" />
          <path d="M12 18 Q20 20 24 28 Q22 22 16 18 Z" />
          <path d="M8 26 Q16 28 22 34 Q18 28 12 26 Z" />
        </g>
      </svg>
    </>
  )
}

export default ChickenCutsExplorer
