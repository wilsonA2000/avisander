import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { api } from '../lib/apiClient'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

function ChangePassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.next !== form.confirm) {
      toast.error('La nueva contraseña y la confirmación no coinciden.')
      return
    }
    if (form.next.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: form.current,
        new_password: form.next
      })
      toast.success('Contraseña actualizada correctamente.')
      try { await refreshUser?.() } catch (_e) { /* noop */ }
      navigate('/admin', { replace: true })
    } catch (err) {
      const msg = err.details?.message || err.message || 'No se pudo cambiar la contraseña.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <div className="bg-white rounded-2xl shadow border-t-4 border-primary p-6">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="text-primary" size={22} />
          <h1 className="text-xl font-bold text-gray-800">Cambiar contraseña</h1>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Por seguridad debes actualizar tu contraseña antes de continuar.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.current}
              onChange={onChange('current')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={form.next}
              onChange={onChange('next')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Mínimo 8 caracteres, con mayúscula, minúscula y número.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={onChange('confirm')}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword
