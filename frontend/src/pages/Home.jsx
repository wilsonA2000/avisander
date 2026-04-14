// Home estilo eBay: hero + filas temáticas + recetas + recientemente vistos.
// Banners se leen por convención de la carpeta backend/media/publicidad/banners.
// Como no tenemos API de banners aún, probamos rutas conocidas y si 200, las mostramos.

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Clock, Truck, Snowflake, MessageCircle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ProductCarousel from '../components/ProductCarousel'
import { api } from '../lib/apiClient'
import { useSettings, whatsappLink, telLink, formatPhone } from '../context/SettingsContext'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import RecipeImage from '../components/RecipeImage'
import CategoryIcon from '../components/CategoryIcon'
import SEO from '../components/SEO'

// Rutas candidatas de banner. Si el archivo no existe, la imagen no se renderiza (onError).
const BANNER_CANDIDATES = [
  { src: '/media/publicidad/banners/banner-1.webp', alt: 'Promoción Avisander', link: '/productos?on_sale=1' },
  { src: '/media/publicidad/banners/banner-2.webp', alt: 'Productos destacados', link: '/productos?sort=newest' },
  { src: '/media/publicidad/banners/banner-3.webp', alt: 'Recetas Avisander', link: '/recetas' }
]

function Hero({ settings }) {
  const [banners, setBanners] = useState([])
  const [idx, setIdx] = useState(0)
  const [heroVideoOk, setHeroVideoOk] = useState(false)

  // Chequeo si el video hero existe y es reproducible.
  // HEAD 200 no basta: el archivo puede ser inválido. Cargamos los metadatos en un
  // <video> oculto y solo activamos el hero cuando dispara `loadedmetadata`.
  useEffect(() => {
    let cancelled = false
    const probe = document.createElement('video')
    probe.muted = true
    probe.preload = 'metadata'
    probe.src = '/media/videos/hero.mp4'
    const onOk = () => { if (!cancelled) setHeroVideoOk(true); cleanup() }
    const onFail = () => { if (!cancelled) setHeroVideoOk(false); cleanup() }
    const cleanup = () => {
      probe.removeEventListener('loadedmetadata', onOk)
      probe.removeEventListener('error', onFail)
    }
    probe.addEventListener('loadedmetadata', onOk)
    probe.addEventListener('error', onFail)
    // Timeout de seguridad
    const t = setTimeout(onFail, 4000)
    return () => { cancelled = true; clearTimeout(t); cleanup() }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all(
      BANNER_CANDIDATES.map(
        (b) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(b)
            img.onerror = () => resolve(null)
            img.src = b.src
          })
      )
    ).then((res) => {
      if (cancelled) return
      setBanners(res.filter(Boolean))
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  // Si no hay banners reales todavía, hero con gradiente + CTA.
  if (banners.length === 0) {
    // Hero premium: si existe /media/videos/hero.mp4 lo usamos como fondo (auto-play mudo loop).
    // Si no, cae a foto de Unsplash. El admin puede sustituir en cualquier momento.
    return (
      <section
        className="relative overflow-hidden rounded-2xl mb-8 min-h-[340px] md:min-h-[440px] flex items-center"
        style={
          heroVideoOk
            ? undefined
            : {
                backgroundImage:
                  "linear-gradient(90deg, rgba(153,27,27,0.92) 0%, rgba(153,27,27,0.55) 55%, rgba(0,0,0,0.15) 100%), url('https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1920&q=75&auto=format&fit=crop')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
        }
      >
        {heroVideoOk && (
          <>
            <video
              src="/media/videos/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setHeroVideoOk(false)}
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(153,27,27,0.92) 0%, rgba(153,27,27,0.55) 55%, rgba(0,0,0,0.25) 100%)'
              }}
              aria-hidden="true"
            />
          </>
        )}
        <div className="relative z-10 p-8 md:p-14 max-w-2xl text-white">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] bg-white/15 backdrop-blur rounded-full px-3 py-1 mb-4 border border-white/30">
            {settings.store_name || 'Avisander'} · Bucaramanga
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-[1.05] drop-shadow-md">
            Carnicería premium,<br />
            <span className="text-white/90">cortes perfectos.</span>
          </h1>
          <p className="text-white/90 text-lg mb-7 max-w-lg">
            Res, cerdo, pollo y especialidades seleccionadas. Cadena de frío garantizada y entrega a domicilio en toda el área metropolitana.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/productos"
              className="bg-white text-primary hover:bg-gray-100 font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Ver catálogo →
            </Link>
            <a
              href={whatsappLink(settings.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Pedir por WhatsApp
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">❄️ Cadena de frío</span>
            <span className="inline-flex items-center gap-1">🚚 Domicilios desde $2.000</span>
            <span className="inline-flex items-center gap-1">💬 Atención por WhatsApp</span>
          </div>
        </div>
      </section>
    )
  }

  const current = banners[idx]
  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 aspect-[21/9] md:aspect-[3/1] bg-gray-100">
      <Link to={current.link}>
        <img src={current.src} alt={current.alt} className="w-full h-full object-cover" />
      </Link>
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
              aria-label={`Ir al banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function Home() {
  const { settings } = useSettings()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [onSale, setOnSale] = useState([])
  const [newest, setNewest] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const { items: recentlyViewed } = useRecentlyViewed()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/categories', { skipAuth: true }).catch(() => []),
      api.get('/api/products/featured', { skipAuth: true }).catch(() => []),
      api.get('/api/products/on-sale', { skipAuth: true }).catch(() => []),
      api.get('/api/products?sort=newest&per_page=10&page=1', { skipAuth: true }).catch(() => ({ items: [] })),
      api.get('/api/recipes?limit=6', { skipAuth: true }).catch(() => [])
    ])
      .then(([cats, feat, sale, newRaw, rec]) => {
        setCategories(cats || [])
        setFeatured(Array.isArray(feat) ? feat : [])
        setOnSale(Array.isArray(sale) ? sale : [])
        setNewest(newRaw?.items || [])
        setRecipes(Array.isArray(rec) ? rec : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': typeof window !== 'undefined' ? window.location.origin : 'https://avisander.com',
    name: settings.store_name || 'Avisander',
    description: 'Carnicería premium en Bucaramanga con cadena de frío y entregas a domicilio.',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://avisander.com',
    telephone: `+57${String(settings.whatsapp_number || '').replace(/\D/g, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.store_address || 'Cra 30 #20-70 Local 2',
      addressLocality: 'Bucaramanga',
      addressRegion: 'Santander',
      addressCountry: 'CO'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: Number(settings.store_lat) || 7.1192,
      longitude: Number(settings.store_lng) || -73.1227
    },
    openingHours: [
      `Mo-Sa ${(settings.business_hours_weekday || '7:00 AM - 7:00 PM').replace(' AM', '').replace(' PM', '')}`,
      `Su ${(settings.business_hours_weekend || '7:00 AM - 1:00 PM').replace(' AM', '').replace(' PM', '')}`
    ],
    priceRange: '$$'
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-10 md:space-y-14">
      <SEO jsonLd={jsonLd} />
      <Hero settings={settings} />

      {/* Categorías circulares con glassmorfismo */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Explora por categoría</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {categories.map((c) => {
              return (
                <Link
                  key={c.id}
                  to={`/productos?category=${encodeURIComponent(c.name.toLowerCase())}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                  <CategoryIcon
                    category={c.name}
                    variant="circle"
                    className="w-20 h-20 group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="text-xs font-medium text-gray-700 text-center max-w-[80px] truncate group-hover:text-primary transition-colors">{c.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Destacados */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Destacados</h2>
            <Link to="/productos?featured=1" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Recientemente vistos */}
      {recentlyViewed.length > 0 && (
        <section>
          <ProductCarousel title="Sigue comprando" items={recentlyViewed.slice(0, 12)} />
        </section>
      )}

      {/* En oferta */}
      {onSale.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🔥 En oferta</h2>
            <Link to="/productos?on_sale=1" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onSale.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Recién agregados */}
      {newest.length > 0 && (
        <section>
          <ProductCarousel title="Recién agregados" items={newest} />
        </section>
      )}

      {/* Banner promocional intermedio (si existe) */}
      <PromoBanner />

      {/* Recetas */}
      {recipes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">👨‍🍳 Recetas para inspirarte</h2>
            <Link to="/recetas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.slice(0, 3).map((r) => (
              <Link
                key={r.id}
                to={`/recetas/${r.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <RecipeImage recipe={r} size="sm" />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2">{r.title}</h3>
                  {r.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>}
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
                    {r.duration_min && <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.duration_min} min</span>}
                    {r.difficulty && <span className="capitalize">· {r.difficulty}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Confianza / Contacto */}
      <section className="py-10 bg-gray-900 text-white rounded-2xl">
        <div className="px-6 md:px-10 grid md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Truck className="text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Entregas rápidas</h3>
              <p className="text-sm text-gray-300">Domicilios en Bucaramanga y área metropolitana.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Snowflake className="text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Cadena de frío</h3>
              <p className="text-sm text-gray-300">Todos los productos llegan refrigerados o congelados.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Atención WhatsApp</h3>
              <p className="text-sm text-gray-300">Coordinamos cortes y peso exacto por chat.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Horarios</h3>
              <p className="text-sm text-gray-300">L–S {settings.business_hours_weekday}<br />D {settings.business_hours_weekend}</p>
            </div>
          </div>
        </div>
        <div className="px-6 md:px-10 mt-8 flex flex-wrap gap-3">
          <a href={telLink(settings.whatsapp_number)} className="text-sm text-gray-300 hover:text-white">
            📞 {formatPhone(settings.whatsapp_number)}
          </a>
          <span className="text-sm text-gray-500">·</span>
          <span className="text-sm text-gray-300">{settings.store_address || 'Cra 30 #20-70, San Alonso, Bucaramanga'}</span>
          <a
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <MessageCircle size={14} /> Pedir por WhatsApp
          </a>
        </div>
      </section>

      {loading && featured.length === 0 && (
        <div className="text-center text-gray-500 py-8">Cargando…</div>
      )}
    </div>
  )
}

// Banner promocional intermedio. Muestra si existe /media/publicidad/promos/promo-1.*
function PromoBanner() {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let cancelled = false
    const candidates = [
      '/media/publicidad/promos/promo-1.webp',
      '/media/publicidad/promos/promo-1.jpg',
      '/media/publicidad/promos/promo-1.png'
    ]
    const tryOne = (i) => {
      if (i >= candidates.length || cancelled) return
      const img = new Image()
      img.onload = () => !cancelled && setSrc(candidates[i])
      img.onerror = () => tryOne(i + 1)
      img.src = candidates[i]
    }
    tryOne(0)
    return () => { cancelled = true }
  }, [])
  if (!src) return null
  return (
    <section>
      <Link to="/productos?on_sale=1" className="block rounded-2xl overflow-hidden">
        <img src={src} alt="Promoción" className="w-full object-cover max-h-[240px]" />
      </Link>
    </section>
  )
}

export default Home
