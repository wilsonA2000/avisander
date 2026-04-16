// Galería inmersiva para ProductDetail.
//
// Funciones clave:
// - Renderiza imagen principal con efecto 3D (ImageZoom3D) + botones prev/next.
// - Soporta video como una "slide" más (auto-play cuando el usuario navega a ella).
// - Thumbnails a la izquierda (desktop) o debajo (mobile).
// - Click en imagen abre un Lightbox fullscreen con zoom, pan y navegación
//   por teclado (← → Esc) y touch swipe.
// - Badges overlay (Oferta, Por peso, Agotado, etc.).

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Expand, X, Play, ZoomIn, ZoomOut } from 'lucide-react'
import ImageZoom3D from './ImageZoom3D'
import ProductImage from './ProductImage'

function ProductGallery({ product, badges = null }) {
  const images = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean)
  const hasVideo = Boolean(product.video_url)
  // Mezcla: slides pueden ser { type: 'image', src } o { type: 'video', src }
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...(hasVideo ? [{ type: 'video', src: product.video_url, poster: product.image_url }] : [])
  ]
  const [idx, setIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const current = slides[idx]

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + slides.length) % slides.length)
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="relative">
        <div className="rounded-3xl overflow-hidden bg-gray-100 aspect-square">
          <ProductImage product={product} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-4">
        {/* Thumbnails verticales (desktop) */}
        {slides.length > 1 && (
          <div className="hidden md:flex flex-col gap-2 w-20 shrink-0">
            {slides.map((s, i) => (
              <ThumbButton
                key={i}
                slide={s}
                active={i === idx}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        )}

        {/* Slide principal */}
        <div className="flex-1 relative">
          <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gray-100 aspect-square md:aspect-[4/5] max-h-[560px]">
            {current.type === 'image' ? (
              <ImageZoom3D
                src={current.src}
                alt={product.name}
                className="w-full h-full"
              />
            ) : (
              <video
                src={current.src}
                poster={current.poster}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Badges */}
            {badges && (
              <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">{badges}</div>
            )}

            {/* Expandir a lightbox (solo imagen) */}
            {current.type === 'image' && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 z-10 bg-white/85 hover:bg-white text-charcoal rounded-full w-10 h-10 flex items-center justify-center shadow-md backdrop-blur-sm transition"
                aria-label="Ver imagen a pantalla completa"
              >
                <Expand size={18} />
              </button>
            )}

            {/* Prev/Next */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow z-10"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow z-10"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Indicador índice */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-charcoal/75 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm z-10">
                {idx + 1} / {slides.length}
              </div>
            )}
          </div>

          {/* Thumbnails horizontales (mobile) */}
          {slides.length > 1 && (
            <div className="md:hidden mt-3 flex gap-2 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <ThumbButton
                  key={i}
                  slide={s}
                  active={i === idx}
                  onClick={() => setIdx(i)}
                  small
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && current.type === 'image' && (
        <Lightbox
          slides={slides}
          initialIdx={idx}
          onClose={() => setLightboxOpen(false)}
          onChangeIdx={setIdx}
          productName={product.name}
        />
      )}
    </>
  )
}

function ThumbButton({ slide, active, onClick, small = false }) {
  const size = small ? 'w-16 h-16' : 'w-20 h-20'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size} shrink-0 rounded-xl overflow-hidden border-2 transition relative ${
        active ? 'border-primary shadow-md' : 'border-transparent hover:border-gray-300 opacity-80 hover:opacity-100'
      }`}
      aria-label={slide.type === 'video' ? 'Ver video' : 'Ver imagen'}
    >
      {slide.type === 'image' ? (
        <img src={slide.src} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full relative bg-black">
          {slide.poster && <img src={slide.poster} alt="" className="w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={20} className="text-white fill-white" />
          </div>
        </div>
      )}
    </button>
  )
}

// Lightbox: modal fullscreen con zoom + pan + navegación.
function Lightbox({ slides, initialIdx, onClose, onChangeIdx, productName }) {
  const [idx, setIdx] = useState(initialIdx)
  const [zoomed, setZoomed] = useState(false)
  const imgRef = useRef(null)
  const panStart = useRef(null)

  const current = slides[idx]

  useEffect(() => {
    onChangeIdx?.(idx)
  }, [idx, onChangeIdx])

  useEffect(() => {
    // Bloquear scroll del body mientras el lightbox está abierto.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + slides.length) % slides.length)
      else if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % slides.length)
      else if (e.key === '+' || e.key === '=') setZoomed(true)
      else if (e.key === '-' || e.key === '0') setZoomed(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [slides.length, onClose])

  // Swipe mobile
  const onTouchStart = (e) => {
    if (zoomed) return
    panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e) => {
    if (zoomed || !panStart.current) return
    const dx = e.changedTouches[0].clientX - panStart.current.x
    if (Math.abs(dx) > 60) {
      if (dx < 0) setIdx((i) => (i + 1) % slides.length)
      else setIdx((i) => (i - 1 + slides.length) % slides.length)
    }
    panStart.current = null
  }

  const toggleZoom = (e) => {
    if (current.type !== 'image') return
    setZoomed((z) => !z)
    // Si activa zoom, centrar punto de origen donde clickeó
    if (!zoomed && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      imgRef.current.style.transformOrigin = `${x}% ${y}%`
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 pointer-events-none">
        <div className="text-sm font-medium truncate max-w-[60%] pointer-events-auto">{productName}</div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {current.type === 'image' && (
            <button
              onClick={() => setZoomed((z) => !z)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label={zoomed ? 'Quitar zoom' : 'Ampliar'}
            >
              {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10">
        {current.type === 'image' ? (
          <img
            ref={imgRef}
            src={current.src}
            alt={productName}
            onClick={toggleZoom}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              zoomed ? 'scale-[2] cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          />
        ) : (
          <video
            src={current.src}
            poster={current.poster}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        )}

        {/* Prev/Next */}
        {slides.length > 1 && !zoomed && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
              aria-label="Siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Contador */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {idx + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="hidden md:block absolute bottom-4 left-4 text-white/60 text-xs">
        ← → navegar · Esc cerrar · click para zoom
      </div>
    </div>
  )
}

export default ProductGallery
