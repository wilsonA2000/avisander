import { useEffect, useRef, useState } from 'react'

const baseUrl = import.meta.env.VITE_API_URL || ''

// Se conecta al SSE /api/events/admin con cookies httpOnly (withCredentials).
// Si se cae el socket, EventSource reconecta solo. Si 401 tras idle largo,
// recargamos tras un pequeño back-off para que el apiClient refresque el token.
export function useAdminEvents({ onEvent, types } = {}) {
  const [connected, setConnected] = useState(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let es
    let retry = 0
    let closed = false

    function open() {
      es = new EventSource(`${baseUrl}/api/events/admin`, { withCredentials: true })
      es.addEventListener('ready', () => {
        retry = 0
        setConnected(true)
      })
      const listen = (type) => {
        es.addEventListener(type, (e) => {
          try {
            const evt = JSON.parse(e.data)
            onEventRef.current?.(evt)
          } catch (_err) {}
        })
      }
      const list = types && types.length
        ? types
        : ['order.created', 'payment.confirmed', 'stock.low']
      list.forEach(listen)

      es.onerror = () => {
        setConnected(false)
        if (closed) return
        es.close()
        retry = Math.min(retry + 1, 5)
        setTimeout(open, 1000 * retry)
      }
    }

    open()
    return () => {
      closed = true
      es?.close()
    }
  }, [types?.join(',')])

  return { connected }
}
