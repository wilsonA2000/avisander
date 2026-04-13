import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

function Cart() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    deliveryCost,
    total,
    getWhatsAppUrl
  } = useCart()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito esta vacio</h1>
        <p className="text-gray-600 mb-8">
          Agrega productos de nuestro catalogo para empezar tu pedido.
        </p>
        <Link to="/productos" className="btn-primary">
          Ver Productos
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            {items.map((item, index) => (
              <div
                key={item.product.id}
                className={`p-4 flex items-center gap-4 ${
                  index > 0 ? 'border-t' : ''
                }`}
              >
                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-primary font-medium">
                    ${item.product.price.toLocaleString('es-CO')}/{item.product.unit || 'kg'}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    aria-label="Reducir cantidad"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <Link to="/productos" className="text-primary hover:underline">
              Continuar comprando
            </Link>
            <button
              onClick={clearCart}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>

            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Domicilio</span>
                <span>${deliveryCost.toLocaleString('es-CO')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full btn flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar Pedido a WhatsApp
            </a>

            <p className="mt-4 text-sm text-gray-500 text-center">
              Al hacer clic, seras redirigido a WhatsApp para confirmar tu pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
