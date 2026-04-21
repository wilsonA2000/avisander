import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, requiredRole, requiredStatus }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Para rutas gated por status (ej: /mayoristas) enviamos a la landing
    // informativa en vez del login crudo. La landing explica el programa y
    // ofrece CTAs a login/registro — mejor UX y mejor conversión.
    if (requiredStatus === 'wholesaler_approved') {
      return <Navigate to="/mayoristas/solicitar" replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  if (requiredStatus === 'wholesaler_approved') {
    if (user?.role === 'admin') return children
    if (user?.wholesaler_status !== 'approved') {
      return <Navigate to="/mayoristas/solicitar" replace />
    }
  }

  return children
}

export default ProtectedRoute
