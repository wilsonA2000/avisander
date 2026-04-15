import { createContext, useContext, useEffect, useState } from 'react'
import { api, setTokens, clearTokens } from '../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password }, { skipAuth: true })
    setTokens(data)
    setUser(data.user)
    return data
  }

  const register = async (userData) => {
    const data = await api.post('/api/auth/register', userData, { skipAuth: true })
    setTokens(data)
    setUser(data.user)
    return data
  }

  const forgotPassword = (email) =>
    api.post('/api/auth/forgot-password', { email }, { skipAuth: true })

  const resetPassword = (token, password) =>
    api.post('/api/auth/reset-password', { token, password }, { skipAuth: true })

  // Refresca desde /api/auth/me. Útil tras editar perfil para reflejar cambios en el header.
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
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/api/auth/logout', { refreshToken }, { skipAuth: true })
    } catch {
      /* ignore */
    }
    clearTokens()
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
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
