import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../context/CartContext'

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    setAdding(true)
    addItem(product, quantity)
    setTimeout(() => {
      setAdding(false)
      setQuantity(1)
    }, 500)
  }

  const isAvailable = product.is_available !== false

  return (
    <div className="card group">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {product.is_on_sale && (
            <span className="badge-sale">Oferta</span>
          )}
          {!isAvailable && (
            <span className="badge-out-of-stock">Agotado</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 truncate" title={product.name}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-primary">
            ${product.price.toLocaleString('es-CO')}
          </span>
          <span className="text-sm text-gray-500">/{product.unit || 'kg'}</span>
          {product.is_on_sale && product.original_price && (
            <span className="text-sm text-gray-400 line-through">
              ${product.original_price.toLocaleString('es-CO')}
            </span>
          )}
        </div>

        {/* Quantity selector and add to cart */}
        {isAvailable ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
                aria-label="Reducir cantidad"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
                adding ? 'bg-green-500' : ''
              }`}
            >
              <ShoppingCart size={18} />
              <span>{adding ? 'Agregado!' : 'Agregar'}</span>
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full btn bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            No disponible
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard
