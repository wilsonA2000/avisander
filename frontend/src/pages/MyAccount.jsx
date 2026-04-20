import { useState, useEffect } from 'react'
import { Package, RefreshCw, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import AvatarUpload from '../components/AvatarUpload'
import { api } from '../lib/apiClient'
import { fmtCOP, fmtDate } from '../lib/format'

function MyAccount() {
  const { user, updateProfile } = useAuth()
  const { addItem } = useCart()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  // Form editable del perfil. Se inicializa desde user y se sincroniza si user cambia.
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || ''
    })
  }, [user?.id, user?.name, user?.phone, user?.address])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await api.get('/api/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRepeatOrder = async (order) => {
    for (const item of order.items || []) {
      const r = addItem({
        id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        unit: 'kg'
      }, item.quantity)
      if (r?.blocked) return
    }
    toast.success('Productos agregados al carrito')
  }

  const handleAvatarUploaded = async (url) => {
    await updateProfile({ avatar_url: url })
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile({
        name: form.name.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null
      })
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Mi Cuenta</h1>

      {/* Header usuario con avatar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-5 flex-wrap">
          <AvatarUpload
            value={user?.avatar_url}
            name={user?.name}
            onUploaded={handleAvatarUploaded}
            size={96}
          />
          <div>
            <h2 className="text-xl font-semibold">{user?.name || 'Usuario'}</h2>
            <p className="text-gray-600">{user?.email}</p>
            {user?.phone && <p className="text-gray-500 text-sm mt-1">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Mis pedidos
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Perfil
        </button>
      </div>

      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-lg p-6 h-32" />)}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Pedido #{order.id}</span>
                      <p className="font-semibold">{fmtDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'completed' ? 'Completado' :
                         order.status === 'processing' ? 'En proceso' :
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                      <p className="font-bold text-lg mt-1">{fmtCOP(order.total)}</p>
                    </div>
                  </div>

                  {order.items && (
                    <div className="text-sm text-gray-600 mb-4">
                      {order.items.map((item, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {item.product_name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleRepeatOrder(order)}
                    className="btn-outline inline-flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    Repetir pedido
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Package className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">Aún no tienes pedidos</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-5">Información personal</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="profile-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <p className="text-gray-500 px-4 py-2 bg-gray-50 rounded-lg text-sm">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar.</p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                id="profile-phone"
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="3001234567"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                id="profile-address"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Calle, carrera, barrio…"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {savingProfile ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default MyAccount
