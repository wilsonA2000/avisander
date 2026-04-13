import { useState, useEffect } from 'react'
import { Package, FolderOpen, ShoppingBag, DollarSign } from 'lucide-react'

function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    revenue: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/orders', { headers })
      ])

      const products = productsRes.ok ? await productsRes.json() : []
      const categories = categoriesRes.ok ? await categoriesRes.json() : []
      const orders = ordersRes.ok ? await ordersRes.json() : []

      const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)

      setStats({
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        revenue
      })

      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Productos', value: stats.products, icon: Package, color: 'bg-blue-500' },
    { label: 'Categorias', value: stats.categories, icon: FolderOpen, color: 'bg-green-500' },
    { label: 'Pedidos', value: stats.orders, icon: ShoppingBag, color: 'bg-yellow-500' },
    { label: 'Ingresos', value: `$${stats.revenue.toLocaleString('es-CO')}`, icon: DollarSign, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '-' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Pedidos Recientes</h2>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="py-3">#{order.id}</td>
                    <td className="py-3">{order.customer_name || 'Sin nombre'}</td>
                    <td className="py-3 font-medium">
                      ${order.total.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3">
                      <span className={`badge ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'completed' ? 'Completado' : order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay pedidos aun</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
