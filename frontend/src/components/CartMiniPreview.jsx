// Mini-preview del carrito que se despliega al posar el cursor sobre el icono
// del carrito en el Header. Muestra hasta 4 items + subtotal + CTA.

import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { fmtCOP } from '../lib/format'

function CartMiniPreview({ open }) {
  const { items, subtotal, removeLine } = useCart()

  const lineTotal = (it) => {
    if (it.sale_type === 'by_weight') {
      const ppk = it.product.price_per_kg ?? it.product.price
      return (ppk * it.weight_grams) / 1000
    }
    return it.product.price * it.quantity
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
        >
          <div className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white flex items-center gap-2">
            <ShoppingBag size={18} />
            <h3 className="font-display font-bold">Tu carrito</h3>
            <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Aún no has agregado productos.</p>
              <Link
                to="/productos"
                className="btn-primary mt-4 text-sm inline-flex items-center gap-1"
              >
                Ver catálogo <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <>
              <ul className="max-h-64 overflow-y-auto divide-y">
                {items.slice(0, 4).map((it) => (
                  <li key={it.id} className="flex items-start gap-3 p-3 hover:bg-cream transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {it.product.image_url ? (
                        <img src={it.product.image_url} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{it.product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {it.sale_type === 'by_weight'
                          ? `${it.weight_grams} g`
                          : `${it.quantity} ${it.product.unit || 'und'}`}
                        {' · '}
                        <span className="font-semibold text-primary">{fmtCOP(lineTotal(it))}</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeLine(it.id) }}
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors flex-shrink-0"
                      aria-label="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {items.length > 4 && (
                  <li className="p-3 text-center text-xs text-gray-500 bg-gray-50">
                    + {items.length - 4} {items.length - 4 === 1 ? 'ítem más' : 'ítems más'}
                  </li>
                )}
              </ul>

              <div className="p-4 bg-cream border-t border-gray-100">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Subtotal</span>
                  <span className="text-xl font-bold text-primary">{fmtCOP(subtotal)}</span>
                </div>
                <Link
                  to="/carrito"
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
                >
                  Ir al carrito
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CartMiniPreview
