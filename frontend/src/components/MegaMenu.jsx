// MegaMenu: dropdowns top-level (Productos, Sobre Avisander, Ayuda, Contacto)
// Desktop = hover/click; móvil = acordeón.

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  MapPin,
  ChefHat,
  HelpCircle,
  MessageSquare,
  Phone,
  Clock,
  ShoppingCart,
  Building2,
  PhoneCall
} from 'lucide-react'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'
import useClickOutside from '../hooks/useClickOutside'
import Icon3D from './Icon3D'

const PANELS = ['productos', 'sobre', 'ayuda', 'contacto']

// Categorías de productos con sus íconos 3D
const CATEGORIAS = [
  { label: 'Res',        icon3d: 'res',         slug: 'res' },
  { label: 'Cerdo',      icon3d: 'cerdo',        slug: 'cerdo' },
  { label: 'Pollo',      icon3d: 'pollo',        slug: 'pollo' },
  { label: 'Lácteos',    icon3d: 'lacteos',      slug: 'lacteos' },
  { label: 'Embutidos',  icon3d: 'embutidos',    slug: 'embutidos' },
  { label: 'Congelado',  icon3d: 'congelado',    slug: 'congelado' },
  { label: 'Fruver',     icon3d: 'fruver',       slug: 'fruver' },
  { label: 'Varios',     icon3d: 'varios',       slug: 'varios' },
]

// Reutilizable: card 3D estilo "Sobre Avisander"
function Card3D({ as: Tag = Link, to, href, onClick, children, className = '' }) {
  const props = to ? { to, onClick } : { href, onClick }
  return (
    <Tag
      {...props}
      className={`group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                  bg-gradient-to-br from-white via-orange-50/40 to-white
                  border border-orange-100/70
                  shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                  hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                  hover:-translate-y-0.5
                  transition-all duration-300 overflow-hidden ${className}`}
    >
      <span aria-hidden="true"
            className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                       bg-gradient-radial from-orange-200/60 to-transparent
                       blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      <span aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -left-6 w-20 h-20 rounded-full
                       bg-gradient-radial from-amber-100/50 to-transparent
                       blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
      {children}
      <span aria-hidden="true"
            className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                       bg-gradient-to-r from-transparent via-primary to-transparent
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Tag>
  )
}

function MegaMenu({ onNavigate }) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(null)
  const containerRef = useRef(null)

  useClickOutside(containerRef, () => setOpen(null), { enabled: open !== null })

  const closeAndNav = () => {
    setOpen(null)
    onNavigate?.()
  }

  const suppressHoverRef = useRef(false)
  const handleClick = (key) => {
    setOpen((o) => {
      if (o === key) {
        suppressHoverRef.current = true
        return null
      }
      return key
    })
  }
  const handleMouseEnter = (key) => {
    if (suppressHoverRef.current) return
    setOpen(key)
  }
  const handleMouseLeaveButton = () => {
    suppressHoverRef.current = false
  }

  const TopButton = ({ panelKey, label, icon: BtnIcon }) => (
    <button
      onClick={() => handleClick(panelKey)}
      onMouseEnter={() => handleMouseEnter(panelKey)}
      onMouseLeave={handleMouseLeaveButton}
      className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
        open === panelKey ? 'text-primary' : 'text-gray-700 hover:text-primary'
      }`}
      aria-haspopup="true"
      aria-expanded={open === panelKey}
    >
      {BtnIcon && <BtnIcon size={14} />}
      {label}
      <ChevronDown
        size={14}
        className={`transition-transform duration-300 ${open === panelKey ? 'rotate-180' : ''}`}
      />
      {open === panelKey && (
        <motion.span
          layoutId="megamenu-underline"
          className="absolute left-2 right-2 -bottom-0.5 h-0.5 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
    </button>
  )

  return (
    <nav
      ref={containerRef}
      onMouseLeave={() => setOpen(null)}
      className="bg-white border-y border-gray-200 relative"
    >
      <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <TopButton panelKey="productos" label="Productos" icon={ShoppingCart} />
        <TopButton panelKey="sobre" label="Sobre Avisander" icon={Building2} />
        <TopButton panelKey="ayuda" label="Ayuda" icon={HelpCircle} />
        <TopButton panelKey="contacto" label="Contacto" icon={Phone} />
        <Link
          to="/recetas"
          onClick={closeAndNav}
          className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary ml-auto"
        >
          <ChefHat size={14} /> Recetas
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={open}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.25, ease: 'easeOut' }
            }}
            className="absolute left-0 right-0 top-full bg-white shadow-xl border-b border-gray-200 z-40 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6">

              {/* PANEL: Productos */}
              {open === 'productos' && (
                <div className="grid grid-cols-4 md:grid-cols-4 gap-3 max-w-4xl">
                  {CATEGORIAS.map(({ label, icon3d, slug }) => (
                    <Link
                      key={slug}
                      to={`/productos?category=${slug}`}
                      onClick={closeAndNav}
                      className="group relative flex flex-col items-start gap-1.5 p-4 rounded-2xl
                                 bg-gradient-to-br from-white via-orange-50/40 to-white
                                 border border-orange-100/70
                                 shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                                 hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                                 hover:-translate-y-0.5
                                 transition-all duration-300 overflow-hidden"
                    >
                      <span aria-hidden="true"
                            className="pointer-events-none absolute -top-6 -right-6 w-16 h-16 rounded-full
                                       bg-gradient-radial from-orange-200/60 to-transparent
                                       blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 transition-transform duration-300
                                      group-hover:scale-110 group-hover:-rotate-3">
                        <Icon3D name={icon3d} size="sm" />
                      </div>
                      <span className="relative z-10 font-display font-semibold text-xs text-charcoal leading-tight">
                        {label}
                      </span>
                      <span aria-hidden="true"
                            className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full
                                       bg-gradient-to-r from-transparent via-primary to-transparent
                                       opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  ))}
                </div>
              )}

              {/* PANEL: Sobre Avisander */}
              {open === 'sobre' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
                  {[
                    { to: '/nosotros', icon3d: 'building', label: 'Nosotros', desc: 'Misión, visión y valores' },
                    { to: '/equipo', icon3d: 'users', label: 'Nuestro equipo', desc: 'Personas detrás de la marca' },
                    { to: '/politica-privacidad', icon3d: 'shield', label: 'Política de privacidad', desc: 'Tratamiento de datos personales' },
                    { to: '/politica-sarlaft', icon3d: 'shield-alert', label: 'Política SARLAFT', desc: 'Prevención LA/FT/FPADM' }
                  ].map(({ to, icon3d, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                                 bg-gradient-to-br from-white via-orange-50/40 to-white
                                 border border-orange-100/70
                                 shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                                 hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                                 hover:-translate-y-0.5
                                 transition-all duration-300 overflow-hidden"
                    >
                      <span aria-hidden="true"
                            className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                       bg-gradient-radial from-orange-200/60 to-transparent
                                       blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                      <span aria-hidden="true"
                            className="pointer-events-none absolute -bottom-10 -left-6 w-20 h-20 rounded-full
                                       bg-gradient-radial from-amber-100/50 to-transparent
                                       blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
                      <div className="relative z-10 transition-transform duration-300
                                      group-hover:scale-110 group-hover:-rotate-3">
                        <Icon3D name={icon3d} size="md" />
                      </div>
                      <span className="relative z-10 font-display font-semibold text-sm text-charcoal leading-tight">
                        {label}
                      </span>
                      <span className="relative z-10 text-[11px] text-gray-500 leading-snug">
                        {desc}
                      </span>
                      <span aria-hidden="true"
                            className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                                       bg-gradient-to-r from-transparent via-primary to-transparent
                                       opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  ))}
                </div>
              )}

              {/* PANEL: Ayuda — estilo card 3D, grid 2 columnas */}
              {open === 'ayuda' && (
                <div className="grid grid-cols-2 gap-4 max-w-2xl">
                  {[
                    { to: '/ayuda', icon3d: 'info', label: 'Centro de ayuda', desc: 'Preguntas frecuentes' },
                    { to: '/pqrs', icon3d: 'alert', label: 'PQRS', desc: 'Petición, queja, reclamo o sugerencia' }
                  ].map(({ to, icon3d, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                                 bg-gradient-to-br from-white via-orange-50/40 to-white
                                 border border-orange-100/70
                                 shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                                 hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                                 hover:-translate-y-0.5
                                 transition-all duration-300 overflow-hidden"
                    >
                      <span aria-hidden="true"
                            className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                       bg-gradient-radial from-orange-200/60 to-transparent
                                       blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                      <span aria-hidden="true"
                            className="pointer-events-none absolute -bottom-10 -left-6 w-20 h-20 rounded-full
                                       bg-gradient-radial from-amber-100/50 to-transparent
                                       blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
                      <div className="relative z-10 transition-transform duration-300
                                      group-hover:scale-110 group-hover:-rotate-3">
                        <Icon3D name={icon3d} size="md" />
                      </div>
                      <span className="relative z-10 font-display font-semibold text-sm text-charcoal leading-tight">
                        {label}
                      </span>
                      <span className="relative z-10 text-[11px] text-gray-500 leading-snug">
                        {desc}
                      </span>
                      <span aria-hidden="true"
                            className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                                       bg-gradient-to-r from-transparent via-primary to-transparent
                                       opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  ))}
                </div>
              )}

              {/* PANEL: Contacto — estilo card 3D, grid 2x2 / 4 columnas */}
              {open === 'contacto' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">

                  {/* Teléfono */}
                  <a
                    href={telLink(settings.whatsapp_number)}
                    onClick={closeAndNav}
                    className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                               bg-gradient-to-br from-white via-orange-50/40 to-white
                               border border-orange-100/70
                               shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                               hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                               hover:-translate-y-0.5
                               transition-all duration-300 overflow-hidden"
                  >
                    <span aria-hidden="true"
                          className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                     bg-gradient-radial from-orange-200/60 to-transparent
                                     blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 transition-transform duration-300
                                    group-hover:scale-110 group-hover:-rotate-3">
                      <Icon3D name="phone" size="md" />
                    </div>
                    <span className="relative z-10 font-display font-semibold text-sm text-charcoal">Teléfono</span>
                    <span className="relative z-10 text-[11px] text-gray-500">{formatPhone(settings.whatsapp_number)}</span>
                    <span aria-hidden="true"
                          className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                                     bg-gradient-to-r from-transparent via-primary to-transparent
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={whatsappLink(settings.whatsapp_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeAndNav}
                    className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                               bg-gradient-to-br from-white via-emerald-50/40 to-white
                               border border-emerald-100/70
                               shadow-[0_2px_12px_-4px_rgba(16,185,129,0.12)]
                               hover:shadow-[0_8px_28px_-6px_rgba(16,185,129,0.35)]
                               hover:-translate-y-0.5
                               transition-all duration-300 overflow-hidden"
                  >
                    <span aria-hidden="true"
                          className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                     bg-gradient-radial from-emerald-200/60 to-transparent
                                     blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 transition-transform duration-300
                                    group-hover:scale-110 group-hover:-rotate-3">
                      <Icon3D name="whatsapp-chat" size="md" />
                    </div>
                    <span className="relative z-10 font-display font-semibold text-sm text-charcoal">WhatsApp</span>
                    <span className="relative z-10 text-[11px] text-gray-500">Escribir ahora</span>
                    <span aria-hidden="true"
                          className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                                     bg-gradient-to-r from-transparent via-emerald-500 to-transparent
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>

                  {/* Horarios */}
                  <div
                    className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                               bg-gradient-to-br from-white via-amber-50/40 to-white
                               border border-amber-100/70
                               shadow-[0_2px_12px_-4px_rgba(199,155,91,0.12)]
                               overflow-hidden"
                  >
                    <span aria-hidden="true"
                          className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                     bg-gradient-radial from-amber-200/60 to-transparent
                                     blur-2xl opacity-60" />
                    <div className="relative z-10">
                      <Icon3D name="clock" size="md" />
                    </div>
                    <span className="relative z-10 font-display font-semibold text-sm text-charcoal">Horarios</span>
                    <span className="relative z-10 text-[11px] text-gray-500 leading-relaxed">
                      L–S {settings.business_hours_weekday}<br />
                      D {settings.business_hours_weekend}
                    </span>
                  </div>

                  {/* Visítanos */}
                  <Link
                    to="/ubicacion"
                    onClick={closeAndNav}
                    className="group relative flex flex-col items-start gap-2 p-5 rounded-2xl
                               bg-gradient-to-br from-white via-orange-50/40 to-white
                               border border-orange-100/70
                               shadow-[0_2px_12px_-4px_rgba(245,130,32,0.12)]
                               hover:shadow-[0_8px_28px_-6px_rgba(245,130,32,0.35)]
                               hover:-translate-y-0.5
                               transition-all duration-300 overflow-hidden"
                  >
                    <span aria-hidden="true"
                          className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full
                                     bg-gradient-radial from-orange-200/60 to-transparent
                                     blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 transition-transform duration-300
                                    group-hover:scale-110 group-hover:-rotate-3">
                      <Icon3D name="delivery" size="md" />
                    </div>
                    <span className="relative z-10 font-display font-semibold text-sm text-charcoal">Visítanos</span>
                    <span className="relative z-10 text-[11px] text-gray-500">Mapa y cómo llegar</span>
                    <span aria-hidden="true"
                          className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full
                                     bg-gradient-to-r from-transparent via-primary to-transparent
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default MegaMenu
