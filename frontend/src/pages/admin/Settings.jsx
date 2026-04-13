import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    delivery_cost: '',
    business_hours_weekday: '',
    business_hours_weekend: '',
    delivery_hours: '',
    whatsapp_number: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSettings({
          delivery_cost: data.delivery_cost || '5000',
          business_hours_weekday: data.business_hours_weekday || '7:00 AM - 7:00 PM',
          business_hours_weekend: data.business_hours_weekend || '7:00 AM - 1:00 PM',
          delivery_hours: data.delivery_hours || '8:00 AM - 6:00 PM',
          whatsapp_number: data.whatsapp_number || '3162530287'
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuracion guardada correctamente' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar configuracion' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuracion</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Entregas</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Costo de Domicilio (COP)
            </label>
            <input
              type="number"
              value={settings.delivery_cost}
              onChange={(e) => setSettings({ ...settings, delivery_cost: e.target.value })}
              className="input"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Costo que se agrega al total del pedido
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Horario de Entregas
            </label>
            <input
              type="text"
              value={settings.delivery_hours}
              onChange={(e) => setSettings({ ...settings, delivery_hours: e.target.value })}
              className="input"
              placeholder="8:00 AM - 6:00 PM"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-6">
          <h2 className="text-lg font-semibold border-b pb-2">Horarios de Atencion</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Lunes a Sabado
            </label>
            <input
              type="text"
              value={settings.business_hours_weekday}
              onChange={(e) => setSettings({ ...settings, business_hours_weekday: e.target.value })}
              className="input"
              placeholder="7:00 AM - 7:00 PM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Domingos
            </label>
            <input
              type="text"
              value={settings.business_hours_weekend}
              onChange={(e) => setSettings({ ...settings, business_hours_weekend: e.target.value })}
              className="input"
              placeholder="7:00 AM - 1:00 PM"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-6">
          <h2 className="text-lg font-semibold border-b pb-2">Contacto</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Numero de WhatsApp
            </label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              className="input"
              placeholder="3162530287"
            />
            <p className="text-sm text-gray-500 mt-1">
              Sin codigo de pais, solo el numero local
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
