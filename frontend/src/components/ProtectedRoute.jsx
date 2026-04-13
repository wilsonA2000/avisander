import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
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
    // Redirect to login, saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // User doesn't have required role, redirect to home
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
