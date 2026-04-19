// Cálculo de tarifa de domicilio.
// Tienda: Cra 30 #20-70 Local 2, San Alonso, Bucaramanga.
// Modelo: distancia haversine desde la tienda → tarifa por anillos para Bucaramanga,
// y tarifa fija por ciudad para municipios cercanos (Girón, Floridablanca, Piedecuesta).

// Coordenadas EXACTAS del local real de Avisander, verificadas vía Google Places
// (búsqueda "Avisander" el 2026-04-14): Cra. 30 #20-70, Bucaramanga, Santander.
const STORE = {
  lat: Number(process.env.STORE_LAT) || 7.1294038,
  lng: Number(process.env.STORE_LNG) || -73.1170752,
  city: 'bucaramanga',
  address: 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga'
}

const MAX_DISTANCE_KM = 15
const FREE_DELIVERY_THRESHOLD = 200000 // pesos (solo Bucaramanga)

// Tarifa fija por municipio del área metropolitana (definida con Wilson 2026-04-14).
const CITY_FLAT_RATE = {
  giron: 15000,
  floridablanca: 15000,
  piedecuesta: 18000
}

// Whitelist de cobertura: ciudades donde SÍ entregamos. Si el cliente declara
// otra ciudad (ej. "Medellín"), cortamos antes del cálculo por distancia — la
// línea recta podría ser < 15 km aunque operativamente no despachemos allá.
const SERVED_CITIES = new Set(['bucaramanga', 'giron', 'floridablanca', 'piedecuesta'])

// Anillos para Bucaramanga ciudad. Tarifa mínima $4.000 hasta 1km desde San Alonso.
// Cacique (CC) y sectores cercanos quedan en ~3.5–4 km → $8.000.
function bucaramangaTier(km) {
  if (km <= 1) return 4000   // Centro / San Alonso / Cabecera cercana
  if (km <= 2) return 6000
  if (km <= 4) return 8000   // Cacique CC, La Floresta, Provenza
  if (km <= 7) return 11000
  if (km <= 10) return 14000 // Norte / Sur lejano de Bucaramanga
  if (km <= 15) return 15000 // Cap al máximo declarado
  return null                // fuera de cobertura urbana
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function normalizeCity(city) {
  if (!city) return null
  return city
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Calcula tarifa según coordenadas y subtotal.
 * @param {object} args
 * @param {number} args.lat
 * @param {number} args.lng
 * @param {string} [args.city]  Nombre del municipio si se conoce.
 * @param {number} [args.subtotal=0]  Para evaluar envío gratis.
 * @returns {{cost:number|null, distance_km:number, in_coverage:boolean, reason:string, free:boolean, city:string|null}}
 */
function quoteDelivery({ lat, lng, city, subtotal = 0 }) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return {
      cost: null,
      distance_km: 0,
      in_coverage: false,
      reason: 'Coordenadas inválidas',
      free: false,
      city: null
    }
  }

  const km = haversineKm(STORE.lat, STORE.lng, lat, lng)
  const norm = normalizeCity(city)

  // Whitelist: si el cliente declara una ciudad y NO está en la lista,
  // cortamos antes del cálculo. Si norm es null, caemos al tier por distancia.
  if (norm && !SERVED_CITIES.has(norm)) {
    return {
      cost: null,
      distance_km: km,
      in_coverage: false,
      reason: `Por ahora solo entregamos en Bucaramanga, Floridablanca, Girón y Piedecuesta. Ciudad detectada: ${norm}.`,
      free: false,
      city: norm
    }
  }

  // Bloqueo duro por distancia
  if (km > MAX_DISTANCE_KM) {
    return {
      cost: null,
      distance_km: km,
      in_coverage: false,
      reason: `Por ahora no entregamos a más de ${MAX_DISTANCE_KM} km de la tienda. Distancia detectada: ${km.toFixed(1)} km.`,
      free: false,
      city: norm
    }
  }

  // Si la dirección está en otro municipio del área, usamos la tarifa fija de ese municipio.
  if (norm && CITY_FLAT_RATE[norm]) {
    return {
      cost: CITY_FLAT_RATE[norm],
      distance_km: km,
      in_coverage: true,
      reason: `Tarifa fija ${norm.charAt(0).toUpperCase() + norm.slice(1)}`,
      free: false,
      city: norm
    }
  }

  // Bucaramanga (o sin ciudad declarada → asumimos Bucaramanga si está en rango)
  const tier = bucaramangaTier(km)
  if (tier == null) {
    return {
      cost: null,
      distance_km: km,
      in_coverage: false,
      reason: 'Fuera del área de cobertura',
      free: false,
      city: norm || 'bucaramanga'
    }
  }

  // Envío gratis SOLO en Bucaramanga (no aplica a otros municipios)
  const isBucaramanga = !norm || norm === 'bucaramanga'
  const free = isBucaramanga && subtotal >= FREE_DELIVERY_THRESHOLD

  return {
    cost: free ? 0 : tier,
    distance_km: km,
    in_coverage: true,
    reason: free
      ? `¡Envío gratis! Pedido de $${subtotal.toLocaleString('es-CO')} supera $${FREE_DELIVERY_THRESHOLD.toLocaleString('es-CO')}.`
      : `Tarifa por distancia (${km.toFixed(1)} km)`,
    free,
    city: norm || 'bucaramanga'
  }
}

module.exports = {
  quoteDelivery,
  haversineKm,
  STORE,
  MAX_DISTANCE_KM,
  FREE_DELIVERY_THRESHOLD,
  CITY_FLAT_RATE
}
