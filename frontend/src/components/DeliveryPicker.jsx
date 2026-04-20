// DeliveryPicker: selector de dirección con Google Places (Colombia) + cotización
// en vivo del domicilio contra /api/delivery/quote.
// Si no hay VITE_GOOGLE_MAPS_API_KEY, cae a Nominatim como fallback ("modo limitado").

import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Truck, Store, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { api } from '../lib/apiClient'
import { isGoogleMapsEnabled, loadGoogleMaps } from '../lib/googleMaps'
import DeliveryConfirmModal from './DeliveryConfirmModal'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const VIEWBOX = '-73.30,7.30,-72.95,6.95' // sesgo Bucaramanga
const BUCARAMANGA_BOUNDS = {
  // SW & NE para Google bias
  south: 6.95,
  west: -73.30,
  north: 7.30,
  east: -72.95
}

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
  const useGoogle = isGoogleMapsEnabled()
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
  const sessionTokenRef = useRef(null)
  const [googleReady, setGoogleReady] = useState(false)
  // Estado del modal confirmatorio. Se abre tras una cotización exitosa.
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDraft, setPendingDraft] = useState(null)
  const [confirmed, setConfirmed] = useState(value?.in_coverage === true && value?.address)

  // Carga Google Maps lazy. Usamos la API NUEVA (Places API New) porque para
  // proyectos creados después de marzo 2025 Google ya no habilita AutocompleteService.
  useEffect(() => {
    if (!useGoogle) return
    loadGoogleMaps()
      .then(async (google) => {
        if (!google) return
        // Importamos el módulo places via el nuevo importLibrary API.
        await google.maps.importLibrary('places')
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
        setGoogleReady(true)
      })
      .catch(() => setGoogleReady(false))
  }, [useGoogle])

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

  useEffect(() => {
    if (method === 'delivery' && quote && quote.lat) {
      runQuote(quote.lat, quote.lng, quote.city || inferCity(quote.address))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Google Places API (New) — AutocompleteSuggestion.fetchAutocompleteSuggestions.
  // Reemplaza al viejo AutocompleteService que Google bloqueó para nuevos proyectos.
  const googleFetch = async (q) => {
    const google = window.google
    if (!google?.maps?.places?.AutocompleteSuggestion) {
      console.warn('[DeliveryPicker] Google Places no cargó. Probable: Places API (New) no habilitada o API key inválida.')
      return []
    }
    try {
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q,
        includedRegionCodes: ['co'],
        locationBias: {
          west: BUCARAMANGA_BOUNDS.west,
          south: BUCARAMANGA_BOUNDS.south,
          east: BUCARAMANGA_BOUNDS.east,
          north: BUCARAMANGA_BOUNDS.north
        },
        sessionToken: sessionTokenRef.current,
        language: 'es'
      })
      if (!suggestions?.length) return []
      return suggestions
        .filter((s) => s.placePrediction)
        .map((s) => ({
          display_name: s.placePrediction.text?.toString() || '',
          place_id: s.placePrediction.placeId,
          placePrediction: s.placePrediction,
          source: 'google'
        }))
    } catch (e) {
      console.error('[DeliveryPicker] Google Places error:', e?.message || e, e)
      return []
    }
  }

  // Estrategia Google Places con fallback: Google entiende "Carrera 27 # 45-12"
  // pero no siempre bien con barrio + # + casa. Probamos en cascada, igual que
  // hacemos con Nominatim.
  const searchGoogle = async (q) => {
    // Paso 1: query exacto del usuario (Google es bueno con variantes).
    let results = await googleFetch(q)
    if (results.length > 0) return results

    // Paso 2: forzamos contexto geográfico (Bucaramanga, Santander, Colombia).
    const lower = q.toLowerCase()
    const needsContext = !/bucaramanga|floridablanca|gir[oó]n|piedecuesta/i.test(lower)
    if (needsContext) {
      results = await googleFetch(`${q}, Bucaramanga, Santander, Colombia`)
      if (results.length > 0) return results
    }

    // Paso 3: sin número de casa (Google puede no encontrar la casa específica).
    const noHouse = q.replace(/#\s*\d+\s*-\s*\d+/g, '').replace(/\s{2,}/g, ' ').trim()
    if (noHouse !== q) {
      const withCity = needsContext ? `${noHouse}, Bucaramanga, Colombia` : noHouse
      results = await googleFetch(withCity)
      if (results.length > 0) return results
    }

    // Paso 4: sólo vía principal + ciudad.
    const viaMatch = q.match(/\b(calle|carrera|avenida|diagonal|transversal|cra|cl|av|dg|tv)\s*\d+[A-Za-z]?\b/i)
    if (viaMatch) {
      results = await googleFetch(`${viaMatch[0]}, Bucaramanga, Santander, Colombia`)
    }
    return results
  }

  // Normaliza consultas nomenclaturales colombianas.
  // - Nominatim no entiende bien "calle 9 #25-34". Traducimos # → "No. " y agregamos
  //   ciudad/depto/país si el usuario no los escribió para forzar contexto.
  const normalizeColombianQuery = (raw) => {
    let q = raw.trim()
    // Reemplaza "#25-34" por "No. 25-34" para que los geocoders lo entiendan mejor.
    q = q.replace(/#\s*/g, 'No. ')
    const lower = q.toLowerCase()
    const tails = []
    if (!/bucaramanga|floridablanca|gir[oó]n|piedecuesta/i.test(lower)) {
      tails.push('Bucaramanga')
    }
    if (!/santander/i.test(lower)) tails.push('Santander')
    if (!/colombia/i.test(lower)) tails.push('Colombia')
    if (tails.length) q = `${q}, ${tails.join(', ')}`
    return q
  }

  const nominatimFetch = async (q) => {
    const params = new URLSearchParams({
      q,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'co',
      viewbox: VIEWBOX
    })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'es' }
    })
    const data = await res.json()
    return (Array.isArray(data) ? data : []).map((r) => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      source: 'nominatim'
    }))
  }

  // Estrategia Colombia para Nominatim (que tiene pobre cobertura de direcciones
  // nomenclaturales + housenumbers). Probamos en cascada del más específico al
  // más general; paramos en el primero que dé resultados.
  const searchNominatim = async (q) => {
    const normalized = normalizeColombianQuery(q)

    // Paso 1: query completo normalizado.
    let results = await nominatimFetch(normalized)
    if (results.length > 0) return results

    // Paso 2: sin número de casa ("No. 25-34" / "# 25-34").
    const noHouse = normalized
      .replace(/No\.\s*\d+\s*-\s*\d+/gi, '')
      .replace(/#\s*\d+\s*-\s*\d+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (noHouse !== normalized) {
      results = await nominatimFetch(noHouse)
      if (results.length > 0) return results
    }

    // Paso 3: extraer solo la vía principal ("calle 9", "carrera 27") del input
    // original y buscarla junto con la ciudad. Nominatim sí tiene indexadas las
    // calles base de Bucaramanga pero no siempre reconoce barrios.
    const viaMatch = q.match(/\b(calle|carrera|avenida|diagonal|transversal|cra|cl|av|dg|tv)\s*\d+[A-Za-z]?\b/i)
    const via = viaMatch ? viaMatch[0] : null
    const cityMatch = q.match(/\b(bucaramanga|floridablanca|gir[oó]n|piedecuesta)\b/i)
    const city = cityMatch ? cityMatch[0] : 'Bucaramanga'
    if (via) {
      results = await nominatimFetch(`${via}, ${city}, Santander, Colombia`)
      if (results.length > 0) return results
    }

    // Paso 4: barrio + ciudad (sin vía, por si el cliente escribió solo el barrio).
    const barrioWords = q
      .replace(/#\s*\d+\s*-\s*\d+/g, '')
      .replace(/\b(calle|carrera|avenida|diagonal|transversal|cra|cl|av|dg|tv)\s*\d+[A-Za-z]?\b/gi, '')
      .replace(/[,]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (barrioWords) {
      results = await nominatimFetch(`${barrioWords}, ${city}, Santander, Colombia`)
    }
    return results
  }

  // Busca sólo cuando el usuario lo pide (click en botón o Enter).
  // Si recibe 1 único resultado → lo selecciona automáticamente.
  const searchAddress = async (q) => {
    const trimmed = q.trim()
    if (trimmed.length < 4) {
      setError('Escribe al menos 4 caracteres de la dirección.')
      return
    }
    setError('')
    // Limpiamos cotización previa: el banner "fuera de cobertura" de una
    // búsqueda anterior no debe confundir al cliente en la nueva.
    setQuote(null)
    setConfirmed(false)
    setSearching(true)
    try {
      const data = useGoogle && googleReady ? await searchGoogle(q) : await searchNominatim(q)
      if (data.length === 0) {
        setResults([])
        setShowResults(false)
        setError(
          'No encontramos esa dirección. Intenta con más detalle, p. ej. "Calle 9 # 25-34 La Universidad, Bucaramanga".'
        )
        return
      }
      setResults(data)
      setShowResults(true)
      // Si sólo hay una sugerencia, la seleccionamos automáticamente
      if (data.length === 1) {
        pickResult(data[0])
      }
    } catch (_e) {
      setResults([])
      setError('No pudimos buscar la dirección. Intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  // Solo actualiza el texto del input; NO dispara búsqueda automática.
  // El cliente debe pulsar el botón Buscar o Enter.
  const onQueryChange = (v) => {
    setQuery(v)
    // Si escribe, ocultamos resultados viejos pero no limpiamos el error hasta nueva búsqueda.
    if (showResults) setShowResults(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchAddress(query)
    }
  }

  const runQuote = async (lat, lng, city, addressOverride) => {
    setQuoting(true)
    setError('')
    try {
      const data = await api.post(
        '/api/delivery/quote',
        { lat, lng, city, subtotal: Number(subtotal) || 0 },
        { skipAuth: true }
      )
      const draft = {
        method: 'delivery',
        address: addressOverride || query,
        lat,
        lng,
        city: data.city,
        cost: data.cost,
        distance_km: data.distance_km,
        in_coverage: data.in_coverage,
        reason: data.reason,
        free: data.free
      }
      setQuote(draft)
      // Abrimos modal confirmatorio en lugar de propagar de una.
      // Mientras el cliente no confirme, el carrito sigue sin dirección válida.
      setPendingDraft(draft)
      setConfirmOpen(true)
      setConfirmed(false)
      onChange?.({ method: 'delivery', cost: 0, in_coverage: false, reason: 'Pendiente confirmar' })
    } catch (e) {
      setError(e.message || 'No pudimos cotizar el domicilio')
    } finally {
      setQuoting(false)
    }
  }

  // Cliente confirma la dirección desde el modal. Si arrastró el marker, recotiza
  // con las coordenadas finales antes de propagar al carrito.
  const handleConfirm = async (draggedPoint) => {
    if (draggedPoint) {
      // Re-cotizar con punto final
      try {
        const data = await api.post(
          '/api/delivery/quote',
          { lat: draggedPoint.lat, lng: draggedPoint.lng, city: pendingDraft?.city, subtotal: Number(subtotal) || 0 },
          { skipAuth: true }
        )
        const finalDraft = {
          method: 'delivery',
          address: pendingDraft?.address,
          lat: draggedPoint.lat,
          lng: draggedPoint.lng,
          city: data.city,
          cost: data.cost,
          distance_km: data.distance_km,
          in_coverage: data.in_coverage,
          reason: data.reason,
          free: data.free
        }
        setQuote(finalDraft)
        setPendingDraft(finalDraft)
        if (!finalDraft.in_coverage) {
          setError(finalDraft.reason)
          return
        }
        onChange?.(finalDraft)
        setConfirmed(true)
        setConfirmOpen(false)
      } catch (e) {
        setError(e.message || 'No pudimos recalcular el domicilio')
      }
      return
    }
    onChange?.(pendingDraft)
    setConfirmed(true)
    setConfirmOpen(false)
  }

  const handleEditAddress = () => {
    setConfirmed(false)
    setQuote(null)
    setQuery('')
    onChange?.({ method: 'delivery', cost: 0, in_coverage: false, reason: 'Sin dirección' })
  }

  // Resolver coordenadas: Google necesita un getDetails(); Nominatim ya las trae.
  const pickResult = async (r) => {
    if (r.source === 'google') {
      try {
        // API nueva: Place.fetchFields() reemplaza a PlacesService.getDetails().
        const place = r.placePrediction.toPlace()
        await place.fetchFields({ fields: ['location', 'formattedAddress'] })
        if (!place.location) {
          setError('No pudimos obtener las coordenadas. Elige otra dirección.')
          return
        }
        const lat = place.location.lat()
        const lng = place.location.lng()
        const display = place.formattedAddress || r.display_name
        const city = inferCity(display)
        setQuery(display)
        setShowResults(false)
        setResults([])
        // Google recomienda renovar el session token tras cada selección exitosa.
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        runQuote(lat, lng, city)
      } catch (_e) {
        setError('No pudimos obtener las coordenadas. Elige otra dirección.')
      }
    } else {
      const city = inferCity(r.display_name)
      setQuery(r.display_name)
      setShowResults(false)
      setResults([])
      runQuote(r.lat, r.lng, city)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod('delivery')}
          className={`border rounded-lg p-3 text-left transition ${
            method === 'delivery' ? 'border-primary bg-red-50' : 'border-gray-300 hover:border-gray-400'
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
            method === 'pickup' ? 'border-primary bg-red-50' : 'border-gray-300 hover:border-gray-400'
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Ej: Calle 9 #25-34 La Universidad, Bucaramanga"
                className="input"
                autoComplete="street-address"
              />
            </div>
            <button
              type="button"
              onClick={() => searchAddress(query)}
              disabled={searching || query.trim().length < 4}
              aria-label="Buscar dirección de domicilio"
              className="btn-primary inline-flex items-center gap-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span className="hidden sm:inline">Buscar dirección</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Escribe tu dirección completa y pulsa <strong>Buscar</strong> (o Enter).
          </p>

          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={r.place_id || i}
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

          {!useGoogle && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 inline-block">
              Modo limitado: si no encuentra tu dirección, confírmanos por WhatsApp.
            </p>
          )}

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
                  {quote.free ? '¡Envío gratis!' : `Domicilio: ${fmtCOP(quote.cost)}`}
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
                <p className="font-medium">¿Tu dirección está fuera de nuestra cobertura habitual?</p>
                <p className="text-xs mt-0.5">{quote.reason}</p>
                <p className="text-xs mt-1">No te preocupes — escríbenos por WhatsApp y vemos cómo llevarte tu pedido.</p>
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

      <DeliveryConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        onEdit={handleEditAddress}
        draft={pendingDraft}
      />

      {confirmed && quote?.in_coverage && method === 'delivery' && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <MapPin size={12} /> Ver en el mapa / cambiar
        </button>
      )}
    </div>
  )
}

export default DeliveryPicker
