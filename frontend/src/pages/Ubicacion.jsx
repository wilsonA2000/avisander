import { MapPin, Clock, Phone, Navigation } from 'lucide-react'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, whatsappLink, formatPhone } from '../context/SettingsContext'

const STORE_DEFAULT = { lat: 7.1192, lng: -73.1227 }

function Ubicacion() {
  useScrollToTop()
  const { settings } = useSettings()
  const lat = Number(settings.store_lat) || STORE_DEFAULT.lat
  const lng = Number(settings.store_lng) || STORE_DEFAULT.lng
  const address = settings.store_address || 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga'
  const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  // Embed sin API key. `q=` acepta lat,lng o dirección textual.
  const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=es&z=16&output=embed`

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <SEO
        title="Ubicación · Avisander"
        description={`Estamos en ${address}. Ven a visitarnos o recibe tu pedido a domicilio.`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: settings.store_name || 'Avisander',
          address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Bucaramanga', addressCountry: 'CO' },
          geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
        }}
      />

      <div className="text-center mb-8">
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
          Visítanos
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-3">Nuestra tienda</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Pasa por nuestra tienda en San Alonso, Bucaramanga. Te atendemos con la misma pasión con la que
          seleccionamos cada corte.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="rounded-2xl overflow-hidden shadow-soft border border-gray-100 bg-gray-50">
          <iframe
            title="Ubicación de Avisander en Google Maps"
            src={embedUrl}
            width="100%"
            height="440"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Dirección</h3>
                <p className="text-gray-600 text-sm mt-1">{address}</p>
              </div>
            </div>
            <a
              href={gmapsDirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
            >
              <Navigation size={14} />
              Cómo llegar
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Horarios</h3>
                <div className="text-gray-600 text-sm mt-1 space-y-0.5">
                  <div>Lunes a viernes: {settings.business_hours_weekday}</div>
                  {settings.business_hours_saturday && (
                    <div>Sábados: {settings.business_hours_saturday}</div>
                  )}
                  <div className="text-gray-500">{settings.business_hours_weekend}</div>
                  {settings.business_hours_holiday && (
                    <div className="text-xs text-gray-400 italic mt-1">{settings.business_hours_holiday}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage/20 text-sage flex items-center justify-center flex-shrink-0">
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal">Contacto</h3>
                <p className="text-gray-600 text-sm mt-1">{formatPhone(settings.whatsapp_number)}</p>
                <a
                  href={whatsappLink(settings.whatsapp_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-primary hover:underline"
                >
                  Escribir por WhatsApp →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ubicacion
