// Historial de productos vistos en localStorage. Máx 12, excluye el actual.

import { useCallback, useEffect, useState } from 'react'

const KEY = 'avisander_recent_viewed'
const MAX = 12

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)) } catch {}
}

export function useRecentlyViewed(excludeId) {
  const [items, setItems] = useState(read)

  const push = useCallback((product) => {
    if (!product?.id) return
    const current = read()
    const next = [
      { id: product.id, name: product.name, image_url: product.image_url, sale_type: product.sale_type, price: product.price, price_per_kg: product.price_per_kg, unit: product.unit },
      ...current.filter((p) => p.id !== product.id)
    ].slice(0, MAX)
    write(next)
    setItems(next)
  }, [])

  const clear = useCallback(() => {
    write([])
    setItems([])
  }, [])

  useEffect(() => {
    // Sync inicial
    setItems(read())
  }, [])

  const visible = excludeId ? items.filter((p) => p.id !== excludeId) : items
  return { items: visible, push, clear }
}
