import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock } from 'lucide-react'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'

const SocialIcons = () => (
  <div className="flex items-center gap-3 mt-5">
    {/* Facebook */}
    <a
      href="https://www.facebook.com/profile.php?id=100083361763528"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-11 h-11 rounded-xl flex items-center justify-center
                 transition-all duration-300 hover:scale-110"
      style={{
        background: '#1877F2',
        boxShadow: '0 2px 8px rgba(24,119,242,0.25)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(24,119,242,0.55)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,119,242,0.25)'
      }}
      aria-label="Facebook de Avisander"
    >
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </a>

    {/* Instagram */}
    <a
      href="https://www.instagram.com/avisanderbga"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-11 h-11 rounded-xl flex items-center justify-center
                 transition-all duration-300 hover:scale-110"
      style={{
        background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
        boxShadow: '0 2px 8px rgba(220,39,67,0.25)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,39,67,0.55)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(220,39,67,0.25)'
      }}
      aria-label="Instagram de Avisander"
    >
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </a>

    {/* TikTok */}
    <a
      href="https://www.tiktok.com/@avisanderbga4"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-11 h-11 rounded-xl flex items-center justify-center
                 transition-all duration-300 hover:scale-110"
      style={{
        background: '#010101',
        boxShadow: '0 2px 8px rgba(1,1,1,0.35)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(105,201,208,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(1,1,1,0.35)'
      }}
      aria-label="TikTok de Avisander"
    >
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/>
      </svg>
    </a>
  </div>
)

function Footer() {
  const { settings } = useSettings()

  return (
    <footer
      className="relative text-white"
      style={{ background: 'linear-gradient(to bottom, #0A0A0A 0%, #000000 100%)' }}
    >
      <div className="container mx-auto px-4 pt-16 md:pt-20 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img
              src="/logo-transparent.png"
              alt="Avisander"
              className="h-20 md:h-24 w-auto object-contain mb-3 drop-shadow-lg"
            />
            <p className="font-display italic text-accent text-sm mb-3">
              Carnicería Premium · Bucaramanga
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Res, cerdo, pollo y especialidades con calidad garantizada.
              Entregas a domicilio en Bucaramanga.
            </p>
            <SocialIcons />
          </div>

          {/* Sobre Avisander */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">
              Sobre Avisander
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/nosotros"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/equipo"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Nuestro equipo
                </Link>
              </li>
              <li>
                <Link to="/politica-privacidad"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/politica-sarlaft"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Política SARLAFT
                </Link>
              </li>
            </ul>
          </div>

          {/* Explora */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">
              Explora
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/productos"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/recetas"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Recetas
                </Link>
              </li>
              <li>
                <Link to="/ubicacion"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Ubicación
                </Link>
              </li>
              <li>
                <Link to="/ayuda"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link to="/pqrs"
                  className="text-gray-400 hover:text-accent hover:translate-x-1
                             inline-block transition-all duration-200">
                  PQRS
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="font-display font-semibold text-white mb-4">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-gray-400">
                <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                <span>{settings.store_address || 'Bucaramanga, Santander'}</span>
              </li>
              <li>
                <a href={telLink(settings.whatsapp_number)}
                   className="flex items-center gap-2.5 text-gray-400 hover:text-accent
                              transition-colors duration-200">
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

        {/* Separador decorativo */}
        <div
          className="mt-10 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, #C79B5B, transparent)'
          }}
        />

        {/* Copyright */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2
                        text-gray-500 text-xs">
          <p>
            &copy; {new Date().getFullYear()} {settings.store_name || 'Avisander'}.
            Todos los derechos reservados.
          </p>
          <p>Hecho con ♥ en Bucaramanga</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
