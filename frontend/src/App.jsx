import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import IdleCursorPet from './components/IdleCursorPet'
import { usePageTracking } from './hooks/usePageTracking'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Home, Products y Cart son el camino crítico del cliente — eager para que
// el LCP no espere a un chunk.
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CategoryProducts from './pages/CategoryProducts'
import Cart from './pages/Cart'

// Todo lo demás es lazy: no lo carga el cliente hasta que navega allí.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const MyAccount = lazy(() => import('./pages/MyAccount'))
const Recipes = lazy(() => import('./pages/Recipes'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const PaymentResult = lazy(() => import('./pages/PaymentResult'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Nosotros = lazy(() => import('./pages/Nosotros'))
const Equipo = lazy(() => import('./pages/Equipo'))
const Ubicacion = lazy(() => import('./pages/Ubicacion'))
const Ayuda = lazy(() => import('./pages/Ayuda'))
const PqrsPage = lazy(() => import('./pages/Pqrs'))
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'))
const PoliticaSarlaft = lazy(() => import('./pages/PoliticaSarlaft'))
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'))
const CambiosDevoluciones = lazy(() => import('./pages/CambiosDevoluciones'))
const DespiecePollo = lazy(() => import('./pages/DespiecePollo'))

// Admin: bundle separado. El cliente público nunca lo descarga.
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminRecipes = lazy(() => import('./pages/admin/Recipes'))
const AdminMedia = lazy(() => import('./pages/admin/MediaLibrary'))
const AdminCustomers = lazy(() => import('./pages/admin/Customers'))
const AdminInventario = lazy(() => import('./pages/admin/Inventario'))
const AdminProveedores = lazy(() => import('./pages/admin/Proveedores'))
const AdminCompras = lazy(() => import('./pages/admin/Compras'))
const AdminPqrs = lazy(() => import('./pages/admin/Pqrs'))
const AdminReviews = lazy(() => import('./pages/admin/Reviews'))
// Estudio AI (Konva + FFmpeg wasm) pesa decenas de MB. Lazy obligatorio.
const AdminEstudioMultimedia = lazy(() => import('./pages/admin/EstudioMultimedia'))

function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function App() {
  usePageTracking()
  return (
    <>
    <IdleCursorPet />
    <Suspense fallback={<PageSkeleton />}>
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
        <Route
          path="cambiar-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
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
        <Route path="terminos-y-condiciones" element={<TerminosCondiciones />} />
        <Route path="cambios-devoluciones" element={<CambiosDevoluciones />} />
        <Route path="despiece/pollo" element={<DespiecePollo />} />
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
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="estudio-ai" element={<AdminEstudioMultimedia />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </>
  )
}

export default App
