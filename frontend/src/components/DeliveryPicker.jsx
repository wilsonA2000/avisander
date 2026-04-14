// DeliveryPicker: selector de dirección con autocompletado vía Nominatim (OpenStreetMap)
// + cotización en vivo del domicilio contra /api/delivery/quote.
// Usa OSM porque es gratis y no requiere API key. Si en el futuro queremos precisión por
// carretera, basta cambiar searchAddress() por una llamada a Google Places.

import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Truck, Store, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { api } from '../lib/apiClient'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
// Sesgar resultados al área metropolitana de Bucaramanga
const VIEWBOX = '-73.30,7.30,-72.95,6.95' // (lng_min,lat_min,lng_max,lat_max)

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

function inferCity(display) {
  const s = (display || '').toLowerCase()
  if (s.includes('floridablanca')) return 'floridablanca'
  if (s.includes('giron') || s.includes('girón')) return 'giron'
  if (s.includes('piedecuesta')) return 'piedecuesta'
  if (s.includes('bucaramanga')) return 'bucaramanga'
  return null
}

function DeliveryPicker({ subtotal, value, onChange }) {
  // value = { method, address, lat, lng, city, cost, distance_km, in_coverage, reason }
  const [method, setMethod] = useState(value?.method || 'delivery')
  const [query, setQuery] = useState(value?.address || '')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [quote, setQuote] = useState(value?.in_coverage != null ? value : null)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Si method=pickup, propagamos cost=0 inmediatamente
  useEffect(() => {
    if (method === 'pickup') {
      setQuote(null)
      setError('')
      onChange?.({
        method: 'pickup',
        address: null,
        lat: null,
        lng: null,
        city: null,
        cost: 0,
        in_coverage: true,
        reason: 'Recoge en tienda'
      })
    } else if (method === 'delivery' && quote) {
      onChange?.({ method: 'delivery', address: query, ...quote })
    } else if (method === 'delivery') {
      onChange?.({ method: 'delivery', cost: 0, in_coverage: false, reason: 'Sin dirección' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method])

  // Re-cotizar cuando cambia el subtotal (puede activar envío gratis)
  useEffect(() => {
    if (method === 'delivery' && quote && quote.lat) {
      runQuote(quote.lat, quote.lng, quote.city || inferCity(quote.address))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  // Click fuera cierra dropdown
  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const searchAddress = async (q) => {
    if (q.trim().length < 4) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        countrycodes: 'co',
        viewbox: VIEWBOX,
        bounded: '1'
      })
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'Accept-Language': 'es' }
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setShowResults(true)
    } catch (_e) {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const onQueryChange = (v) => {
    setQuery(v)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(v), 400)
  }

  const runQuote = async (lat, lng, city) => {
    setQuoting(true)
    setError('')
    try {
      const data = await api.post(
        '/api/delivery/quote',
        { lat, lng, city, subtotal: Number(subtotal) || 0 },
        { skipAuth: true }
      )
      setQuote({ ...data, lat, lng, address: query })
      onChange?.({
        method: 'delivery',
        address: query,
        lat,
        lng,
        city: data.city,
        cost: data.cost,
        distance_km: data.distance_km,
        in_coverage: data.in_coverage,
        reason: data.reason,
        free: data.free
      })
    } catch (e) {
      setError(e.message || 'No pudimos cotizar el domicilio')
    } finally {
      setQuoting(false)
    }
  }

  const pickResult = (r) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const city = inferCity(r.display_name)
    setQuery(r.display_name)
    setShowResults(false)
    setResults([])
    runQuote(lat, lng, city)
  }

  return (
    <div className="space-y-3">
      {/* Selector de modalidad */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod('delivery')}
          className={`border rounded-lg p-3 text-left transition ${
            method === 'delivery'
              ? 'border-primary bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Truck size={16} /> Domicilio
          </div>
          <p className="text-xs text-gray-500 mt-1">Te lo llevamos a tu casa</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod('pickup')}
          className={`border rounded-lg p-3 text-left transition ${
            method === 'pickup'
              ? 'border-primary bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Store size={16} /> Recoger en tienda
          </div>
          <p className="text-xs text-gray-500 mt-1">Cra 30 #20-70 San Alonso</p>
        </button>
      </div>

      {method === 'delivery' && (
        <div ref={wrapperRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿A qué dirección te enviamos?
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Ej: Calle 56 #15-30, Cabecera"
              className="input pr-9"
              autoComplete="street-address"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </span>
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2"
                >
                  <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">
            Buscamos tu dirección en Bucaramanga y municipios vecinos. Selecciona la que coincida.
          </p>

          {/* Estado de la cotización */}
          {quoting && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 size={14} className="animate-spin" /> Calculando tarifa…
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!quoting && quote && quote.in_coverage && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
              quote.free ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'
            }`}>
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {quote.free
                    ? '¡Envío gratis!'
                    : `Domicilio: ${fmtCOP(quote.cost)}`}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {quote.reason} · Distancia ≈ {quote.distance_km?.toFixed(1)} km
                </p>
              </div>
            </div>
          )}

          {!quoting && quote && !quote.in_coverage && (
            <div className="mt-3 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Fuera del área de cobertura</p>
                <p className="text-xs mt-0.5">{quote.reason}</p>
                <p className="text-xs mt-1">
                  Llámanos para coordinar manualmente.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {method === 'pickup' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          <p className="font-medium flex items-center gap-2">
            <Store size={14} /> Recoge tu pedido en
          </p>
          <p className="mt-1 ml-5">Cra 30 #20-70 Local 2, San Alonso, Bucaramanga</p>
          <p className="mt-1 ml-5 text-xs text-gray-500">Sin costo de domicilio.</p>
        </div>
      )}
    </div>
  )
}

export default DeliveryPicker
