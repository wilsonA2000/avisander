import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, ChefHat } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../lib/apiClient'
import SearchBar from './SearchBar'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
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
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-primary tracking-tight">Avisander</span>
          </Link>

          {/* Search (hidden en mobile muy pequeño, aparece abajo) */}
          <div className="hidden sm:block flex-1 max-w-3xl mx-auto">
            <SearchBar categories={categories} />
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/mi-cuenta"
                  className="flex items-center gap-1 text-gray-700 hover:text-primary text-sm"
                >
                  <User size={18} />
                  <span className="max-w-[120px] truncate">{user?.name || 'Mi Cuenta'}</span>
                </Link>
                <button onClick={logout} className="text-gray-400 hover:text-primary text-sm">
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-primary text-sm font-medium">
                Iniciar sesión
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary-dark text-sm font-medium">
                Admin
              </Link>
            )}

            <Link
              to="/carrito"
              className="relative p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Carrito de compras"
            >
              <span key={`d-${bumpKey}`} className={bumpKey ? 'inline-block animate-cart-bounce' : 'inline-block'}>
                <ShoppingCart size={24} />
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
          </div>

          {/* Mobile cart + menu */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/carrito" className="relative p-2 text-gray-700" aria-label="Carrito">
              <span key={`m-${bumpKey}`} className={bumpKey ? 'inline-block animate-cart-bounce' : 'inline-block'}>
                <ShoppingCart size={24} />
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

      {/* Segunda fila: categorías scrolleables */}
      <nav className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 text-sm">
            <NavLink
              to="/productos"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-white'
                }`
              }
            >
              Todos los productos
            </NavLink>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/productos?category=${encodeURIComponent(c.name.toLowerCase())}`}
                className="px-3 py-1.5 rounded-full whitespace-nowrap text-gray-700 hover:bg-white transition-colors"
              >
                {c.icon} {c.name}
              </Link>
            ))}
            <Link
              to="/recetas"
              className="px-3 py-1.5 rounded-full whitespace-nowrap text-gray-700 hover:bg-white transition-colors ml-auto flex items-center gap-1"
            >
              <ChefHat size={14} /> Recetas
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t container mx-auto px-4">
          <nav className="flex flex-col gap-3">
            <Link to="/" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
            <Link to="/productos" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Productos</Link>
            <Link to="/recetas" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Recetas</Link>
            {isAdmin && <Link to="/admin" className="text-primary font-medium" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
            {isAuthenticated ? (
              <>
                <Link to="/mi-cuenta" className="text-gray-700" onClick={() => setIsMenuOpen(false)}>Mi Cuenta</Link>
                <button onClick={() => { logout(); setIsMenuOpen(false) }} className="text-left text-gray-500">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="text-primary font-medium" onClick={() => setIsMenuOpen(false)}>
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
