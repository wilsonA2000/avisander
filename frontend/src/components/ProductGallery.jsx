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
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Expand, X, Play, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'
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
      <div className="flex gap-2 items-start">
        {/* Thumbnails verticales (desktop) — filmstrip estilo eBay, pegados a la izquierda */}
        {slides.length >= 1 && (
          <div className="hidden md:flex flex-col gap-1.5 w-[72px] shrink-0">
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

        {/* Slide principal — cuadrada, proporción equilibrada */}
        <div className="relative min-w-0 flex-1 group">
          <div
            className={`relative rounded-lg overflow-hidden bg-gray-50 aspect-square w-full max-h-[560px] transition-all duration-300 group-hover:shadow-xl group-hover:ring-1 group-hover:ring-primary/20 ${current.type === 'image' ? 'cursor-zoom-in' : ''}`}
            onClick={() => current.type === 'image' && setLightboxOpen(true)}
            role={current.type === 'image' ? 'button' : undefined}
            aria-label={current.type === 'image' ? 'Ampliar imagen' : undefined}
          >
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
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true) }}
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
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow z-10"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
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

      {/* Lightbox renderizado en portal para escapar de stacking contexts */}
      {lightboxOpen && current.type === 'image' && createPortal(
        <Lightbox
          slides={slides}
          initialIdx={idx}
          onClose={() => setLightboxOpen(false)}
          onChangeIdx={setIdx}
          productName={product.name}
        />,
        document.body
      )}
    </>
  )
}

function ThumbButton({ slide, active, onClick, small = false }) {
  const size = small ? 'w-14 h-14' : 'w-[72px] h-[72px]'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size} shrink-0 rounded-md overflow-hidden border transition relative ${
        active ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:border-gray-400'
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

// Lightbox dinámico: zoom scroll, pan drag, rotate, thumbnails, indicador zoom.
function Lightbox({ slides, initialIdx, onClose, onChangeIdx, productName }) {
  const [idx, setIdx] = useState(initialIdx)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [entering, setEntering] = useState(true)
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const panStart = useRef(null)
  const dragging = useRef(false)

  const current = slides[idx]
  const zoomed = zoom > 1

  useEffect(() => {
    onChangeIdx?.(idx)
    // Reset zoom/rotation al cambiar imagen
    setZoom(1); setRotation(0); setPan({ x: 0, y: 0 })
  }, [idx, onChangeIdx])

  useEffect(() => {
    // Animación entrada
    const t = setTimeout(() => setEntering(false), 50)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev; clearTimeout(t) }
  }, [])

  const go = (dir) => {
    setIdx((i) => (i + dir + slides.length) % slides.length)
  }

  // Teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(5, z + 0.5))
      else if (e.key === '-') setZoom((z) => Math.max(1, z - 0.5))
      else if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); setRotation(0) }
      else if (e.key === 'r' || e.key === 'R') setRotation((r) => (r + 90) % 360)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [slides.length, onClose])

  // Zoom con scroll del mouse
  const onWheel = (e) => {
    if (current.type !== 'image') return
    e.preventDefault()
    setZoom((z) => {
      const delta = e.deltaY > 0 ? -0.25 : 0.25
      const nz = Math.max(1, Math.min(5, z + delta))
      if (nz === 1) setPan({ x: 0, y: 0 })
      return nz
    })
  }

  // Pan con drag del mouse cuando hay zoom
  const onMouseDown = (e) => {
    if (!zoomed || current.type !== 'image') return
    dragging.current = true
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = (e) => {
    if (!dragging.current || !panStart.current) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }
  const onMouseUp = () => {
    dragging.current = false
    panStart.current = null
  }

  // Touch swipe mobile
  const onTouchStart = (e) => {
    if (zoomed) return
    panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e) => {
    if (zoomed || !panStart.current) return
    const dx = e.changedTouches[0].clientX - panStart.current.x
    if (Math.abs(dx) > 60) {
      if (dx < 0) go(1)
      else go(-1)
    }
    panStart.current = null
  }

  const toggleZoomClick = (e) => {
    if (current.type !== 'image' || dragging.current) return
    if (zoomed) {
      setZoom(1); setPan({ x: 0, y: 0 })
    } else {
      // zoom hacia el punto del click
      const rect = imgRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        setPan({ x: (cx - e.clientX) * 1.2, y: (cy - e.clientY) * 1.2 })
      }
      setZoom(2.5)
    }
  }

  const zoomPct = Math.round(zoom * 100)

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md select-none transition-opacity duration-300 ${entering ? 'opacity-0' : 'opacity-100'}`}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-sm font-medium truncate max-w-[40%]">
          <span className="text-white/60 uppercase text-[10px] tracking-wider block">Vista detallada</span>
          {productName}
        </div>

        {/* Toolbar centro: zoom controls, rotate, reset */}
        {current.type === 'image' && (
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/15">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              disabled={zoom <= 1}
              className="w-8 h-8 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
              aria-label="Reducir zoom"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-semibold tabular-nums min-w-[3rem] text-center">{zoomPct}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.5))}
              disabled={zoom >= 5}
              className="w-8 h-8 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
              aria-label="Aumentar zoom"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-5 bg-white/20 mx-1"></div>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
              aria-label="Rotar imagen"
              title="Rotar (R)"
            >
              <RotateCw size={15} />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setRotation(0) }}
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
              aria-label="Restablecer"
              title="Restablecer (0)"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-16">
        {current.type === 'image' ? (
          <img
            ref={imgRef}
            src={current.src}
            alt={productName}
            onClick={toggleZoomClick}
            onMouseDown={onMouseDown}
            draggable={false}
            className={`max-w-full max-h-full object-contain select-none will-change-transform ${
              zoomed ? (dragging.current ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: dragging.current ? 'none' : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
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
              onClick={() => go(-1)}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-full flex items-center justify-center backdrop-blur-md transition shadow-2xl"
              aria-label="Anterior"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-full flex items-center justify-center backdrop-blur-md transition shadow-2xl"
              aria-label="Siguiente"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {/* THUMBNAILS inferiores */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 max-w-[90vw] overflow-x-auto">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all ${
                i === idx ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-100'
              }`}
              aria-label={`Imagen ${i + 1}`}
            >
              {s.type === 'image' ? (
                <img src={s.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Play size={14} className="text-white fill-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Contador esquina inferior derecha */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-6 text-white/80 text-xs bg-white/5 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 tabular-nums">
          {idx + 1} <span className="text-white/40">/</span> {slides.length}
        </div>
      )}

      {/* Tips esquina inferior izquierda */}
      <div className="hidden md:block absolute bottom-5 left-6 text-white/50 text-[11px] leading-relaxed">
        <div className="flex items-center gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80 text-[10px]">← →</kbd> navegar</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80 text-[10px]">scroll</kbd> zoom</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80 text-[10px]">R</kbd> rotar</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80 text-[10px]">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}

export default ProductGallery
