import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!policy.test(password)) {
      setError('Contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'No pudimos actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Nueva contraseña</h1>

          {done ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
              Contraseña actualizada. Te redirigimos al login…
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pw">
                  Nueva contraseña
                </label>
                <input
                  id="pw"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="pw2">
                  Confirmar contraseña
                </label>
                <input
                  id="pw2"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-600 text-sm">
            <Link to="/login" className="text-primary hover:underline font-medium">
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
