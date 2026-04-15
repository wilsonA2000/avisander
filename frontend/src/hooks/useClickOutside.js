import { useEffect } from 'react'

// Llama `handler` cuando se hace click fuera del ref o se presiona Esc.
// Útil para cerrar dropdowns, modales y menús desplegables.
export default function useClickOutside(ref, handler, { enabled = true, ignoreEsc = false } = {}) {
  useEffect(() => {
    if (!enabled) return
    const onClick = (e) => {
      if (!ref.current) return
      if (ref.current.contains(e.target)) return
      handler(e)
    }
    const onKey = (e) => {
      if (!ignoreEsc && e.key === 'Escape') handler(e)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, handler, enabled, ignoreEsc])
}
