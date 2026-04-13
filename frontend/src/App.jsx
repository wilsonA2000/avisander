import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import Products from './pages/Products'
import CategoryProducts from './pages/CategoryProducts'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import MyAccount from './pages/MyAccount'
import NotFound from './pages/NotFound'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminOrders from './pages/admin/Orders'
import AdminSettings from './pages/admin/Settings'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<Products />} />
        <Route path="categoria/:slug" element={<CategoryProducts />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route
          path="mi-cuenta"
          element={
            <ProtectedRoute>
              <MyAccount />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="configuracion" element={<AdminSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
