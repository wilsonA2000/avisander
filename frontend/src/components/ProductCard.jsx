import { Eye, Truck, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import AddToCartModal from './AddToCartModal'
import ProductImage from './ProductImage'
import Icon3D from './Icon3D'
import SaleRibbon from './SaleRibbon'
import LowStockBadge from './LowStockBadge'

const FREE_SHIP_THRESHOLD = 200000

function ProductCard({ product, variant = 'grid' }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)

  const hasStockField = product.stock !== undefined && product.stock !== null
  const stock = Number(product.stock) || 0
  // Si el producto tiene stock numérico y es 0, está agotado aunque is_available sea true.
  const isAvailable = product.is_available !== false && (!hasStockField || stock > 0)
  const lowStock = hasStockField && stock > 0 && stock <= 3
  const isWeight = product.sale_type === 'by_weight'
  const displayPrice = isWeight ? (product.price_per_kg ?? product.price) : product.price
  const detailPath = `/producto/${product.id}`

  const triggerAdded = (detail) => {
    toast.success(`✓ ${product.name} (${detail}) agregado al carrito`)
    window.dispatchEvent(new CustomEvent('avisander:cart-bump'))
  }

  // Maneja el resultado del add: si stock limitó la cantidad, avisa al cliente.
  const reportAddResult = (result, requestedDetail) => {
    if (!result) return
    if (result.added <= 0) {
      toast.error(`${product.name} sin stock disponible.`)
      return
    }
    if (result.sale_type === 'fixed' && result.added < result.requested) {
      toast.warn(
        `Solo agregamos ${result.added} de ${result.requested} de "${product.name}" (queda ${result.stock} en stock).`
      )
      window.dispatchEvent(new CustomEvent('avisander:cart-bump'))
      return
    }
    triggerAdded(requestedDetail)
  }

  const handleModalConfirm = (opts) => {
    const result = addItem(product, opts)
    setOpen(false)
    const detail = isWeight ? `${opts.weight_grams} g` : `${opts.quantity} ${product.unit || 'und'}`
    reportAddResult(result, detail)
  }

  const handleQuickAdd = () => {
    const result = addItem(product, { quantity: qty })
    reportAddResult(result, `${qty} ${product.unit || 'und'}`)
    setQty(1)
  }

  const showFreeShip = !isWeight && Number(product.price) >= FREE_SHIP_THRESHOLD

  if (variant === 'list') {
    return (
      <>
        <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <Link to={detailPath} className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 block group">
            <ProductImage product={product} size="sm" imgClassName="group-hover:scale-105 transition-transform" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={detailPath}>
              <h3 className="font-semibold text-gray-900 hover:text-primary truncate">{product.name}</h3>
            </Link>
            <p className="text-xs text-gray-500 truncate">
              {product.brand && <>{product.brand}</>}
              {product.subcategory && <> · {product.subcategory}</>}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-primary">${Number(displayPrice).toLocaleString('es-CO')}</span>
              <span className="text-xs text-gray-500">/{isWeight ? 'kg' : product.unit || 'und'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {!!product.is_on_sale && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md
                                 bg-gradient-to-r from-accent-dark to-accent text-white
                                 text-[10px] font-display font-bold uppercase tracking-wider
                                 shadow-[0_2px_6px_-1px_rgba(160,32,32,0.4)]">
                  Oferta
                </span>
              )}
              {isWeight && <span className="badge-by-weight">Por peso</span>}
              {showFreeShip && <span className="badge bg-green-100 text-green-800"><Truck size={10} className="inline mr-0.5" /> Envío gratis</span>}
              {!isAvailable && <span className="badge-out-of-stock">Agotado</span>}
              {isAvailable && lowStock && <LowStockBadge />}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isAvailable ? (
              <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Icon3D name="shopping-cart" size="xs" /> Agregar
              </button>
            ) : (
              <button disabled className="btn bg-gray-300 text-gray-500 cursor-not-allowed text-sm">No disponible</button>
            )}
            <Link to={detailPath} className="text-xs text-gray-500 hover:text-primary">Ver detalle</Link>
          </div>
        </div>
        {open && <AddToCartModal product={product} onClose={() => setOpen(false)} onConfirm={handleModalConfirm} />}
      </>
    )
  }

  // Grid (default)
  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="card group flex flex-col h-full"
      >
        <Link to={detailPath} className="relative aspect-square bg-gray-100 block overflow-hidden">
          <ProductImage
            product={product}
            imgClassName="transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white/95 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-1 shadow">
              <Eye size={14} /> Ver detalle
            </span>
          </div>
          {!!product.is_on_sale && <SaleRibbon />}

          <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
            {isWeight && <span className="badge-by-weight">Por peso</span>}
            {!isAvailable && <span className="badge-out-of-stock">Agotado</span>}
            {isAvailable && lowStock && <LowStockBadge />}
          </div>
          {showFreeShip && (
            <div className="absolute bottom-2 left-2">
              <span className="badge bg-green-100 text-green-800 shadow-sm">
                <Truck size={10} className="inline mr-0.5" /> Envío gratis
              </span>
            </div>
          )}
        </Link>

        <div className="p-3 flex-1 flex flex-col">
          <Link to={detailPath} className="block">
            <h3 className="font-semibold text-gray-900 text-sm mb-0.5 line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]" title={product.name}>
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 truncate mb-2">
            {product.brand && <>{product.brand}</>}
            {product.subcategory && <> · {product.subcategory}</>}
            {!product.brand && !product.subcategory && product.category_name}
          </p>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-lg font-bold text-primary">${Number(displayPrice).toLocaleString('es-CO')}</span>
            <span className="text-xs text-gray-500">/{isWeight ? 'kg' : product.unit || 'und'}</span>
            {!!product.is_on_sale && !!product.original_price && (
              <span className="text-xs text-gray-400 line-through ml-1">${Number(product.original_price).toLocaleString('es-CO')}</span>
            )}
          </div>

          <div className="mt-auto">
            {isAvailable ? (
              isWeight ? (
                <button onClick={() => setOpen(true)} className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
                  <Icon3D name="shopping-cart" size="xs" /> Pedir por peso
                </button>
              ) : (
                <div className="flex gap-1">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-2 py-1 hover:bg-gray-100"
                      aria-label="Reducir"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="px-2 py-1 hover:bg-gray-100"
                      aria-label="Aumentar"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={handleQuickAdd}
                    className="flex-1 btn-primary flex items-center justify-center gap-1 text-sm px-2"
                    title="Agregar al carrito"
                  >
                    <Icon3D name="shopping-cart" size="xs" />
                    <span className="hidden sm:inline">Agregar</span>
                  </button>
                </div>
              )
            ) : (
              <button disabled className="w-full btn bg-gray-200 text-gray-500 cursor-not-allowed text-sm">
                No disponible
              </button>
            )}
          </div>
        </div>
      </motion.div>
      {open && <AddToCartModal product={product} onClose={() => setOpen(false)} onConfirm={handleModalConfirm} />}
    </>
  )
}

export default ProductCard
