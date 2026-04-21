import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useScrollToTop from '../hooks/useScrollToTop'

function Register() {
  useScrollToTop('#name')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    apply_wholesaler: false,
    business_name: '',
    nit: '',
    business_type: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (!passwordPolicy.test(formData.password)) {
      newErrors.password = 'Mínimo 8 caracteres, con mayúscula, minúscula y número'
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Las contraseñas no coinciden'
    }

    if (formData.apply_wholesaler) {
      if (!formData.business_name.trim()) newErrors.business_name = 'Razón social requerida'
      if (!formData.nit.trim()) newErrors.nit = 'NIT requerido'
      if (!formData.business_type.trim()) newErrors.business_type = 'Tipo de negocio requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const { passwordConfirm: _pc, ...rest } = formData
      // Si no marcó aplicar mayorista, no enviamos los campos del negocio.
      const payload = rest.apply_wholesaler
        ? rest
        : {
            name: rest.name,
            email: rest.email,
            password: rest.password,
            phone: rest.phone
          }
      await register(payload)
      navigate(formData.apply_wholesaler ? '/mi-cuenta?mayorista=pendiente' : '/mi-cuenta')
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
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, con mayúscula, minúscula y número.
              </p>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className={`input ${errors.passwordConfirm ? 'border-red-500' : ''}`}
                autoComplete="new-password"
              />
              {errors.passwordConfirm && (
                <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm}</p>
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

            <div className="border-t pt-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="apply_wholesaler"
                  name="apply_wholesaler"
                  type="checkbox"
                  checked={formData.apply_wholesaler}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-sm">
                  <span className="font-semibold text-charcoal flex items-center gap-1.5">
                    🤝 Quiero ser distribuidor mayorista
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Acceso a precios especiales y asesor comercial. Tu solicitud será revisada por nuestro equipo.
                  </span>
                </span>
              </label>

              {formData.apply_wholesaler && (
                <div className="mt-4 space-y-3 bg-orange-50/60 border border-orange-200 rounded-xl p-4">
                  <div>
                    <label htmlFor="business_name" className="block text-xs font-medium text-gray-700 mb-1">
                      Razón social
                    </label>
                    <input
                      id="business_name"
                      name="business_name"
                      type="text"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Restaurante La Brasa S.A.S"
                      className={`input ${errors.business_name ? 'border-red-500' : ''}`}
                    />
                    {errors.business_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="nit" className="block text-xs font-medium text-gray-700 mb-1">
                        NIT
                      </label>
                      <input
                        id="nit"
                        name="nit"
                        type="text"
                        value={formData.nit}
                        onChange={handleChange}
                        placeholder="900.123.456-7"
                        className={`input ${errors.nit ? 'border-red-500' : ''}`}
                      />
                      {errors.nit && <p className="text-red-500 text-xs mt-1">{errors.nit}</p>}
                    </div>

                    <div>
                      <label htmlFor="business_type" className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo de negocio
                      </label>
                      <select
                        id="business_type"
                        name="business_type"
                        value={formData.business_type}
                        onChange={handleChange}
                        className={`input ${errors.business_type ? 'border-red-500' : ''}`}
                      >
                        <option value="">Selecciona...</option>
                        <option value="restaurante">Restaurante</option>
                        <option value="hotel">Hotel</option>
                        <option value="catering">Catering / Eventos</option>
                        <option value="supermercado">Supermercado / Tienda</option>
                        <option value="distribuidor">Distribuidor</option>
                        <option value="otro">Otro</option>
                      </select>
                      {errors.business_type && (
                        <p className="text-red-500 text-xs mt-1">{errors.business_type}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
