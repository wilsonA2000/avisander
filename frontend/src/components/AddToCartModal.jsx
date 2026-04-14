// Modal único para agregar al carrito.
// - sale_type 'by_weight': pide gramos (50–20000) + notas. Calcula precio en vivo.
// - sale_type 'fixed': pide cantidad + notas. Muestra precio total.

import { useState } from 'react'
import { X } from 'lucide-react'

const PRESETS_GRAMS = [250, 500, 750, 1000, 1500, 2000]

function formatCOP(n) {
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

function AddToCartModal({ product, onClose, onConfirm }) {
  const isWeight = product.sale_type === 'by_weight'
  const [grams, setGrams] = useState(500)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const pricePerKg = product.price_per_kg ?? product.price ?? 0
  const computedTotal = isWeight ? (pricePerKg * grams) / 1000 : (product.price ?? 0) * qty

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isWeight) {
      const g = Number(grams)
      if (!g || g < 50 || g > 20000) {
        setError('Cantidad entre 50 y 20.000 gramos')
        return
      }
      onConfirm({ weight_grams: g, notes: notes.trim() })
    } else {
      const q = Number(qty)
      if (!q || q < 1) {
        setError('Cantidad mínima 1')
        return
      }
      onConfirm({ quantity: q, notes: notes.trim() })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-cart-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 id="add-cart-title" className="text-lg font-semibold text-gray-800 truncate pr-2">
            {product.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isWeight ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cuántos gramos quieres?
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESETS_GRAMS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGrams(g)
                        setError('')
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        Number(grams) === g
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                      }`}
                    >
                      {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={20000}
                    step={50}
                    value={grams}
                    onChange={(e) => {
                      setGrams(e.target.value)
                      setError('')
                    }}
                    className="input"
                  />
                  <span className="text-gray-500 font-medium">gramos</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 50 g, máximo 20.000 g (20 kg).
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                <p className="font-medium">📦 Sobre el peso real</p>
                <p className="mt-1">
                  El cortador hará lo posible por sacar exactamente lo que pediste. Si el peso final
                  es distinto, te lo confirmamos por WhatsApp antes de cobrar.
                </p>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value)
                    setError('')
                  }}
                  className="input"
                />
                <span className="text-gray-500 font-medium">{product.unit || 'und'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: sin piel, en pedazos, en bolsas separadas, molida fina…"
              className="input resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{notes.length}/500</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-sm">{error}</div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-gray-600 text-sm">Subtotal estimado</span>
            <span className="text-xl font-bold text-primary">{formatCOP(computedTotal)}</span>
          </div>

          <button type="submit" className="w-full btn-primary py-3">
            Agregar al carrito
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddToCartModal
