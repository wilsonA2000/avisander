import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CategoryProducts from './pages/CategoryProducts'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MyAccount from './pages/MyAccount'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import PaymentResult from './pages/PaymentResult'
import OrderTracking from './pages/OrderTracking'
import NotFound from './pages/NotFound'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminOrders from './pages/admin/Orders'
import AdminSettings from './pages/admin/Settings'
import AdminRecipes from './pages/admin/Recipes'
import AdminMedia from './pages/admin/MediaLibrary'
import AdminCustomers from './pages/admin/Customers'
import AdminInventario from './pages/admin/Inventario'
import AdminProveedores from './pages/admin/Proveedores'
import AdminCompras from './pages/admin/Compras'
import AdminPqrs from './pages/admin/Pqrs'
import AdminEstudioMultimedia from './pages/admin/EstudioMultimedia'
import Nosotros from './pages/Nosotros'
import Equipo from './pages/Equipo'
import Ubicacion from './pages/Ubicacion'
import Ayuda from './pages/Ayuda'
import PqrsPage from './pages/Pqrs'
import PoliticaPrivacidad from './pages/PoliticaPrivacidad'
import PoliticaSarlaft from './pages/PoliticaSarlaft'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<Products />} />
        <Route path="producto/:id" element={<ProductDetail />} />
        <Route path="categoria/:slug" element={<CategoryProducts />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route path="recuperar-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="recetas" element={<Recipes />} />
        <Route path="recetas/:slug" element={<RecipeDetail />} />
        <Route path="pago/:reference" element={<PaymentResult />} />
        <Route path="pedido/:reference" element={<OrderTracking />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="equipo" element={<Equipo />} />
        <Route path="ubicacion" element={<Ubicacion />} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="pqrs" element={<PqrsPage />} />
        <Route path="politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="politica-sarlaft" element={<PoliticaSarlaft />} />
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
        <Route path="recetas" element={<AdminRecipes />} />
        <Route path="biblioteca" element={<AdminMedia />} />
        <Route path="clientes" element={<AdminCustomers />} />
        <Route path="inventario" element={<AdminInventario />} />
        <Route path="proveedores" element={<AdminProveedores />} />
        <Route path="compras" element={<AdminCompras />} />
        <Route path="pqrs" element={<AdminPqrs />} />
        <Route path="estudio-ai" element={<AdminEstudioMultimedia />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
