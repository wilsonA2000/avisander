import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setOrders(await response.json())
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status })
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    pending: 'Pendiente',
    processing: 'En proceso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : orders.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3">#{order.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer_name || 'Sin nombre'}</p>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${order.total.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`badge cursor-pointer ${statusColors[order.status] || statusColors.pending}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="processing">En proceso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-500 hover:text-blue-600"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No hay pedidos</div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Direccion</p>
                  <p className="font-medium">{selectedOrder.customer_address || '-'}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notas</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Productos</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className={`flex justify-between py-2 ${i > 0 ? 'border-t' : ''}`}>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x ${item.unit_price.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <p className="font-medium">${item.subtotal.toLocaleString('es-CO')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${(selectedOrder.total - (selectedOrder.delivery_cost || 0)).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Domicilio</span>
                  <span>${(selectedOrder.delivery_cost || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${selectedOrder.total.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600">Estado:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className={`badge cursor-pointer ${statusColors[selectedOrder.status] || statusColors.pending}`}
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">En proceso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
