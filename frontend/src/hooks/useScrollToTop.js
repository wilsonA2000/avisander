import { useEffect } from 'react'

// Al montar: scroll al top y opcionalmente pone foco en el primer input relevante.
// Útil para páginas de auth donde el viewport puede quedar anclado al hero superior.
export default function useScrollToTop(focusSelector) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (focusSelector) {
      const el = document.querySelector(focusSelector)
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [focusSelector])
}
