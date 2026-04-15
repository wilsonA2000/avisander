// MegaMenu: 4 dropdowns top-level (Productos, Sobre Avisander, Ayuda, Contacto)
// Reemplaza la antigua barra horizontal de categorías. Desktop = hover/click; móvil = acordeón.

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Building2,
  Users,
  MapPin,
  ChefHat,
  HelpCircle,
  MessageSquare,
  Phone,
  Clock,
  ArrowRight,
  Shield,
  ShieldAlert
} from 'lucide-react'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'
import useClickOutside from '../hooks/useClickOutside'

const PANELS = ['sobre', 'ayuda', 'contacto']

function MegaMenu({ onNavigate }) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(null)
  const containerRef = useRef(null)

  useClickOutside(containerRef, () => setOpen(null), { enabled: open !== null })

  const closeAndNav = () => {
    setOpen(null)
    onNavigate?.()
  }

  const togglePanel = (key) => setOpen((o) => (o === key ? null : key))

  // Cuando el usuario cierra a click, evitamos que el onMouseEnter inmediato lo reabra
  // hasta que retire el cursor del botón.
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

  const TopButton = ({ panelKey, label }) => (
    <button
      onClick={() => handleClick(panelKey)}
      onMouseEnter={() => handleMouseEnter(panelKey)}
      onMouseLeave={handleMouseLeaveButton}
      className={`relative inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors ${
        open === panelKey ? 'text-primary' : 'text-gray-700 hover:text-primary'
      }`}
      aria-haspopup="true"
      aria-expanded={open === panelKey}
    >
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
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
        >
          Productos
        </Link>
        <TopButton panelKey="sobre" label="Sobre Avisander" />
        <TopButton panelKey="ayuda" label="Ayuda" />
        <TopButton panelKey="contacto" label="Contacto" />
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
              {open === 'sobre' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
                  {[
                    { to: '/nosotros', Icon: Building2, label: 'Nosotros', desc: 'Misión, visión y valores' },
                    { to: '/equipo', Icon: Users, label: 'Nuestro equipo', desc: 'Personas detrás de la marca' },
                    { to: '/politica-privacidad', Icon: Shield, label: 'Política de privacidad', desc: 'Tratamiento de datos personales' },
                    { to: '/politica-sarlaft', Icon: ShieldAlert, label: 'Política SARLAFT', desc: 'Prevención LA/FT/FPADM' }
                  ].map(({ to, Icon, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon size={18} />
                      </div>
                      <span className="font-medium text-sm text-charcoal">{label}</span>
                      <span className="text-xs text-gray-500">{desc}</span>
                    </Link>
                  ))}
                </div>
              )}

              {open === 'ayuda' && (
                <div className="grid grid-cols-2 gap-3 max-w-xl">
                  {[
                    { to: '/ayuda', Icon: HelpCircle, label: 'Centro de ayuda', desc: 'Preguntas frecuentes' },
                    { to: '/pqrs', Icon: MessageSquare, label: 'PQRS', desc: 'Petición, queja, reclamo o sugerencia' }
                  ].map(({ to, Icon, label, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeAndNav}
                      className="group flex items-start gap-3 p-4 rounded-xl hover:bg-cream transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-charcoal">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {open === 'contacto' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
                  <a
                    href={telLink(settings.whatsapp_number)}
                    onClick={closeAndNav}
                    className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Phone size={18} />
                    </div>
                    <span className="font-medium text-sm text-charcoal">Teléfono</span>
                    <span className="text-xs text-gray-500">{formatPhone(settings.whatsapp_number)}</span>
                  </a>

                  <a
                    href={whatsappLink(settings.whatsapp_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeAndNav}
                    className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <MessageSquare size={18} />
                    </div>
                    <span className="font-medium text-sm text-charcoal">WhatsApp</span>
                    <span className="text-xs text-gray-500">Escribir ahora</span>
                  </a>

                  <div className="flex flex-col gap-1 p-4 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center mb-1">
                      <Clock size={18} />
                    </div>
                    <span className="font-medium text-sm text-charcoal">Horarios</span>
                    <span className="text-xs text-gray-500">
                      L–S {settings.business_hours_weekday}<br />
                      D {settings.business_hours_weekend}
                    </span>
                  </div>

                  <Link
                    to="/ubicacion"
                    onClick={closeAndNav}
                    className="group flex flex-col gap-1 p-4 rounded-xl hover:bg-cream transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:bg-primary group-hover:text-white transition-colors">
                      <MapPin size={18} />
                    </div>
                    <span className="font-medium text-sm text-charcoal">Visítanos</span>
                    <span className="text-xs text-gray-500">Mapa y cómo llegar</span>
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
