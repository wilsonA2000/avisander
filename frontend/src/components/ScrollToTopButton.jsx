import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

// Botón flotante que aparece al scrollear hacia abajo y vuelve al top con animación.
// Oculto en /admin para no chocar con la UI del panel.
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname.startsWith('/admin')) return null

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Subir al inicio"
      className={`fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-charcoal/90 hover:bg-charcoal text-white shadow-lg backdrop-blur-md border border-white/10
                  flex items-center justify-center transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  )
}

export default ScrollToTopButton
