import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'

function Footer() {
  const { settings } = useSettings()

  return (
    <footer
      className="relative text-white"
      style={{ background: 'linear-gradient(to bottom, #0A0A0A 0%, #000000 100%)' }}
    >
      {/* La línea decorativa superior ahora la pinta el separador en Layout.jsx
          para evitar la doble línea (amarilla + naranja). */}
      <div className="container mx-auto px-4 pt-16 md:pt-20 pb-10">
        {/* Móvil: Brand full-width arriba, luego 2-col links, luego Contacto full-width.
             Desktop: 4 columnas iguales. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand — full-width en móvil */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-display text-2xl font-bold text-white mb-3">
              {settings.store_name || 'Avisander'}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Carnicería premium en Bucaramanga. Res, cerdo, pollo y especialidades. Calidad garantizada
              y entregas a domicilio.
            </p>
          </div>

          {/* Sobre Avisander — solo institucional */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">
              Sobre Avisander
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/nosotros" className="text-gray-400 hover:text-accent transition-colors">Nosotros</Link></li>
              <li><Link to="/equipo" className="text-gray-400 hover:text-accent transition-colors">Nuestro equipo</Link></li>
              <li><Link to="/politica-privacidad" className="text-gray-400 hover:text-accent transition-colors">Política de privacidad</Link></li>
              <li><Link to="/politica-sarlaft" className="text-gray-400 hover:text-accent transition-colors">Política SARLAFT</Link></li>
            </ul>
          </div>

          {/* Explora */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">Explora</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="text-gray-400 hover:text-accent transition-colors">Productos</Link></li>
              <li><Link to="/recetas" className="text-gray-400 hover:text-accent transition-colors">Recetas</Link></li>
              <li><Link to="/ubicacion" className="text-gray-400 hover:text-accent transition-colors">Ubicación</Link></li>
              <li><Link to="/ayuda" className="text-gray-400 hover:text-accent transition-colors">Centro de ayuda</Link></li>
              <li><Link to="/pqrs" className="text-gray-400 hover:text-accent transition-colors">PQRS</Link></li>
            </ul>
          </div>

          {/* Contacto — full-width en móvil */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-gray-400">
                <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                <span>{settings.store_address || 'Bucaramanga, Santander'}</span>
              </li>
              <li>
                <a href={telLink(settings.whatsapp_number)} className="flex items-center gap-2.5 text-gray-400 hover:text-accent transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>{formatPhone(settings.whatsapp_number)}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-gray-400 pt-1">
                <Clock size={14} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <div>Lun–Vie: {settings.business_hours_weekday}</div>
                  {settings.business_hours_saturday && (
                    <div>Sáb: {settings.business_hours_saturday}</div>
                  )}
                  <div className="text-gray-500 text-xs">{settings.business_hours_weekend}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-500 text-xs">
          <p>
            &copy; {new Date().getFullYear()} {settings.store_name || 'Avisander'}. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
