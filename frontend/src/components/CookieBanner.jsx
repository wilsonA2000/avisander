import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'avisander:cookies_accepted'

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted) {
        const t = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(t)
      }
    } catch { /* noop */ }
  }, [])

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted_at: Date.now(), version: 1 })) } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-40 bg-white rounded-2xl shadow-2xl border border-amber-100 p-4 animate-[fadeInUp_0.4s_ease-out]"
      style={{ animation: 'fadeInUp 0.4s ease-out' }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
          <Cookie size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-charcoal text-sm">Usamos cookies</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Utilizamos cookies esenciales para mantener tu sesión, tu carrito y
            mejorar tu experiencia en la tienda. No compartimos tu información
            con terceros. Al continuar aceptas nuestra{' '}
            <Link to="/politica-privacidad" className="text-primary underline hover:no-underline">
              política de privacidad
            </Link>{' '}
            y los{' '}
            <Link to="/terminos-y-condiciones" className="text-primary underline hover:no-underline">
              términos
            </Link>.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={accept}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={accept}
          aria-label="Cerrar"
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default CookieBanner
