// Carrito con soporte para dos modos de venta:
//   - 'fixed': qty × price unitario (bandejas, piezas)
//   - 'by_weight': gramos × (price_per_kg / 1000)
// Cada ítem puede llevar `notes` (sin piel, en pedazos, bolsas separadas...).
// Persistencia: localStorage. Total y mensaje WhatsApp se calculan desde acá.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSettings, whatsappLink } from './SettingsContext'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'avisander_cart_v2'

function lineTotal(item) {
  if (item.sale_type === 'by_weight') {
    const ppk = item.product.price_per_kg ?? item.product.price ?? 0
    return (ppk * (item.weight_grams || 0)) / 1000
  }
  return (item.product.price ?? 0) * (item.quantity || 0)
}

function lineKey(item) {
  // Para productos by_weight, cada agregado es una línea independiente
  // (cada uno puede tener gramos/notas distintas). Para fixed, agrupamos por id.
  if (item.sale_type === 'by_weight') return `w-${item.product.id}-${Math.random()}`
  return `f-${item.product.id}`
}

// Lazy init desde localStorage para evitar race: el effect de persistencia
// machacaba el estado antes de que el effect de carga corriera.
function loadInitialCart() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { settings } = useSettings()
  const [items, setItems] = useState(loadInitialCart)
  const deliveryCost = Number(settings.delivery_cost) || 5000

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Agrega N piezas. Si el producto tiene stock numérico, NO permite exceder el disponible.
  // Devuelve el número realmente agregado (puede ser menor que el solicitado, o 0 si stock=0).
  const addFixed = useCallback((product, quantity = 1, notes = '') => {
    const hasStockField = product.stock !== undefined && product.stock !== null
    const stock = Number(product.stock) || 0
    let added = quantity

    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.sale_type === 'fixed' && it.product.id === product.id
      )
      const currentInCart = idx >= 0 ? prev[idx].quantity : 0
      // Si tiene stock controlado, limitamos al stock disponible.
      if (hasStockField) {
        const maxToAdd = Math.max(0, stock - currentInCart)
        added = Math.min(quantity, maxToAdd)
        if (added <= 0) return prev
      }
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + added,
          notes: notes || copy[idx].notes
        }
        return copy
      }
      return [
        ...prev,
        { id: lineKey({ sale_type: 'fixed', product }), sale_type: 'fixed', product, quantity: added, notes }
      ]
    })
    return added
  }, [])

  const addByWeight = useCallback((product, weightGrams, notes = '') => {
    setItems((prev) => [
      ...prev,
      {
        id: lineKey({ sale_type: 'by_weight', product }),
        sale_type: 'by_weight',
        product,
        weight_grams: weightGrams,
        notes
      }
    ])
  }, [])

  // API unificada: detecta el sale_type del producto.
  // Devuelve { added, requested, stock } para que el caller pueda mostrar toast preciso.
  const addItem = useCallback(
    (product, opts = {}) => {
      const saleType = product.sale_type || 'fixed'
      if (saleType === 'by_weight') {
        addByWeight(product, opts.weight_grams || 500, opts.notes || '')
        return { added: 1, requested: 1, stock: null, sale_type: 'by_weight' }
      }
      const requested = opts.quantity || 1
      const added = addFixed(product, requested, opts.notes || '') || 0
      return {
        added,
        requested,
        stock: product.stock != null ? Number(product.stock) : null,
        sale_type: 'fixed'
      }
    },
    [addFixed, addByWeight]
  )

  const updateLine = useCallback((lineId, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, ...patch } : it))
    )
  }, [])

  const removeLine = useCallback((lineId) => {
    setItems((prev) => prev.filter((it) => it.id !== lineId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const subtotal = items.reduce((sum, it) => sum + lineTotal(it), 0)
  const total = subtotal + (items.length > 0 ? deliveryCost : 0)
  const itemCount = items.reduce(
    (sum, it) => sum + (it.sale_type === 'by_weight' ? 1 : it.quantity),
    0
  )

  const generateWhatsAppMessage = (customer = {}) => {
    if (items.length === 0) return ''
    // Formato WhatsApp: *negrita*, _cursiva_, ~tachado~, ```mono```.
    // Diseño visual con caracteres unicode que se renderizan bien en chat.
    const fmt = (n) => `$${Number(n).toLocaleString('es-CO')}`
    const sep = '━━━━━━━━━━━━━━━━━━'
    const dash = '·························'
    const now = new Date()
    const fecha = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    let msg = ''
    msg += `🥩 *PEDIDO AVISANDER* 🥩\n`
    msg += `_Carnicería Premium · Bucaramanga_\n`
    msg += `${sep}\n`
    msg += `📅 ${fecha}  ⏰ ${hora}\n\n`

    msg += `🛒 *Detalle del pedido*\n${dash}\n`
    items.forEach((it, i) => {
      const lt = lineTotal(it)
      const num = String(i + 1).padStart(2, '0')
      msg += `\n*${num}. ${it.product.name}*\n`
      if (it.sale_type === 'by_weight') {
        const ppk = it.product.price_per_kg ?? it.product.price
        const kg = (it.weight_grams / 1000).toFixed(it.weight_grams % 1000 === 0 ? 0 : 2)
        msg += `   ⚖️ Peso solicitado: *${it.weight_grams} g* _(≈ ${kg} kg)_\n`
        msg += `   💵 ${fmt(ppk)} / kg\n`
        msg += `   ➜ Subtotal: *${fmt(lt)}*\n`
      } else {
        msg += `   📦 ${it.quantity} × ${it.product.unit || 'und'}\n`
        msg += `   💵 ${fmt(it.product.price)} c/u\n`
        msg += `   ➜ Subtotal: *${fmt(lt)}*\n`
      }
      if (it.notes) {
        msg += `   📝 _${it.notes}_\n`
      }
    })

    msg += `\n${sep}\n`
    msg += `💰 *RESUMEN*\n`
    msg += `Subtotal:  ${fmt(subtotal)}\n`
    msg += `Domicilio: ${fmt(deliveryCost)}\n`
    msg += `*TOTAL:* *${fmt(total)}*\n`
    msg += `${sep}\n\n`

    const di = customer.deliveryInfo
    if (customer.name || customer.phone || customer.address || di) {
      msg += `👤 *Datos del cliente*\n${dash}\n`
      if (customer.name) msg += `Nombre:    ${customer.name}\n`
      if (customer.phone) msg += `Teléfono:  ${customer.phone}\n`

      if (di?.method === 'pickup') {
        msg += `\n🏬 *Modalidad:* Recoge en tienda\n`
        msg += `Punto: Cra 30 #20-70 Local 2, San Alonso\n`
      } else if (di?.method === 'delivery') {
        msg += `\n🚚 *Modalidad:* Domicilio\n`
        if (di.address) msg += `Dirección: ${di.address}\n`
        if (di.distance_km != null) msg += `Distancia: ≈ ${di.distance_km.toFixed(1)} km\n`
        if (di.city) msg += `Ciudad: ${di.city.charAt(0).toUpperCase() + di.city.slice(1)}\n`
      } else if (customer.address) {
        msg += `Dirección: ${customer.address}\n`
      }
      if (customer.notes) msg += `\nObservaciones generales:\n_${customer.notes}_\n`
      msg += `\n`
    }

    const hasByWeight = items.some((it) => it.sale_type === 'by_weight')
    if (hasByWeight) {
      msg += `ℹ️ _Los productos por peso se ajustan al pesar real. Te confirmamos el peso y total final por aquí mismo antes de cobrar._\n\n`
    }

    msg += `¡Gracias por preferirnos! 🙌\n`
    msg += `_Avisander · Calidad premium en cada corte_`
    return msg
  }

  const getWhatsAppUrl = (customer) =>
    whatsappLink(settings.whatsapp_number, generateWhatsAppMessage(customer))

  // Payload para POST /api/orders
  const toOrderItems = () =>
    items.map((it) => ({
      product_id: it.product.id,
      name: it.product.name,
      sale_type: it.sale_type,
      price: it.product.price,
      quantity: it.sale_type === 'fixed' ? it.quantity : undefined,
      weight_grams: it.sale_type === 'by_weight' ? it.weight_grams : undefined,
      notes: it.notes || null
    }))

  const value = {
    items,
    addItem,
    updateLine,
    removeLine,
    clearCart,
    subtotal,
    deliveryCost,
    total,
    itemCount,
    getWhatsAppUrl,
    generateWhatsAppMessage,
    toOrderItems,
    lineTotal
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
