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
  ShoppingCart,
  Building2,
  PhoneCall,
  Users,
  Shield,
  ShieldAlert,
  Info,
  AlertTriangle,
  Truck
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
        <Link
          to="/productos"
          onClick={closeAndNav}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
        >
          <ShoppingCart size={14} />
          Productos
        </Link>
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
            <div className="container mx-auto px-4 py-3">

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
                <div className="flex items-start gap-1">
                  {[
                    { to: '/nosotros', Icon: Building2, label: 'Nosotros', desc: 'Misión y valores' },
                    { to: '/equipo', Icon: Users, label: 'Nuestro equipo', desc: 'Quiénes somos' },
                    { to: '/politica-privacidad', Icon: Shield, label: 'Privacidad', desc: 'Datos personales' },
                    { to: '/politica-sarlaft', Icon: ShieldAlert, label: 'SARLAFT', desc: 'Prevención LA/FT' }
                  ].map(({ to, Icon, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg
                                 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0
                                      group-hover:bg-primary/15 group-hover:scale-110 group-hover:-rotate-6
                                      transition-all duration-300 ease-out">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-800">{label}</span>
                        <span className="block text-[11px] text-gray-400">{desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* PANEL: Ayuda */}
              {open === 'ayuda' && (
                <div className="flex gap-2 max-w-xl">
                  {[
                    { to: '/ayuda', Icon: HelpCircle, label: 'Centro de ayuda', desc: 'Preguntas frecuentes' },
                    { to: '/pqrs', Icon: MessageSquare, label: 'PQRS', desc: 'Peticiones, quejas, reclamos' }
                  ].map(({ to, Icon, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg
                                 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0
                                      group-hover:bg-primary/15 group-hover:scale-110 group-hover:-rotate-6
                                      transition-all duration-300 ease-out">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-800">{label}</span>
                        <span className="block text-[11px] text-gray-400">{desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* PANEL: Contacto */}
              {open === 'contacto' && (
                <div className="flex items-start gap-1">

                  <a
                    href={telLink(settings.whatsapp_number)}
                    onClick={closeAndNav}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg
                               hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0
                                    group-hover:bg-primary/15 group-hover:scale-110 group-hover:-rotate-6
                                    transition-all duration-300 ease-out">
                      <Phone size={16} className="text-primary" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-800">Teléfono</span>
                      <span className="block text-[11px] text-gray-400">{formatPhone(settings.whatsapp_number)}</span>
                    </div>
                  </a>

                  <a
                    href={whatsappLink(settings.whatsapp_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeAndNav}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg
                               hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0
                                    group-hover:bg-emerald-100 group-hover:scale-110 group-hover:-rotate-6
                                    transition-all duration-300 ease-out">
                      <MessageSquare size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-800">WhatsApp</span>
                      <span className="block text-[11px] text-gray-400">Escribir ahora</span>
                    </div>
                  </a>

                  <Link
                    to="/ubicacion"
                    onClick={closeAndNav}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg
                               hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0
                                    group-hover:bg-primary/15 group-hover:scale-110 group-hover:-rotate-6
                                    transition-all duration-300 ease-out">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-800">Visítanos</span>
                      <span className="block text-[11px] text-gray-400">Mapa y cómo llegar</span>
                    </div>
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
