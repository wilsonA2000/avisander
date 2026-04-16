// Pop-up de bienvenida en el Home. Se muestra si:
//   1. El admin lo ha activado (settings.promo_modal_enabled === '1').
//   2. El navegador no tiene la cookie `avisander_welcome_seen` (vence en 24h).

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

const COOKIE_NAME = 'avisander_welcome_seen'
const COOKIE_TTL_HOURS = 24

function getCookie(name) {
  if (typeof document === 'undefined') return null
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
}

function setCookie(name, value, hours) {
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function WelcomeModal() {
  const { settings } = useSettings()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (pathname !== '/') return
    const enabled = settings.promo_modal_enabled === '1' || settings.promo_modal_enabled === 'true'
    if (!enabled) return
    if (getCookie(COOKIE_NAME)) return
    const t = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(t)
  }, [pathname, settings.promo_modal_enabled])

  const dismiss = () => {
    setCookie(COOKIE_NAME, '1', COOKIE_TTL_HOURS)
    setOpen(false)
  }

  if (!open) return null

  const image = settings.promo_modal_image || ''
  const title = settings.promo_modal_title || '¡Bienvenido a Avisander!'
  const subtitle = settings.promo_modal_subtitle || 'Carnes premium con domicilio en Bucaramanga.'
  const ctaLabel = settings.promo_modal_cta_label || 'Ver catálogo'
  const ctaLink = settings.promo_modal_cta_link || '/productos'
  const isExternal = ctaLink.startsWith('http')
  const mode = settings.promo_modal_mode || 'generic'
  const productId = settings.promo_modal_product_id
  // Modo 'product': popup minimal con sólo la imagen clickeable que lleva al producto.
  const isProductMode = mode === 'product' && productId && image

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[90vh] my-auto"
          >
            <button
              onClick={dismiss}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-charcoal flex items-center justify-center shadow-md backdrop-blur"
            >
              <X size={16} />
            </button>

            {isProductMode ? (
              // Modo promo de producto: SOLO imagen clickeable. Al click se cierra
              // el popup y navega a /producto/:id.
              <Link
                to={`/producto/${productId}`}
                onClick={dismiss}
                className="block group"
                aria-label="Ver producto en promoción"
              >
                <div className="overflow-hidden">
                  <img
                    src={image}
                    alt="Promoción especial"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </Link>
            ) : (
              <>
                {image && (
                  <div className="bg-cream flex items-center justify-center p-2">
                    <img src={image} alt={title} className="w-full h-auto max-h-[360px] object-contain" />
                  </div>
                )}

                <div className="p-7">
                  <h2 className="font-display text-3xl font-bold text-charcoal mb-2 leading-tight">
                    {title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-5">{subtitle}</p>

                  <div className="flex gap-2">
                    {isExternal ? (
                      <a
                        href={ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={dismiss}
                        className="btn-primary inline-flex items-center gap-2 flex-1 justify-center"
                      >
                        {ctaLabel}
                        <ArrowRight size={16} />
                      </a>
                    ) : (
                      <Link
                        to={ctaLink}
                        onClick={dismiss}
                        className="btn-primary inline-flex items-center gap-2 flex-1 justify-center"
                      >
                        {ctaLabel}
                        <ArrowRight size={16} />
                      </Link>
                    )}
                    <button onClick={dismiss} className="px-4 text-sm text-gray-500 hover:text-charcoal">
                      Más tarde
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default WelcomeModal
