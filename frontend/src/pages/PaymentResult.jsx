// Página de resultado de pago Wompi.
// Hacemos polling cada 3s hasta ver un estado final (approved/declined/voided/error).

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { api } from '../lib/apiClient'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

const POLL_INTERVAL = 3000
const MAX_ATTEMPTS = 40 // 2 min max

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

function PaymentResult() {
  const { reference } = useParams()
  const { clearCart } = useCart()
  const toast = useToast()
  const [state, setState] = useState({ loading: true, status: 'pending', order_id: null, total: 0 })
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timeoutId

    const poll = async () => {
      if (cancelled) return
      try {
        const r = await api.get(`/api/payments/transaction/${reference}`, { skipAuth: true })
        if (cancelled) return
        setState({ loading: false, ...r })

        // Estado final: no seguimos pollendo
        if (['approved', 'declined', 'voided', 'error'].includes(r.status)) {
          if (r.status === 'approved') {
            clearCart()
            toast.success('¡Pago aprobado!')
          }
          return
        }

        setAttempts((n) => n + 1)
        if (attempts < MAX_ATTEMPTS) {
          timeoutId = setTimeout(poll, POLL_INTERVAL)
        }
      } catch (err) {
        if (!cancelled) setState({ loading: false, status: 'error', error: err.message })
      }
    }
    poll()
    return () => { cancelled = true; clearTimeout(timeoutId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  const statusView = {
    approved: {
      icon: <CheckCircle2 size={80} className="text-green-500" />,
      title: '¡Pago aprobado!',
      msg: 'Tu pedido fue confirmado. Te contactamos por WhatsApp para coordinar la entrega.',
      color: 'text-green-700'
    },
    declined: {
      icon: <XCircle size={80} className="text-red-500" />,
      title: 'Pago rechazado',
      msg: 'La pasarela rechazó el pago. Puedes intentar con otro método o contactarnos por WhatsApp.',
      color: 'text-red-700'
    },
    voided: {
      icon: <XCircle size={80} className="text-gray-500" />,
      title: 'Pago cancelado',
      msg: 'La transacción fue cancelada.',
      color: 'text-gray-700'
    },
    error: {
      icon: <XCircle size={80} className="text-amber-500" />,
      title: 'Error en el pago',
      msg: 'Ocurrió un problema con el pago. Contáctanos por WhatsApp para ayudarte.',
      color: 'text-amber-700'
    },
    pending: {
      icon: <Loader2 size={80} className="text-primary animate-spin" />,
      title: 'Verificando pago…',
      msg: 'Esto puede tardar unos segundos. No cierres esta ventana.',
      color: 'text-primary'
    }
  }

  const view = statusView[state.status] || statusView.pending
  const showTimeout = attempts >= MAX_ATTEMPTS && state.status === 'pending'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">{view.icon}</div>
        <h1 className={`text-2xl font-bold mb-3 ${view.color}`}>{view.title}</h1>
        <p className="text-gray-600 mb-6">{showTimeout ? 'Aún no confirmamos el estado. Revisa tu correo o escríbenos por WhatsApp.' : view.msg}</p>

        {state.order_id && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-gray-500">Pedido</p>
            <p className="font-semibold">#{state.order_id}</p>
            <p className="text-xs text-gray-500 mt-2">Referencia</p>
            <p className="font-mono text-xs text-gray-700 break-all">{reference}</p>
            {state.total > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-2">Total</p>
                <p className="font-semibold text-primary">{fmtCOP(state.total)}</p>
              </>
            )}
          </div>
        )}

        {state.status === 'pending' && !showTimeout && (
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Clock size={12} /> Reintento automático cada 3 segundos…
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {state.status === 'approved' ? (
            <Link to="/productos" className="btn-primary">Seguir comprando</Link>
          ) : (
            <>
              <Link to="/carrito" className="btn-primary">Volver al carrito</Link>
              <Link to="/" className="text-sm text-gray-500 hover:text-primary">Ir al inicio</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
