import { useState, useEffect, useCallback } from 'react'
import { Save } from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    delivery_cost: '',
    business_hours_weekday: '',
    business_hours_saturday: '',
    business_hours_weekend: '',
    business_hours_holiday: '',
    delivery_hours: '',
    whatsapp_number: '',
    store_name: '',
    store_short_name: '',
    store_address: '',
    store_lat: '',
    store_lng: '',
    admin_notification_email: '',
    free_shipping_threshold: '',
    tax_rate: '',
    // Pop-up promocional
    promo_modal_enabled: '',
    promo_modal_title: '',
    promo_modal_subtitle: '',
    promo_modal_image: '',
    promo_modal_cta_label: '',
    promo_modal_cta_link: ''
  })
  const [originalSettings, setOriginalSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const hasChanges = originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings)

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      // Usamos /all para obtener también los no-públicos (admin_notification_email)
      const response = await fetch('/api/settings/all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const loadedSettings = {
          delivery_cost: data.delivery_cost || '4000',
          business_hours_weekday: data.business_hours_weekday || '6:30 AM – 1:00 PM y 3:00 PM – 8:00 PM',
          business_hours_saturday: data.business_hours_saturday || '6:30 AM – 1:00 PM y 3:00 PM – 7:00 PM',
          business_hours_weekend: data.business_hours_weekend || 'Domingos cerrado',
          business_hours_holiday: data.business_hours_holiday || 'Festivos media jornada',
          delivery_hours: data.delivery_hours || '8:00 AM - 6:00 PM',
          whatsapp_number: data.whatsapp_number || '3123005253',
          store_name: data.store_name || 'DISTRIBUIDORA AVICOLA DE SANTANDER · AVISANDER',
          store_short_name: data.store_short_name || 'Avisander',
          store_address: data.store_address || 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga',
          store_lat: data.store_lat || '7.1294038',
          store_lng: data.store_lng || '-73.1170752',
          admin_notification_email: data.admin_notification_email || '',
          free_shipping_threshold: data.free_shipping_threshold || '200000',
          tax_rate: data.tax_rate || '0',
          promo_modal_enabled: data.promo_modal_enabled || '0',
          promo_modal_title: data.promo_modal_title || '',
          promo_modal_subtitle: data.promo_modal_subtitle || '',
          promo_modal_image: data.promo_modal_image || '',
          promo_modal_cta_label: data.promo_modal_cta_label || 'Ver catálogo',
          promo_modal_cta_link: data.promo_modal_cta_link || '/productos'
        }
        setSettings(loadedSettings)
        setOriginalSettings(loadedSettings)
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
        setOriginalSettings({ ...settings })
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
          <h2 className="text-lg font-semibold border-b pb-2">Tienda</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la tienda</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="input"
              placeholder="Avisander"
            />
            <p className="text-sm text-gray-500 mt-1">Aparece en header, footer y emails.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input
              type="text"
              value={settings.store_address}
              onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
              className="input"
              placeholder="Cra 30 #20-70 Local 2, San Alonso, Bucaramanga"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitud tienda</label>
              <input
                type="number"
                step="0.0001"
                value={settings.store_lat}
                onChange={(e) => setSettings({ ...settings, store_lat: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitud tienda</label>
              <input
                type="number"
                step="0.0001"
                value={settings.store_lng}
                onChange={(e) => setSettings({ ...settings, store_lng: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Coordenadas usadas para calcular distancia del domicilio.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-6">
          <h2 className="text-lg font-semibold border-b pb-2">Envíos y facturación</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Umbral de envío gratis (COP)</label>
            <input
              type="number"
              value={settings.free_shipping_threshold}
              onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
              className="input"
              min="0"
              step="1000"
            />
            <p className="text-sm text-gray-500 mt-1">Pedidos en Bucaramanga sobre este monto no pagan domicilio.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tasa de IVA (%)</label>
            <input
              type="number"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
              className="input"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-sm text-gray-500 mt-1">0 si no aplicas IVA directamente (los productos ya lo incluyen).</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-6">
          <h2 className="text-lg font-semibold border-b pb-2">Contacto</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Número de WhatsApp
            </label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              className="input"
              placeholder="3123005253"
            />
            <p className="text-sm text-gray-500 mt-1">
              Sin código de país, solo el número local.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email para notificaciones de pedidos
            </label>
            <input
              type="email"
              value={settings.admin_notification_email}
              onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
              className="input"
              placeholder="admin@avisander.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              Aquí llegará un correo cada vez que un cliente haga un pedido.
            </p>
          </div>
        </div>

        {/* Pop-up promocional de bienvenida */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Pop-up de bienvenida</h2>
              <p className="text-sm text-gray-500">
                Aparece a los visitantes nuevos del Home (cookie de 24h). Ideal para promos del día,
                anuncios y campañas. Puedes generar la imagen en{' '}
                <a href="/admin/estudio-ai" className="text-primary hover:underline">Estudio AI</a>{' '}
                o subirla desde Biblioteca.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={settings.promo_modal_enabled === '1'}
                onChange={(e) =>
                  setSettings({ ...settings, promo_modal_enabled: e.target.checked ? '1' : '0' })
                }
                className="rounded text-primary"
              />
              <span className="font-medium">{settings.promo_modal_enabled === '1' ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                value={settings.promo_modal_title}
                onChange={(e) => setSettings({ ...settings, promo_modal_title: e.target.value })}
                className="input"
                placeholder="¡Bienvenido a Avisander!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                value={settings.promo_modal_subtitle}
                onChange={(e) => setSettings({ ...settings, promo_modal_subtitle: e.target.value })}
                className="input"
                placeholder="Carnes premium con domicilio en Bucaramanga"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de la imagen</label>
              <input
                value={settings.promo_modal_image}
                onChange={(e) => setSettings({ ...settings, promo_modal_image: e.target.value })}
                className="input font-mono text-xs"
                placeholder="/media/ia/ai-xxxxx.webp · /uploads/banner.png · https://..."
              />
              {settings.promo_modal_image && (
                <img
                  src={settings.promo_modal_image}
                  alt=""
                  className="mt-2 max-h-40 rounded-lg border"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto del botón</label>
              <input
                value={settings.promo_modal_cta_label}
                onChange={(e) => setSettings({ ...settings, promo_modal_cta_label: e.target.value })}
                className="input"
                placeholder="Ver catálogo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link del botón</label>
              <input
                value={settings.promo_modal_cta_link}
                onChange={(e) => setSettings({ ...settings, promo_modal_cta_link: e.target.value })}
                className="input"
                placeholder="/productos · /productos?on_sale=1 · https://wa.me/..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
