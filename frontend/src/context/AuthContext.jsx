import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pedimos /me siempre al montar. Si hay cookie httpOnly válida, el backend
    // devuelve el user; si no, 401 silencioso y el usuario queda como anónimo.
    api
      .get('/api/auth/me', { skipAuth: true })
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password }, { skipAuth: true })
    setUser(data.user)
    return data
  }

  const register = async (userData) => {
    const data = await api.post('/api/auth/register', userData, { skipAuth: true })
    setUser(data.user)
    return data
  }

  const forgotPassword = (email) =>
    api.post('/api/auth/forgot-password', { email }, { skipAuth: true })

  const resetPassword = (token, password) =>
    api.post('/api/auth/reset-password', { token, password }, { skipAuth: true })

  const refreshUser = async () => {
    try {
      const data = await api.get('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch (_e) {
      return null
    }
  }

  const updateProfile = async (payload) => {
    const data = await api.put('/api/auth/me', payload)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { skipAuth: true })
    } catch {
      /* ignore */
    }
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isApprovedMayorista: user?.wholesaler_status === 'approved' || user?.role === 'admin',
    wholesalerStatus: user?.wholesaler_status || null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
