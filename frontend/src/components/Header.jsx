import { Link } from 'react-router-dom'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">Avisander</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link to="/productos" className="text-gray-700 hover:text-primary transition-colors">
              Productos
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-gray-700 hover:text-primary transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Right Side - Cart and User */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/carrito"
              className="relative p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Carrito de compras"
            >
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/mi-cuenta"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
                >
                  <User size={20} />
                  <span>{user?.name || 'Mi Cuenta'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-primary text-sm"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Iniciar Sesion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-3">
            <Link
              to="/carrito"
              className="relative p-2 text-gray-700"
              aria-label="Carrito de compras"
            >
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                to="/productos"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Productos
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/mi-cuenta"
                    className="text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mi Cuenta
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="text-left text-gray-500 hover:text-primary"
                  >
                    Cerrar Sesion
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-primary font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesion
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
