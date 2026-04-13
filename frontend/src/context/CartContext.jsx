import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'avisander_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [deliveryCost, setDeliveryCost] = useState(5000) // Default delivery cost

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart:', e)
      }
    }

    // Fetch delivery cost from settings
    fetchDeliveryCost()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const fetchDeliveryCost = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.delivery_cost) {
          setDeliveryCost(Number(data.delivery_cost))
        }
      }
    } catch (error) {
      console.error('Error fetching delivery cost:', error)
    }
  }

  const addItem = (product, quantity = 1) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.product.id === product.id)

      if (existingIndex >= 0) {
        const newItems = [...prevItems]
        newItems[existingIndex].quantity += quantity
        return newItems
      }

      return [...prevItems, { product, quantity }]
    })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const removeItem = (productId) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const total = subtotal + (items.length > 0 ? deliveryCost : 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const generateWhatsAppMessage = () => {
    if (items.length === 0) return ''

    let message = 'Hola! Me gustaria hacer el siguiente pedido:\n\n'

    items.forEach(item => {
      const itemTotal = item.product.price * item.quantity
      message += `- ${item.product.name}\n`
      message += `  ${item.quantity} ${item.product.unit} x $${item.product.price.toLocaleString('es-CO')} = $${itemTotal.toLocaleString('es-CO')}\n`
    })

    message += `\nSubtotal: $${subtotal.toLocaleString('es-CO')}`
    message += `\nDomicilio: $${deliveryCost.toLocaleString('es-CO')}`
    message += `\n*Total: $${total.toLocaleString('es-CO')}*`
    message += '\n\nGracias!'

    return encodeURIComponent(message)
  }

  const getWhatsAppUrl = () => {
    const phone = '3162530287' // Local number (wa.me handles country detection)
    const message = generateWhatsAppMessage()
    return `https://wa.me/${phone}?text=${message}`
  }

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    deliveryCost,
    total,
    itemCount,
    getWhatsAppUrl
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
