// Cálculo de tarifa de domicilio.
// Tienda: Cra 30 #20-70 Local 2, San Alonso, Bucaramanga.
// Modelo: distancia haversine desde la tienda → tarifa por anillos para Bucaramanga,
// y tarifa fija por ciudad para municipios cercanos (Girón, Floridablanca, Piedecuesta).

const STORE = {
  lat: Number(process.env.STORE_LAT) || 7.1192,
  lng: Number(process.env.STORE_LNG) || -73.1227,
  city: 'bucaramanga',
  address: 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga'
}

const MAX_DISTANCE_KM = 20
const FREE_DELIVERY_THRESHOLD = 200000 // pesos (solo Bucaramanga)

// Tarifa fija por municipio del área metropolitana
const CITY_FLAT_RATE = {
  giron: 18000,
  floridablanca: 15000,
  piedecuesta: 20000
}

// Anillos para Bucaramanga ciudad
function bucaramangaTier(km) {
  if (km <= 0.5) return 2000
  if (km <= 1) return 3000
  if (km <= 2) return 4500
  if (km <= 3) return 6000
  if (km <= 5) return 8000
  if (km <= 8) return 11000
  if (km <= 12) return 14000
  if (km <= 16) return 17000
  if (km <= 20) return 20000
  return null // fuera de cobertura
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
