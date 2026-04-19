// Home premium: hero editorial + categorías + destacados + oferta + recetas.
// Sin duplicación con el footer (contacto/horarios solo en el footer).

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Truck,
  Snowflake,
  MessageCircle,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ProductCarousel from '../components/ProductCarousel'
import Icon3D from '../components/Icon3D'
import { api } from '../lib/apiClient'
import { useSettings, whatsappLink } from '../context/SettingsContext'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import RecipeImage from '../components/RecipeImage'
import CategoryIcon from '../components/CategoryIcon'
import SEO from '../components/SEO'
import AnimatedSection from '../components/AnimatedSection'

const BANNER_CANDIDATES = [
  { src: '/media/publicidad/banners/banner-1.webp', alt: 'Promoción Avisander', link: '/productos?on_sale=1' },
  { src: '/media/publicidad/banners/banner-2.webp', alt: 'Productos destacados', link: '/productos?sort=newest' },
  { src: '/media/publicidad/banners/banner-3.webp', alt: 'Recetas Avisander', link: '/recetas' }
]

function Hero({ settings }) {
  const [banners, setBanners] = useState([])
  const [idx, setIdx] = useState(0)

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

  if (banners.length === 0) {
    return (
      <section
        className="relative overflow-hidden rounded-3xl mb-10 min-h-[calc(100vh-180px)] md:min-h-[calc(100vh-200px)] flex items-center bg-charcoal"
      >
        {/* Imagen IA del hero — LCP element. Animación ken-burns sutil solo en
            desktop: scale lento + pan. No corre en mobile para no gastar GPU. */}
        <picture className="absolute inset-0 w-full h-full">
          <source media="(min-width: 768px)" srcSet="/hero-poster.webp" />
          <img
            src="/hero-poster-mobile.webp"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover hero-kenburns"
          />
        </picture>
        {/* Gradient overlay: da legibilidad al texto sin tapar la imagen. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(95deg, rgba(26,26,26,0.82) 0%, rgba(90,20,26,0.65) 50%, rgba(26,26,26,0.3) 100%)'
          }}
          aria-hidden="true"
        />
        {/* Firma tipográfica en el hero (estilo editorial). En lugar de embed
            del logo oficial —que lleva placa amarilla y se ve pegado—, usamos
            el nombre en la fuente de marca con opacidad baja. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 bottom-5 md:right-12 md:bottom-10 text-right"
        >
          <p className="font-display font-black tracking-tight text-white/15 text-3xl md:text-5xl leading-none italic">
            Avisander
          </p>
          <p className="text-[9px] md:text-[11px] uppercase tracking-[0.3em] text-white/25 font-medium mt-1">
            Carnicería Premium · Bucaramanga
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-8 py-10 md:px-14 md:py-12 max-w-2xl text-white"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-[1.05] drop-shadow-md">
            <span className="hero-shimmer hero-shimmer--white">Carne fresca,</span><br />
            <span className="hero-shimmer hero-shimmer--primary italic">directo a tu mesa.</span>
          </h1>
          <p className="text-white/85 text-base md:text-lg mb-6 max-w-xl leading-relaxed">
            Cortes de res, cerdo, pollo y mucho más con cadena de frío garantizada.
            Haz tu pedido y recibe en la puerta de tu casa en toda el área metropolitana.
          </p>
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/productos"
                className="inline-flex items-center gap-2 bg-white text-charcoal hover:bg-cream font-semibold px-6 py-3 md:px-7 md:py-3.5 rounded-xl transition-colors shadow-xl"
              >
                Ver catálogo
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <a
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 md:px-7 md:py-3.5 rounded-xl transition-colors shadow-xl"
              >
                <MessageCircle size={16} />
                Pedir por WhatsApp
              </a>
            </motion.div>
          </div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
            className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75"
          >
            {[
              { Icon: Snowflake, text: 'Cadena de frío' },
              { Icon: Truck, text: 'Domicilios desde $2.000' },
              { Icon: ShieldCheck, text: 'Calidad garantizada' }
            ].map(({ Icon, text }) => (
              <motion.span
                key={text}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                className="inline-flex items-center gap-1.5"
              >
                <Icon size={14} className="text-accent" />
                {text}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>
    )
  }

  const current = banners[idx]
  return (
    <section className="relative rounded-3xl overflow-hidden mb-10 aspect-[21/9] md:aspect-[3/1] bg-gray-100 shadow-soft">
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
      api.get('/api/categories?stats=1', { skipAuth: true }).catch(() => []),
      api.get('/api/products/featured', { skipAuth: true }).catch(() => []),
      api.get('/api/products/on-sale', { skipAuth: true }).catch(() => []),
      api.get('/api/products?sort=newest&per_page=10&page=1', { skipAuth: true }).catch(() => ({ items: [] })),
      api.get('/api/recipes?limit=3&random=1', { skipAuth: true }).catch(() => [])
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
    priceRange: '$$'
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-12 md:space-y-16">
      <SEO jsonLd={jsonLd} />
      <Hero settings={settings} />

      {categories.length > 0 && (
        <AnimatedSection>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Explora por categoría</h2>
              <p className="text-sm text-gray-500 mt-1">Elige tu corte favorito y empieza a armar el pedido.</p>
            </div>
            <Link
              to="/productos"
              className="hidden sm:inline-flex text-sm text-primary hover:underline items-center gap-1"
            >
              Ver todos los productos <ArrowRight size={14} />
            </Link>
          </div>

          {(() => {
            const sorted = [...categories].sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
            const heroCats = sorted.slice(0, 4)
            const restCats = sorted.slice(4)
            const countLabel = (n) => (n === 0 ? 'Próximamente' : n === 1 ? '1 producto' : `${n} productos`)

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  {heroCats.map((c) => {
                    const count = c.product_count ?? 0
                    return (
                      <Link
                        key={c.id}
                        to={`/productos?category=${encodeURIComponent(c.name.toLowerCase())}`}
                        className="relative group aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden
                                   shadow-md hover:shadow-2xl transition-all duration-500
                                   hover:-translate-y-1 bg-gradient-to-br from-primary/20 via-cream to-primary/10"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
                          <CategoryIcon
                            category={c.name}
                            variant="inline"
                            className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-2xl"
                          />
                        </div>

                        {c.hero_image && (
                          <img
                            src={c.hero_image}
                            alt={c.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                            className="absolute inset-0 w-full h-full object-cover
                                       transition-transform duration-700 group-hover:scale-110"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10
                                        group-hover:from-black/85 transition-colors duration-500" />

                        {c.has_sale && (
                          <span className="absolute top-3 right-3 inline-flex items-center text-[10px] font-bold uppercase tracking-wider
                                           bg-red-500 text-white px-2 py-1 rounded-full shadow-lg">
                            Oferta
                          </span>
                        )}

                        <div className="absolute top-3 left-3">
                          <CategoryIcon
                            category={c.name}
                            variant="circle"
                            className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-xl transition-transform duration-300
                                       group-hover:scale-110 group-hover:-rotate-6"
                          />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <h3 className="font-display font-bold text-lg sm:text-xl leading-tight drop-shadow-md">
                            {c.name}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs sm:text-sm text-white/90">{countLabel(count)}</span>
                            <ArrowRight
                              size={18}
                              className="text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all"
                            />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {restCats.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {restCats.map((c) => {
                      const count = c.product_count ?? 0
                      return (
                        <Link
                          key={c.id}
                          to={`/productos?category=${encodeURIComponent(c.name.toLowerCase())}`}
                          className="relative group bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3
                                     border border-gray-100 shadow-sm hover:shadow-lg
                                     hover:-translate-y-0.5 hover:border-primary/30
                                     transition-all duration-300 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0
                                          group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                          <CategoryIcon
                            category={c.name}
                            variant="circle"
                            className="w-11 h-11 sm:w-14 sm:h-14 flex-shrink-0 transition-transform duration-300
                                       group-hover:scale-110 group-hover:-rotate-3"
                          />

                          <div className="min-w-0 flex-1 relative">
                            <h3 className="font-display font-semibold text-sm sm:text-base text-charcoal leading-tight
                                           line-clamp-2 group-hover:text-primary transition-colors break-words">
                              {c.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                              <span className="text-[11px] sm:text-xs text-gray-500">{countLabel(count)}</span>
                              {c.has_sale && (
                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide
                                                 bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                                  Oferta
                                </span>
                              )}
                            </div>
                          </div>

                          <ArrowRight
                            size={16}
                            className="hidden sm:block text-gray-300 group-hover:text-primary group-hover:translate-x-1
                                       transition-all flex-shrink-0"
                          />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </>
            )
          })()}
        </AnimatedSection>
      )}

      {/* Banda descubrimiento: despiece interactivo */}
      <AnimatedSection className="relative rounded-3xl overflow-hidden bg-charcoal text-white p-6 md:p-10">
        <img
          src="/ai-despiece-pollo.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-transparent" aria-hidden="true" />
        <div className="relative grid md:grid-cols-2 gap-4 items-center">
          <div>
            <p className="inline-block text-[10px] uppercase tracking-[0.25em] text-primary font-semibold mb-2">
              Guía del corte
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-3">
              Descubre cada parte del pollo
            </h2>
            <p className="text-white/75 mb-5 max-w-md leading-relaxed">
              Pechuga, muslos, alas, piernas, rabadilla. Explora en qué receta
              brilla cada corte, cuánta proteína aporta y cómo prepararlo.
            </p>
            <Link
              to="/despiece/pollo"
              className="inline-flex items-center gap-2 bg-white text-charcoal hover:bg-cream font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg"
            >
              Explorar el pollo <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hidden md:block" />
        </div>
      </AnimatedSection>

      {/* Destacados — carrusel para soportar cualquier cantidad >= 1 */}
      {featured.length > 0 && (
        <AnimatedSection>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal">Destacados</h2>
              <p className="text-sm text-gray-500 mt-1">Los cortes que no puedes dejar pasar.</p>
            </div>
            <Link
              to="/productos?featured=1"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <ProductCarousel items={featured} />
        </AnimatedSection>
      )}

      {recentlyViewed.length > 0 && (
        <AnimatedSection>
          <ProductCarousel title="Sigue comprando" items={recentlyViewed.slice(0, 12)} />
        </AnimatedSection>
      )}

      {/* En oferta */}
      {onSale.length > 0 && (
        <AnimatedSection>
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <Icon3D name="fire" size="sm" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal">En oferta</h2>
                <p className="text-sm text-gray-500">Aprovecha mientras dure.</p>
              </div>
            </div>
            <Link
              to="/productos?on_sale=1"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <ProductCarousel items={onSale} />
        </AnimatedSection>
      )}

      {newest.length > 0 && (
        <AnimatedSection>
          <ProductCarousel title="Recién agregados" items={newest} />
        </AnimatedSection>
      )}

      <PromoBanner />

      {/* Recetas */}
      {recipes.length > 0 && (
        <AnimatedSection>
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ChefHat size={20} />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-charcoal">
                  Recetas para inspirarte
                </h2>
                <p className="text-sm text-gray-500">Saca el mejor provecho a cada corte.</p>
              </div>
            </div>
            <Link
              to="/recetas"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.slice(0, 3).map((r) => (
              <motion.div key={r.id} whileHover={{ y: -4 }}>
                <Link
                  to={`/recetas/${r.slug}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-soft transition-shadow overflow-hidden flex flex-col h-full border border-gray-100"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <RecipeImage recipe={r} size="sm" />
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-display font-bold text-lg text-charcoal line-clamp-2">{r.title}</h3>
                    {r.summary && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.summary}</p>}
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-3">
                      {r.duration_min && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {r.duration_min} min
                        </span>
                      )}
                      {r.difficulty && <span className="capitalize">· {r.difficulty}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      )}

      {loading && featured.length === 0 && (
        <div className="text-center text-gray-500 py-8">Cargando…</div>
      )}
    </div>
  )
}

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
      <Link to="/productos?on_sale=1" className="block rounded-3xl overflow-hidden shadow-soft">
        <img src={src} alt="Promoción" className="w-full object-cover max-h-[260px]" />
      </Link>
    </section>
  )
}

export default Home
