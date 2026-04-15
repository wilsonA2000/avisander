import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 1. En refresh/load inicial: deshabilita el "scroll restoration" del navegador
//    para que no quede a media página tras F5.
// 2. En cambio de ruta SPA: sube al top instantáneo (sin smooth para que no se sienta lento).
function ScrollRestorer() {
  const { pathname } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    // En el primer mount también garantizamos top.
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollRestorer
