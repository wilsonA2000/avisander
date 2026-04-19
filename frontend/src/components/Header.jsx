import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  ChefHat,
  Building2,
  Users as UsersIcon,
  MapPin,
  HelpCircle,
  MessageSquare,
  Phone,
  User
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'
import { api } from '../lib/apiClient'
import SearchBar from './SearchBar'
import MegaMenu from './MegaMenu'
import CartMiniPreview from './CartMiniPreview'
import Icon3D from './Icon3D'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState(null) // productos|sobre|ayuda|contacto|null
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false)
  const cartPreviewTimerRef = useRef(null)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const { settings } = useSettings()
  const [bumpKey, setBumpKey] = useState(0)
  const prevCount = useRef(itemCount)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/api/categories', { skipAuth: true })
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (itemCount > prevCount.current) setBumpKey((k) => k + 1)
    prevCount.current = itemCount
  }, [itemCount])

  useEffect(() => {
    const onBump = () => setBumpKey((k) => k + 1)
    window.addEventListener('avisander:cart-bump', onBump)
    return () => window.removeEventListener('avisander:cart-bump', onBump)
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Fila superior */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0" aria-label="Avisander - Inicio">
            <img
              src="/logo.webp"
              alt="Avisander"
              width="140"
              height="56"
              className="h-10 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Search (hidden en mobile muy pequeño, aparece abajo) */}
          <div className="hidden sm:block flex-1 max-w-3xl mx-auto">
            <SearchBar categories={categories} />
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-dark text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    Panel Admin
                  </Link>
                ) : (
                  <Link
                    to="/mi-cuenta"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary text-sm"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <User size={18} />
                    )}
                    <span className="max-w-[120px] truncate">{user?.name || 'Mi Cuenta'}</span>
                  </Link>
                )}
                <button onClick={logout} className="text-gray-400 hover:text-primary text-sm">
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-primary text-sm font-medium">
                Iniciar sesión
              </Link>
            )}

            <div
              className="relative"
              onMouseEnter={() => {
                if (cartPreviewTimerRef.current) clearTimeout(cartPreviewTimerRef.current)
                setCartPreviewOpen(true)
              }}
              onMouseLeave={() => {
                // Pequeño delay para poder mover el cursor al dropdown sin que se cierre.
                cartPreviewTimerRef.current = setTimeout(() => setCartPreviewOpen(false), 200)
              }}
            >
              <Link
                to="/carrito"
                className="relative p-2 text-gray-700 hover:text-primary transition-colors inline-block"
                aria-label="Carrito de compras"
              >
                <span key={`d-${bumpKey}`} className={bumpKey ? 'inline-block animate-cart-bounce' : 'inline-block'}>
                  <Icon3D name="shopping-cart" size="xs" alt="Carrito" />
                </span>
                {itemCount > 0 && (
                  <span
                    key={`db-${bumpKey}`}
                    className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center animate-badge-pop"
                  >
                    {itemCount}
                  </span>
                )}
              </Link>
              <CartMiniPreview open={cartPreviewOpen} />
            </div>
          </div>

          {/* Mobile cart + menu */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/carrito" className="relative p-2 text-gray-700" aria-label="Carrito">
              <span key={`m-${bumpKey}`} className={bumpKey ? 'inline-block animate-cart-bounce' : 'inline-block'}>
                <Icon3D name="shopping-cart" size="xs" alt="Carrito" />
              </span>
              {itemCount > 0 && (
                <span key={`mb-${bumpKey}`} className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center animate-badge-pop">
                  {itemCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-700" aria-label="Menú">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search mobile */}
        <div className="sm:hidden pb-3">
          <SearchBar categories={categories} />
        </div>
      </div>

      {/* Segunda fila: MegaMenu (solo desktop) */}
      <div className="hidden md:block">
        <MegaMenu onNavigate={() => setMobileSection(null)} />
      </div>

      {/* Menú móvil con acordeones */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 max-h-[80vh] overflow-y-auto">
            <Link
              to="/productos"
              onClick={() => setIsMenuOpen(false)}
              className="block py-3 text-sm font-medium text-charcoal border-b border-gray-100"
            >
              Productos
            </Link>

            <MobileSection
              label="Sobre Avisander"
              expanded={mobileSection === 'sobre'}
              onToggle={() => setMobileSection(mobileSection === 'sobre' ? null : 'sobre')}
            >
              {[
                { to: '/nosotros', Icon: Building2, label: 'Nosotros' },
                { to: '/equipo', Icon: UsersIcon, label: 'Nuestro equipo' },
                { to: '/ubicacion', Icon: MapPin, label: 'Ubicación' },
                { to: '/recetas', Icon: ChefHat, label: 'Recetas' }
              ].map(({ to, Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-cream rounded"
                >
                  <Icon size={14} className="text-primary" />
                  {label}
                </Link>
              ))}
            </MobileSection>

            <MobileSection
              label="Ayuda"
              expanded={mobileSection === 'ayuda'}
              onToggle={() => setMobileSection(mobileSection === 'ayuda' ? null : 'ayuda')}
            >
              {[
                { to: '/ayuda', Icon: HelpCircle, label: 'Centro de ayuda' },
                { to: '/pqrs', Icon: MessageSquare, label: 'PQRS' }
              ].map(({ to, Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-cream rounded"
                >
                  <Icon size={14} className="text-primary" />
                  {label}
                </Link>
              ))}
            </MobileSection>

            <MobileSection
              label="Contacto"
              expanded={mobileSection === 'contacto'}
              onToggle={() => setMobileSection(mobileSection === 'contacto' ? null : 'contacto')}
            >
              <a href={telLink(settings.whatsapp_number)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-cream rounded">
                <Phone size={14} className="text-primary" />
                {formatPhone(settings.whatsapp_number)}
              </a>
              <a
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-cream rounded"
              >
                <MessageSquare size={14} />
                Escribir por WhatsApp
              </a>
            </MobileSection>

            <div className="border-t mt-4 pt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <Link to="/admin" className="block px-3 py-2 text-sm font-medium text-primary" onClick={() => setIsMenuOpen(false)}>
                      Panel Admin
                    </Link>
                  ) : (
                    <Link to="/mi-cuenta" className="block px-3 py-2 text-sm text-gray-700" onClick={() => setIsMenuOpen(false)}>
                      Mi Cuenta
                    </Link>
                  )}
                  <button onClick={() => { logout(); setIsMenuOpen(false) }} className="block w-full text-left px-3 py-2 text-sm text-gray-500">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2 text-sm font-medium text-primary" onClick={() => setIsMenuOpen(false)}>
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function MobileSection({ label, expanded, onToggle, children }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-gray-800"
      >
        {label}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && <div className="pb-3 space-y-1">{children}</div>}
    </div>
  )
}

export default Header
