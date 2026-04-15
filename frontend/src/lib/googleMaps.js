// Carga lazy del script de Google Maps con la librería Places.
// Si no hay VITE_GOOGLE_MAPS_API_KEY, devuelve null y los componentes hacen fallback.

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let loadingPromise = null

export function isGoogleMapsEnabled() {
  return !!API_KEY
}

export function loadGoogleMaps() {
  if (!API_KEY) return Promise.resolve(null)
  if (window.google?.maps?.places) return Promise.resolve(window.google)
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const cb = `__avisander_gmaps_cb_${Date.now()}`
    window[cb] = () => {
      delete window[cb]
      resolve(window.google)
    }
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&language=es&region=CO&callback=${cb}`
    script.onerror = () => {
      delete window[cb]
      loadingPromise = null
      reject(new Error('No se pudo cargar Google Maps'))
    }
    document.head.appendChild(script)
  })
  return loadingPromise
}
