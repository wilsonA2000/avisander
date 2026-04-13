import { useState, useEffect } from 'react'
import { User, Package, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function MyAccount() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRepeatOrder = async (order) => {
    // Add all items from the order to the cart
    for (const item of order.items) {
      addItem({
        id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        unit: 'kg'
      }, item.quantity)
    }
    alert('Productos agregados al carrito')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mi Cuenta</h1>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            {user?.phone && <p className="text-gray-500">{user?.phone}</p>}
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
          Mis Pedidos
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

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Pedido #{order.id}</span>
                      <p className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'completed' ? 'Completado' : order.status}
                      </span>
                      <p className="font-bold text-lg mt-1">
                        ${order.total.toLocaleString('es-CO')}
                      </p>
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
                    className="btn-outline flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    Repetir pedido
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">Aun no tienes pedidos</p>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Informacion Personal</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <p className="text-gray-900">{user?.name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <p className="text-gray-900">{user?.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direccion
              </label>
              <p className="text-gray-900">{user?.address || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyAccount
