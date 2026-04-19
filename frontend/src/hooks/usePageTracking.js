import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SID_KEY = 'avisander:analytics_sid'

function getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY)
    if (!sid) {
      sid = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

// Respeta preferencias del usuario (DNT) y omite rutas privadas (/admin, /api).
// El backend además descarta al admin autenticado y marca bots como is_bot=1.
export function usePageTracking() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!pathname) return
    const dnt = navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.doNotTrack === '1'
    if (dnt) return
    if (pathname.startsWith('/admin')) return

    const sid = getOrCreateSessionId()
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        session_id: sid,
        path: pathname,
        referrer: document.referrer || null
      }),
      keepalive: true
    }).catch(() => { /* silencio: el tracking nunca rompe la navegación */ })
  }, [pathname])
}
