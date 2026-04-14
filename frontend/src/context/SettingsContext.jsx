// Cachea /api/settings en memoria para que toda la app lea los datos del negocio
// (whatsapp, horarios, dirección, etc) desde una sola fuente.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/apiClient'

const DEFAULTS = {
  whatsapp_number: '3123005253',
  delivery_cost: '5000',
  business_hours_weekday: '7:00 AM - 7:00 PM',
  business_hours_weekend: '7:00 AM - 1:00 PM',
  delivery_hours: '8:00 AM - 6:00 PM',
  store_name: 'Avisander',
  store_address: 'Bucaramanga, Santander'
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/settings', { skipAuth: true })
      setSettings({ ...DEFAULTS, ...data })
    } catch {
      // Silencioso: usamos defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}

// Helpers de formateo reutilizables.
export function whatsappLink(number, message = '') {
  // wa.me requiere número internacional sin +. CO = 57.
  const clean = String(number || '').replace(/\D/g, '')
  const intl = clean.startsWith('57') ? clean : `57${clean}`
  const msg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${intl}${msg}`
}

export function telLink(number) {
  const clean = String(number || '').replace(/\D/g, '')
  const intl = clean.startsWith('57') ? clean : `57${clean}`
  return `tel:+${intl}`
}

export function formatPhone(number) {
  const clean = String(number || '').replace(/\D/g, '')
  // 3123005253 → 312 300 5253
  if (clean.length === 10) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`
  return number
}
