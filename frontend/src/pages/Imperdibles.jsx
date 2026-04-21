import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Flame, ArrowRight, ShoppingCart, Zap } from 'lucide-react'
import { api } from '../lib/apiClient'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import FloatingFrame from '../components/imperdibles/FloatingFrame'
import CountdownBig from '../components/imperdibles/CountdownBig'
import SEO from '../components/SEO'

function formatCOP(n) {
  if (n == null || isNaN(Number(n))) return ''
  return `$${Math.round(Number(n)).toLocaleString('es-CO')}`
}

function useNearestDeadline(offers) {
  const deadlines = offers
    .map((o) => (o.ends_at ? new Date(o.ends_at).getTime() : null))
    .filter((v) => v && v > Date.now())
    .sort((a, b) => a - b)
  return deadlines[0] ? new Date(deadlines[0]).toISOString() : null
}

function Imperdibles() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCart()
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/offers/imperdibles', { skipAuth: true })
      .then((data) => {
        if (!cancelled) setOffers(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Error cargando imperdibles')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const nearestDeadline = useNearestDeadline(offers)

  function handleAdd(offer) {
    const product = {
      ...offer.product,
      price: offer.effective_price,
      original_price: offer.display_original_price
    }
    const res = addItem(product, { quantity: 1 })
    if (res.sale_type === 'by_weight') {
      toast.success(`${offer.product.name} agregado (500g) — precio imperdible aplicado`)
    } else if (res.added > 0) {
      toast.success(`${offer.product.name} agregado al carrito`)
    } else {
      toast.error('No hay stock disponible')
    }
    window.dispatchEvent(new Event('avisander:cart-bump'))
  }

  return (
    <div className="bg-gradient-to-b from-[#1a0f0f] via-[#2b0f0a] to-[#1a0f0f] text-white min-h-screen">
      <SEO
        title="Imperdibles · Avisander"
        description="Ofertas únicas que desaparecen en horas. Carnes premium con descuentos que no volverán."
      />

      <Hero nearestDeadline={nearestDeadline} hasOffers={offers.length > 0} />

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="container mx-auto px-4 py-16 text-center text-red-300">{error}</div>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="container mx-auto px-4 py-24 text-center">
          <Flame size={56} className="mx-auto text-orange-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No hay imperdibles activos ahora</h2>
          <p className="text-white/60 mb-6">
            Las ofertas rotan constantemente. Vuelve pronto o revisa nuestros productos en oferta.
          </p>
          <Link
            to="/productos?on_sale=1"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-full transition-colors"
          >
            Ver productos en oferta <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {offers.length > 0 && (
        <section
          className="snap-y snap-mandatory overflow-y-auto"
          style={{ height: 'auto' }}
        >
          {offers.map((offer, idx) => (
            <OfferSlide
              key={offer.id}
              offer={offer}
              index={idx}
              onAdd={() => handleAdd(offer)}
            />
          ))}
        </section>
      )}

      {offers.length > 0 && (
        <div className="py-20 text-center">
          <Link
            to="/productos?on_sale=1"
            className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-100 font-bold px-6 py-3 rounded-full transition-colors"
          >
            Ver todos los productos en oferta <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  )
}

function Hero({ nearestDeadline, hasOffers }) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(234,88,12,0.6), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(239,68,68,0.5), transparent 60%)'
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        initial={{ backgroundPosition: '0% 0%' }}
        animate={{ backgroundPosition: '100% 100%' }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
          backgroundSize: '200% 200%'
        }}
      />

      <div className="relative container mx-auto px-4 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.25em] text-orange-200 mb-5"
        >
          <Flame size={14} /> Ofertas que desaparecen
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-4"
        >
          <span className="block bg-gradient-to-br from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
            Imperdibles
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-white/70 max-w-xl mx-auto text-base md:text-lg mb-6"
        >
          Cortes premium con precios clearance. Cuando termina el contador, termina la oferta.
          {hasOffers ? ' Desliza para descubrir.' : ''}
        </motion.p>

        {nearestDeadline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="inline-flex flex-col items-center gap-2 bg-black/30 backdrop-blur rounded-2xl px-5 py-4 border border-white/10"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-orange-200/80 font-semibold">
              Próxima oferta termina en
            </span>
            <CountdownBig endsAt={nearestDeadline} compact />
          </motion.div>
        )}

        {hasOffers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-10 text-white/40 text-xs uppercase tracking-[0.3em]"
          >
            Desliza ↓
          </motion.div>
        )}
      </div>
    </div>
  )
}

function OfferSlide({ offer, index, onAdd }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const imageReversed = index % 2 === 1

  const product = offer.product || {}
  const isByWeight = product.sale_type === 'by_weight'
  const effective = offer.effective_price
  const original = offer.display_original_price
  const hasDiscount = offer.discount_percent > 0
  const outOfStock = product.stock <= 0 || !product.is_available

  return (
    <section
      ref={ref}
      className="snap-start min-h-[100svh] flex items-center py-10 relative"
    >
      <motion.div
        style={{ y, opacity }}
        className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center"
      >
        <div className={`order-1 ${imageReversed ? 'md:order-2' : 'md:order-1'}`}>
          <FloatingFrame
            src={product.image_url}
            alt={product.name}
            className="aspect-square max-w-md mx-auto"
          >
            {offer.headline && (
              <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <Zap size={12} /> {offer.headline}
              </div>
            )}
            {hasDiscount && (
              <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-20 h-20 flex items-center justify-center font-black text-2xl shadow-2xl rotate-12">
                -{offer.discount_percent}%
              </div>
            )}
          </FloatingFrame>
        </div>

        <div className={`order-2 ${imageReversed ? 'md:order-1' : 'md:order-2'}`}>
          <motion.div
            initial={{ opacity: 0, x: imageReversed ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-orange-300 font-semibold mb-3">
              Imperdible #{index + 1}
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-black leading-tight mb-4">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-4 mb-6 flex-wrap">
              {hasDiscount && (
                <span className="text-xl text-white/40 line-through decoration-2">
                  {formatCOP(original)}
                </span>
              )}
              <span className="text-4xl md:text-5xl font-black text-orange-300 drop-shadow-[0_2px_8px_rgba(234,88,12,0.4)]">
                {formatCOP(effective)}
                {isByWeight && <span className="text-base font-semibold text-white/60"> /kg</span>}
              </span>
            </div>

            {offer.ends_at && (
              <div className="mb-6 p-4 bg-black/30 backdrop-blur rounded-2xl border border-white/10 inline-block">
                <div className="text-[10px] uppercase tracking-[0.3em] text-orange-200/80 font-semibold mb-2">
                  Termina en
                </div>
                <CountdownBig endsAt={offer.ends_at} />
              </div>
            )}

            {product.stock > 0 && product.stock <= 5 && (
              <div className="mb-5 text-sm font-semibold text-yellow-300">
                ¡Quedan solo {product.stock} unidades!
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAdd}
                disabled={outOfStock}
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-full transition-colors shadow-lg shadow-orange-500/30"
              >
                <ShoppingCart size={18} />
                {outOfStock ? 'Agotado' : 'Añadir al carrito'}
              </motion.button>
              <Link
                to={product.slug ? `/producto/${product.slug}` : `/producto/${product.id}`}
                className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 hover:bg-white/5 font-semibold px-6 py-3.5 rounded-full transition-colors"
              >
                Ver producto <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default Imperdibles
