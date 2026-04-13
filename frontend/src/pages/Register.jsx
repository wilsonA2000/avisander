import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es valido'
    }

    if (!formData.password) {
      newErrors.password = 'La contrasena es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contrasena debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      await register(formData)
      navigate('/mi-cuenta')
    } catch (err) {
      setErrors({ submit: err.message || 'Error al registrar. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h1>

          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                autoComplete="name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefono (opcional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
