import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/productos', icon: Package, label: 'Productos' },
  { to: '/admin/categorias', icon: FolderOpen, label: 'Categorias' },
  { to: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuracion' },
]

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Avisander</span>
            <span className="text-gray-400 text-sm">Admin</span>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-white">{user?.name}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Cerrar sesion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
            <div className="lg:hidden"></div>
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Ver tienda
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
