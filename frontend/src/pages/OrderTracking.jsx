// Vista pública de tracking de pedido por payment_reference.
// Al crear una orden (WhatsApp o Bold), el cliente cae acá y ve el estado:
// pending (esperando confirmación) → processing (preparando) → completed (entregado)
// o cancelled si se cayó. Polling cada 10s porque el cambio lo dispara el admin
// manualmente y no necesita ser en tiempo real.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, Package, XCircle, MessageSquare, Truck, Store } from 'lucide-react'
import { api } from '../lib/apiClient'
import LottieIcon from '../components/LottieIcon'

const POLL_INTERVAL = 10000

function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

// Clases completas hardcoded para que Tailwind las detecte en el build.
const STATUS_META = {
  pending: {
    label: 'Pedido recibido',
    description: 'Estamos preparando la confirmación. Te contactaremos por WhatsApp para coordinar el pago y la entrega.',
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-500',
    Icon: Clock
  },
  processing: {
    label: 'En preparación',
    description: 'Tu pedido ya fue confirmado y lo estamos alistando.',
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-500',
    Icon: Package
  },
  shipped: {
    label: 'Pedido en camino',
    description: 'Tu pedido va en camino. ¡Pronto llegará a tu puerta!',
    border: 'border-violet-400',
    bg: 'bg-violet-50',
    text: 'text-violet-500',
    Icon: Truck
  },
  completed: {
    label: 'Pedido entregado',
    description: '¡Listo! Gracias por comprar con Avisander.',
    border: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-500',
    Icon: CheckCircle2
  },
  cancelled: {
    label: 'Pedido cancelado',
    description: 'Este pedido fue cancelado. Si crees que es un error, contáctanos por WhatsApp.',
    border: 'border-red-400',
    bg: 'bg-red-50',
    text: 'text-red-500',
    Icon: XCircle
  }
}

function OrderTracking() {
  const { reference } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId

    const fetchOrder = async () => {
      try {
        const data = await api.get(`/api/orders/public/${reference}`, { skipAuth: true })
        if (cancelled) return
        setOrder(data)
        setLoading(false)

        // Dejar de pollear si el pedido llegó a un estado final.
        if (!['completed', 'cancelled'].includes(data.status)) {
          timeoutId = setTimeout(fetchOrder, POLL_INTERVAL)
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'No pudimos cargar el pedido.')
        setLoading(false)
      }
    }

    fetchOrder()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [reference])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-gray-500">Cargando tu pedido…</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <XCircle className="mx-auto text-red-400 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">No encontramos este pedido</h1>
        <p className="text-gray-600 mb-6">{error || 'La referencia puede ser incorrecta.'}</p>
        <Link to="/productos" className="btn-primary">Volver al catálogo</Link>
      </div>
    )
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending
  const { Icon } = meta
  const isDelivery = order.delivery_method === 'delivery'

  // Para estados clave, usamos Lottie animado en vez del lucide estático.
  const lottieByStatus = {
    shipped:   { name: 'delivery-truck', loop: true,  fallback: 'delivery' },
    completed: { name: 'success',        loop: false, fallback: 'check' }
  }
  const lottie = lottieByStatus[order.status]

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${meta.border} overflow-hidden`}>
        <div className="p-8 text-center">
          {lottie ? (
            <div className="mx-auto mb-4 flex justify-center">
              <LottieIcon name={lottie.name} size="xl" loop={lottie.loop} autoplay fallbackIcon={lottie.fallback} />
            </div>
          ) : (
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${meta.bg} mb-4`}>
              <Icon className={meta.text} size={44} />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            {order.status === 'pending' ? '¡Pedido realizado con éxito!' : meta.label}
          </h1>
          <p className="text-lg font-mono text-primary font-bold mt-1">Pedido #{order.id}</p>
          <p className="text-gray-600 mt-3 leading-relaxed">{meta.description}</p>
        </div>

        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <h2 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Detalle</h2>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {it.product_name}
                  {it.sale_type === 'by_weight'
                    ? ` · ${it.weight_grams} g`
                    : ` · ${it.quantity} und`}
                </span>
                <span className="font-medium text-gray-800">{fmtCOP(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-3 space-y-1 text-sm">
            {order.delivery_cost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Domicilio</span>
                <span>{fmtCOP(order.delivery_cost)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1">
              <span>Total</span>
              <span className="text-primary">{fmtCOP(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 flex items-center gap-3 text-sm text-gray-600">
          {isDelivery ? <Truck size={18} /> : <Store size={18} />}
          <span>{isDelivery ? 'Entrega a domicilio' : 'Recoge en tienda'}</span>
          <span className="ml-auto text-gray-400">
            Método: {order.payment_method === 'bold' ? 'Pago online' : 'WhatsApp'}
          </span>
        </div>

        {order.status === 'pending' && (
          <div className="border-t border-gray-100 p-6 bg-amber-50">
            <div className="flex items-start gap-3">
              <MessageSquare className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">¿Qué sigue?</p>
                <p>
                  Esta página se actualiza sola. Puedes cerrarla cuando quieras; al recibir tu WhatsApp,
                  confirmamos stock, método de pago y entrega.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/productos" className="text-primary hover:underline text-sm">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  )
}

export default OrderTracking
