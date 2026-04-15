// Modal confirmatorio del domicilio: mapa con 2 marcadores (tienda + destino),
// línea recta animada estilo Rappi/InDriver, marcador draggable para refinar,
// distancia + tarifa final. Cliente confirma o vuelve a buscar.

import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Truck, Edit3, Loader2 } from 'lucide-react'
import { loadGoogleMaps } from '../lib/googleMaps'

const STORE = {
  lat: Number(import.meta.env.VITE_STORE_LAT) || 7.1192,
  lng: Number(import.meta.env.VITE_STORE_LNG) || -73.1227,
  name: 'Avisander',
  address: 'Cra 30 #20-70 Local 2, San Alonso'
}

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

function DeliveryConfirmModal({ open, onClose, onConfirm, onEdit, draft }) {
  // draft: { lat, lng, address, city, cost, distance_km, in_coverage, reason, free }
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const polylineRef = useRef(null)
  const destinationMarkerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [draggingPoint, setDraggingPoint] = useState(null) // {lat,lng} mientras arrastra

  useEffect(() => {
    if (!open) return
    let cancelled = false
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !google || !mapRef.current || !draft?.lat) return

        // Centrar entre tienda y destino para que ambos se vean.
        const bounds = new google.maps.LatLngBounds()
        bounds.extend({ lat: STORE.lat, lng: STORE.lng })
        bounds.extend({ lat: draft.lat, lng: draft.lng })

        const map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative',
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] }
          ]
        })
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
        mapInstance.current = map

        // Marker tienda (verde).
        new google.maps.Marker({
          position: { lat: STORE.lat, lng: STORE.lng },
          map,
          title: `${STORE.name} · ${STORE.address}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        })

        // Marker destino (naranja Avisander, draggable).
        const dest = new google.maps.Marker({
          position: { lat: draft.lat, lng: draft.lng },
          map,
          title: draft.address || 'Destino',
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#F58220',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          }
        })
        destinationMarkerRef.current = dest

        // Polyline animada con symbol que se mueve a lo largo (efecto "tracé").
        const lineSymbol = {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          strokeColor: '#F58220',
          scale: 3
        }
        const line = new google.maps.Polyline({
          path: [
            { lat: STORE.lat, lng: STORE.lng },
            { lat: draft.lat, lng: draft.lng }
          ],
          strokeColor: '#F58220',
          strokeOpacity: 0.4,
          strokeWeight: 3,
          icons: [
            {
              icon: lineSymbol,
              offset: '0',
              repeat: '20px'
            }
          ],
          map
        })
        polylineRef.current = line

        // Animación: mover el offset 0% → 100% en bucle.
        let count = 0
        const animTimer = window.setInterval(() => {
          count = (count + 1) % 200
          const icons = line.get('icons')
          icons[0].offset = `${count / 2}%`
          line.set('icons', icons)
        }, 30)

        // Al arrastrar el destino: actualiza la línea + dispara recotización.
        dest.addListener('drag', (e) => {
          line.setPath([
            { lat: STORE.lat, lng: STORE.lng },
            { lat: e.latLng.lat(), lng: e.latLng.lng() }
          ])
        })
        dest.addListener('dragend', (e) => {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          setDraggingPoint({ lat, lng })
          // El padre se encarga de recotizar; aquí solo guardamos el punto local.
        })

        setReady(true)

        // Cleanup al cerrar.
        return () => {
          window.clearInterval(animTimer)
        }
      })
      .catch(() => setReady(false))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft?.lat, draft?.lng])

  if (!open) return null

  const showPoint = draggingPoint || draft

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            <h2 className="font-display text-lg font-bold text-charcoal">Confirma tu domicilio</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="mb-4 flex items-start gap-3 p-3 bg-cream rounded-xl">
            <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{draft?.address || 'Sin dirección'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Distancia desde {STORE.name}: <strong>{Number(draft?.distance_km || 0).toFixed(1)} km</strong>
              </p>
            </div>
          </div>

          {/* Mapa */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 320 }}>
            <div ref={mapRef} className="absolute inset-0 bg-gray-100" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-lg px-3 py-2 text-[11px] text-gray-600 shadow-md">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tienda
              </span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" /> Destino (arrastra para ajustar)
              </span>
            </div>
          </div>

          {/* Tarifa */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Distancia</p>
              <p className="text-xl font-bold text-charcoal">
                {Number(showPoint?.distance_km || draft?.distance_km || 0).toFixed(1)} km
              </p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <p className="text-xs uppercase tracking-wide text-primary mb-1">Domicilio</p>
              <p className="text-xl font-bold text-primary">
                {draft?.free ? '¡Gratis!' : fmtCOP(draft?.cost)}
              </p>
            </div>
          </div>

          {!draft?.in_coverage && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg">
              {draft?.reason || 'Esta dirección está fuera de nuestra cobertura.'}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              onEdit?.()
              onClose()
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit3 size={14} />
            Cambiar dirección
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(draggingPoint)}
            disabled={!draft?.in_coverage}
            className="btn-primary inline-flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirmar dirección
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeliveryConfirmModal
