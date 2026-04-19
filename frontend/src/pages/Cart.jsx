import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, MessageSquare, Banknote, CheckCircle2, Loader2, Copy, Check, QrCode, ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useSettings, whatsappLink } from '../context/SettingsContext'
import { api } from '../lib/apiClient'
import DeliveryPicker from '../components/DeliveryPicker'
import ProductImage from '../components/ProductImage'
import LottieIcon from '../components/LottieIcon'
import Icon3D from '../components/Icon3D'

function fmt(n) {
  return `$${Number(n || 0).toLocaleString('es-CO')}`
}

// Mensaje WhatsApp para pago manual (transferencia directa). Aún no está
// confirmado — la cajera valida al recibir la captura. Incluye detalle
// completo para que la cajera pueda conciliar sin volver a preguntar datos.
function buildManualPaymentWhatsAppMessage(order, methodLabel) {
  const sep = '---------------------------'
  const now = new Date()
  const fecha = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  let msg = ''
  msg += `💳 *PAGO POR TRANSFERENCIA - AVISANDER*\n`
  msg += `${sep}\n`
  msg += `*Pedido N°:* #${order.id}\n`
  if (order.payment_reference) msg += `*Ref:* ${order.payment_reference}\n`
  msg += `*Método:* ${methodLabel}\n`
  msg += `*Fecha:* ${fecha}  ${hora}\n`
  msg += `${sep}\n\n`
  msg += `*PRODUCTOS*\n`
  ;(order.items || []).forEach((it, i) => {
    const num = String(i + 1).padStart(2, '0')
    msg += `*${num}. ${it.product_name}*\n`
    if (it.sale_type === 'by_weight') {
      msg += `   Peso: ${it.weight_grams} g\n`
    } else {
      msg += `   Cantidad: ${it.quantity} und\n`
    }
    msg += `   Subtotal: ${fmt(it.subtotal)}\n`
    if (it.notes) msg += `   Nota: _${it.notes}_\n`
  })
  msg += `\n${sep}\n`
  if (order.discount_amount > 0) {
    msg += `Descuento: −${fmt(order.discount_amount)}`
    if (order.discount_reason) msg += ` (${order.discount_reason})`
    msg += `\n`
  }
  if (order.delivery_cost > 0) msg += `Domicilio: ${fmt(order.delivery_cost)}\n`
  msg += `*TOTAL A PAGAR:* *${fmt(order.total)}*\n`
  msg += `${sep}\n\n`
  if (order.customer_name) msg += `*Cliente:* ${order.customer_name}\n`
  if (order.customer_phone) msg += `*Teléfono:* ${order.customer_phone}\n`
  if (order.delivery_method === 'pickup') {
    msg += `*Entrega:* Recoge en tienda\n`
  } else {
    msg += `*Entrega:* Domicilio\n`
    if (order.customer_address) msg += `*Dirección:* ${order.customer_address}\n`
  }
  msg += `\n📎 Adjunto el comprobante (PDF o captura).\n`
  msg += `_Esperando validación del equipo Avisander._`
  return msg
}

// Arma el mensaje WhatsApp que el cliente envía al comercio tras un pago Bold
// aprobado. Usamos sólo emojis simples (✅ y separadores) para máxima
// compatibilidad; el texto en MAYÚSCULAS y *negrita* hace el trabajo visual.
function buildPaidWhatsAppMessage(order) {
  const sep = '---------------------------'
  const now = new Date()
  const fecha = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  let msg = ''
  msg += `✅ *PEDIDO PAGADO - AVISANDER*\n`
  msg += `${sep}\n`
  msg += `*Pedido N°:* #${order.id}\n`
  msg += `*Estado:* PAGADO CON BOLD\n`
  if (order.payment_reference) msg += `*Ref:* ${order.payment_reference}\n`
  if (order.payment_transaction_id) msg += `*Tx Bold:* ${order.payment_transaction_id}\n`
  msg += `*Fecha:* ${fecha}  ${hora}\n`
  msg += `${sep}\n\n`
  msg += `*PRODUCTOS*\n`
  order.items.forEach((it, i) => {
    const num = String(i + 1).padStart(2, '0')
    msg += `*${num}. ${it.product_name}*\n`
    if (it.sale_type === 'by_weight') {
      msg += `   Peso: ${it.weight_grams} g\n`
    } else {
      msg += `   Cantidad: ${it.quantity} und\n`
    }
    msg += `   Subtotal: ${fmt(it.subtotal)}\n`
    if (it.notes) msg += `   Nota: _${it.notes}_\n`
  })
  msg += `\n${sep}\n`
  if (order.discount_amount > 0) {
    msg += `Descuento: −${fmt(order.discount_amount)}`
    if (order.discount_reason) msg += ` (${order.discount_reason})`
    msg += `\n`
  }
  if (order.delivery_cost > 0) msg += `Domicilio: ${fmt(order.delivery_cost)}\n`
  msg += `*TOTAL PAGADO:* *${fmt(order.total)}*\n`
  msg += `${sep}\n\n`
  if (order.customer_name) msg += `*Cliente:* ${order.customer_name}\n`
  if (order.delivery_method === 'pickup') {
    msg += `*Entrega:* Recoge en tienda\n`
  } else {
    msg += `*Entrega:* Domicilio\n`
  }
  msg += `\n¡Gracias por tu compra!\n`
  msg += `_El producto ya fue descontado del inventario. Coordinamos el despacho._`
  return msg
}

function Cart() {
  const {
    items,
    updateLine,
    removeLine,
    clearCart,
    subtotal,
    getWhatsAppUrl,
    toOrderItems,
    lineTotal
  } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const { settings } = useSettings()
  const [submitting, setSubmitting] = useState(false)
  const [openNotesId, setOpenNotesId] = useState(null)

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estado de entrega manejado por DeliveryPicker
  const [delivery, setDelivery] = useState({
    method: 'delivery',
    cost: 0,
    in_coverage: false
  })

  // Método de pago: 'whatsapp' (default) | 'bold'
  // Pago contra entrega ('cash') eliminado: Wilson NO despacha sin pago previo.
  const [paymentMethod, setPaymentMethod] = useState('whatsapp')
  const [boldConfig, setBoldConfig] = useState({ enabled: false, identity_key: null, widget_url: null })
  // Preview del descuento que calculará el backend para este cliente + subtotal.
  // Autoritativo: el backend recalcula al crear la orden, aquí sólo mostramos.
  const [discountPreview, setDiscountPreview] = useState({
    authenticated: false, amount: 0, percent: 0, reason: null
  })
  const [loyaltyInfo, setLoyaltyInfo] = useState({ balance: 0, enabled: false, point_value: 1, redeem_min: 1000 })
  const [redeemPoints, setRedeemPoints] = useState(0)

  // Datos de contacto del cliente. Si está autenticado, pre-llenamos con su perfil.
  const [contact, setContact] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  })
  // Re-sync si el user se hidrata después (AuthContext carga async).
  useEffect(() => {
    setContact((prev) => ({
      name: prev.name || user?.name || '',
      phone: prev.phone || user?.phone || ''
    }))
  }, [user?.id, user?.name, user?.phone])

  // Si hay productos por peso, fuerza WhatsApp: el peso real puede diferir del solicitado
  // y eso causaría descuadre con un cobro online ya autorizado.
  const hasByWeight = useMemo(
    () => items.some((it) => it.sale_type === 'by_weight'),
    [items]
  )

  // Forzar paymentMethod=whatsapp si el carrito contiene productos por peso.
  useEffect(() => {
    if (hasByWeight && paymentMethod !== 'whatsapp') {
      setPaymentMethod('whatsapp')
    }
  }, [hasByWeight, paymentMethod])

  useEffect(() => {
    // Saber si Bold está habilitado (llaves configuradas en backend)
    api.get('/api/payments/config', { skipAuth: true })
      .then((c) => setBoldConfig({
        enabled: !!c.bold_enabled,
        identity_key: c.bold_identity_key,
        widget_url: c.bold_widget_url
      }))
      .catch(() => setBoldConfig({ enabled: false, identity_key: null, widget_url: null }))
  }, [])

  const deliveryCost = delivery.method === 'pickup' ? 0 : Number(delivery.cost) || 0
  // Refrescar preview de descuento cuando cambia el subtotal o el user.
  useEffect(() => {
    if (items.length === 0 || subtotal <= 0) {
      setDiscountPreview({ authenticated: Boolean(user?.id), amount: 0, percent: 0, reason: null })
      return
    }
    let cancelled = false
    api.get(`/api/orders/discount-preview?subtotal=${subtotal}`)
      .then((r) => { if (!cancelled) setDiscountPreview(r) })
      .catch(() => { /* noop */ })
    return () => { cancelled = true }
  }, [subtotal, items.length, user?.id])

  useEffect(() => {
    if (!user?.id) { setLoyaltyInfo({ balance: 0, enabled: false, point_value: 1 }); return }
    api.get('/api/loyalty/balance')
      .then((r) => setLoyaltyInfo(r))
      .catch(() => {})
  }, [user?.id])

  const discountAmount = discountPreview.amount || 0
  const loyaltyDiscount = redeemPoints * (loyaltyInfo.point_value || 1)
  const total = Math.max(0, subtotal - discountAmount - loyaltyDiscount) + (items.length > 0 ? deliveryCost : 0)

  // Teléfono colombiano simple: 10 dígitos (celular) o 7 dígitos (fijo).
  const phoneDigits = (contact.phone || '').replace(/\D/g, '')
  const contactValid = contact.name.trim().length >= 2 && (phoneDigits.length === 10 || phoneDigits.length === 7)

  const canCheckout = useMemo(() => {
    if (items.length === 0) return false
    if (!contactValid) return false
    if (delivery.method === 'pickup') return true
    return !!delivery.in_coverage
  }, [items.length, delivery])

  /**
   * Lanza el botón de pago Bold.
   * El patrón de Bold no usa `new Widget()` — es un <script data-bold-button> con
   * atributos que renderiza un botón. Para activarlo programáticamente:
   *   1. Creamos un container en el DOM.
   *   2. Inyectamos el <script> con los data-bold-* dentro del container.
   *   3. El script de Bold observa el container y renderiza un botón.
   *   4. Esperamos a que el botón aparezca y hacemos click().
   */
  // Muestra el botón Bold dentro de un modal overlay VISIBLE para que el cliente
  // lo pulse explícitamente. El SDK de Bold valida el contexto del contenedor y
  // no renderiza botón en divs fuera de viewport (por eso el "click programático"
  // fallaba con timeout a 8s).
  const [boldPayload, setBoldPayload] = useState(null)
  // Estado "pagado": cuando el webhook confirme approved, renderizamos en el
  // carrito una vista de éxito con botón para enviar el comprobante por WhatsApp.
  const [paidOrder, setPaidOrder] = useState(null)
  // Estado "validando": modal bloqueante con Lottie mientras se confirma el pago.
  // Nequi/PSE pueden tardar hasta varios minutos en dispararnos el webhook; el
  // cliente nunca debe quedar en el carrito sin feedback.
  const [validating, setValidating] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null) // orden pending cacheada para el modal
  const [validationElapsed, setValidationElapsed] = useState(0) // segundos transcurridos
  // Estado "manualOrder": orden creada con payment_method='manual'. Muestra la
  // vista inmersiva con QRs y llaves para que el cliente pague por fuera de
  // Bold y luego envíe comprobante por WhatsApp (sin comisión de pasarela).
  const [manualOrder, setManualOrder] = useState(null)
  const [manualTab, setManualTab] = useState('breb') // 'breb' | 'nequi' | 'bancolombia'
  const [manualSent, setManualSent] = useState(false) // cliente ya hizo click en WhatsApp
  const [copiedKey, setCopiedKey] = useState(null) // flag temporal para feedback copiar
  const copyToClipboard = async (value, id) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(id)
      setTimeout(() => setCopiedKey((k) => (k === id ? null : k)), 1500)
    } catch (_e) {
      toast.error('No pudimos copiar. Selecciona manualmente.')
    }
  }

  const launchBoldCheckout = (payload) => {
    // Persistimos la referencia de la orden Bold lanzada para que, si el cliente
    // vuelve al carrito sin los query params que Bold debería añadir, aún podamos
    // consultar el estado de esa orden y mostrar la vista de éxito.
    try {
      localStorage.setItem('avisander:pending_bold_order', JSON.stringify({
        reference: payload.order_id,
        launched_at: Date.now()
      }))
    } catch (_e) { /* noop */ }
    setBoldPayload(payload)
    return Promise.resolve(true)
  }

  // Al volver desde Bold: detectamos la referencia por 3 vías en orden de fiabilidad:
  //   1) Query params ?bold-order-id=X&bold-tx-status=Y (Bold los añade a veces)
  //   2) localStorage 'avisander:pending_bold_order' (persistido al lanzar)
  // Consultamos el backend con polling hasta 20s para dar tiempo al webhook.
  useEffect(() => {
    const queryOrderId = searchParams.get('bold-order-id')
    const queryStatus = searchParams.get('bold-tx-status')

    let pendingRef = queryOrderId
    let launchedAt = null
    if (!pendingRef) {
      try {
        const stored = JSON.parse(localStorage.getItem('avisander:pending_bold_order') || 'null')
        if (stored && stored.reference && (Date.now() - stored.launched_at) < 30 * 60 * 1000) {
          pendingRef = stored.reference
          launchedAt = stored.launched_at
        }
      } catch (_e) { /* noop */ }
    }
    if (!pendingRef) return

    // Limpiar query params de Bold si vinieron.
    if (queryOrderId) {
      const next = new URLSearchParams(searchParams)
      next.delete('bold-order-id')
      next.delete('bold-tx-status')
      setSearchParams(next, { replace: true })
    }

    if (queryStatus === 'rejected') {
      toast.error('El pago fue rechazado. Intenta de nuevo o usa WhatsApp.')
      try { localStorage.removeItem('avisander:pending_bold_order') } catch (_e) {}
      return
    }

    // Polling progresivo con reconciliación activa contra la API de Bold.
    // Si el webhook no llega (común en sandbox o con Nequi/PSE lentos),
    // /reconcile consulta a Bold directamente y actualiza la orden en nuestra BD.
    // 5 min = 150 intentos * 2s — cubre demoras reales de Nequi (vimos 5 min en prod).
    setValidating(true)
    let cancelled = false
    let attempts = 0
    const maxAttempts = 150
    const startedAt = Date.now()
    const elapsedTimer = setInterval(() => {
      setValidationElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    const check = async () => {
      if (cancelled) return
      attempts++
      try {
        // 1) Intentar reconciliar contra Bold (fuerza sync con la verdad oficial).
        try {
          await api.post(`/api/payments/reconcile/${pendingRef}`, {}, { skipAuth: true })
        } catch (_e) { /* noop, seguimos con el GET */ }

        // 2) Leer el estado actualizado de nuestra BD.
        const order = await api.get(`/api/orders/public/${pendingRef}`, { skipAuth: true })
        if (cancelled) return
        setPendingOrder(order)
        if (order.payment_status === 'approved') {
          setPaidOrder(order)
          setValidating(false)
          clearCart()
          try { localStorage.removeItem('avisander:pending_bold_order') } catch (_e) {}
          return
        }
        if (['declined', 'voided', 'error', 'rejected'].includes(order.payment_status)) {
          setValidating(false)
          toast.error('El pago no se completó. Puedes intentar de nuevo o usar WhatsApp.')
          try { localStorage.removeItem('avisander:pending_bold_order') } catch (_e) {}
          return
        }
        if (attempts < maxAttempts) {
          setTimeout(check, 2000)
        } else {
          setValidating(false)
          toast.info('Tu pago sigue en validación. Te avisamos por WhatsApp cuando Bold confirme.')
        }
      } catch (_e) {
        if (attempts < maxAttempts) setTimeout(check, 2000)
        else setValidating(false)
      }
    }
    check()
    return () => {
      cancelled = true
      clearInterval(elapsedTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling del estado del pedido Bold mientras el modal está activo.
  // Cada 3s consultamos /api/orders/public/:reference; si vemos approved,
  // cerramos el modal y mostramos la vista "Pago aprobado".
  useEffect(() => {
    if (!boldPayload?.order_id) return
    let cancelled = false
    let timeoutId

    const poll = async () => {
      if (cancelled) return
      try {
        const order = await api.get(
          `/api/orders/public/${boldPayload.order_id}`,
          { skipAuth: true }
        )
        if (cancelled) return
        if (order.payment_status === 'approved') {
          setPaidOrder(order)
          setBoldPayload(null) // cerrar modal Bold
          clearCart()
          return
        }
        if (['declined', 'voided', 'error'].includes(order.payment_status)) {
          toast.error('El pago no se completó. Puedes intentar de nuevo o usar WhatsApp.')
          setBoldPayload(null)
          return
        }
      } catch (_e) { /* ignoramos, reintentamos */ }
      timeoutId = setTimeout(poll, 3000)
    }

    timeoutId = setTimeout(poll, 3000)
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boldPayload?.order_id])

  // Monta el script + data-attrs de Bold cuando el modal se abre.
  // Orden crítico:
  //   1) Insertar <script data-bold-button> PRIMERO con todos los data-attrs.
  //   2) Cargar (o recargar) boldPaymentButton.js DESPUÉS para forzar escaneo del DOM.
  // El SDK público de Bold no expone un método de re-scan, así que re-inyectamos
  // la librería fresca cada vez que abrimos el modal. Esto garantiza que encuentre
  // el <script data-bold-button> y renderice el botón del pago.
  useEffect(() => {
    if (!boldPayload) return
    const container = document.getElementById('bold-btn-target')
    if (!container) return
    container.innerHTML = ''

    // Paso 1: insertar tag data-bold-button.
    const script = document.createElement('script')
    script.setAttribute('data-bold-button', 'dark-L')
    script.setAttribute('data-api-key', boldPayload.identity_key)
    script.setAttribute('data-order-id', boldPayload.order_id)
    script.setAttribute('data-amount', String(boldPayload.amount))
    script.setAttribute('data-currency', boldPayload.currency)
    script.setAttribute('data-integrity-signature', boldPayload.signature)
    script.setAttribute('data-description', boldPayload.description || 'Pedido Avisander')
    // Modo redirect (top-level): Bold abre checkout.bold.co como navegación top-level
    // y al finalizar redirige a data-redirection-url. Evita el bloqueo de embed
    // que Bold producción impone contra orígenes no whitelisted (ngrok).
    // Para volver a embedded, descomentar la línea siguiente y registrar el
    // dominio en el panel Bold.
    // script.setAttribute('data-render-mode', 'embedded')
    // Redirección sólo se usa si el cliente pulsa "Volver a la tienda" dentro
    // del modal Bold. Apuntamos al propio carrito para que aterrice en nuestro
    // dominio y el polling detecte el pago aprobado.
    const publicOrigin = import.meta.env.VITE_PUBLIC_URL || window.location.origin
    // ngrok-skip-browser-warning hace que ngrok no muestre su pantalla intersticial
    // al volver al dominio (sólo relevante en dev con ngrok free; en producción
    // con dominio propio este param es inofensivo).
    script.setAttribute(
      'data-redirection-url',
      `${publicOrigin}/carrito?ngrok-skip-browser-warning=1`
    )
    container.appendChild(script)

    // Paso 2: remover lib anterior (si había) y cargar una nueva.
    document.querySelectorAll('script[data-avisander-bold-lib]').forEach((n) => n.remove())
    const lib = document.createElement('script')
    lib.src = boldPayload.widget_url
    lib.async = true
    lib.setAttribute('data-avisander-bold-lib', '1')
    lib.onerror = () => {
      toast.error('No se pudo cargar la pasarela de pago Bold. Intenta WhatsApp o recarga la página.')
    }
    document.body.appendChild(lib)
  }, [boldPayload?.order_id])

  const closeBoldModal = () => setBoldPayload(null)

  const handleSubmitOrder = async () => {
    if (!canCheckout) {
      toast.error('Completa los datos de entrega antes de continuar.')
      return
    }
    setSubmitting(true)
    const customer = {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      address: delivery.method === 'delivery' ? delivery.address : 'Recoge en tienda'
    }
    let res
    try {
      res = await api.post('/api/orders', {
        items: toOrderItems(),
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        delivery_method: delivery.method,
        delivery_lat: delivery.lat,
        delivery_lng: delivery.lng,
        delivery_city: delivery.city,
        payment_method: paymentMethod,
        redeem_points: redeemPoints || 0
      })
    } catch (err) {
      // No abrimos WhatsApp ni limpiamos el carrito si la orden no se creó:
      // el cliente debe corregir (stock insuficiente, dirección fuera de cobertura, etc.).
      toast.error(err.message || 'No pudimos guardar tu pedido. Revisa stock o vuelve a intentar.')
      setSubmitting(false)
      return
    }

    try {
      if (paymentMethod === 'manual') {
        // Pago manual: orden creada, stock reservado. Mostramos la vista con
        // QRs y llaves. NO vaciamos el carrito aún: si el cliente cambia de
        // método, mantiene sus productos. Solo limpiamos cuando envíe el
        // comprobante por WhatsApp (ahí asumimos que sí pagó).
        // La orden pending expira sola en 15 min si el cliente abandona
        // (scheduler en backend/lib/stockReservation.js).
        setManualOrder(res)
        toast.success(`¡Pedido #${res.id} reservado! Sigue las instrucciones para pagar.`)
        return
      }
      if (paymentMethod === 'bold' && res.bold) {
        const ok = await launchBoldCheckout(res.bold)
        if (!ok) {
          toast.error('No se pudo cargar Bold. Intenta otro método de pago.')
          return
        }
        // Bold abre su UI. Al terminar redirige a /pago/:reference.
        // No limpiamos carrito aún: lo hace PaymentResult cuando el pago está aprobado.
      } else {
        // WhatsApp: orden ya creada en BD; abrimos WhatsApp con el N° de pedido,
        // limpiamos carrito y llevamos al cliente a la vista de tracking.
        const waUrl = getWhatsAppUrl({
          ...customer,
          deliveryInfo: delivery,
          orderNumber: res.id,
          discountAmount: res.discount_amount || 0,
          discountReason: res.discount_reason || null,
          finalTotal: res.total
        })
        window.open(waUrl, '_blank')
        clearCart()
        try { localStorage.removeItem('avisander:pending_bold_order') } catch (_e) {}
        toast.success(`¡Pedido #${res.id} recibido! Te contactamos por WhatsApp.`)
        if (res.payment_reference) {
          navigate(`/pedido/${res.payment_reference}`)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Vista post-envío de comprobante. Tras enviar el WhatsApp, el cliente
  // aterriza aquí con confirmación clara de que su pedido fue recibido y
  // está en validación. Antes de este estado solo veía los QRs y no sabía
  // qué hacer después de mandar la captura.
  if (manualSent && manualOrder) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl border-t-4 border-primary overflow-hidden">
          <div className="p-8 sm:p-10 text-center bg-cream">
            <div className="mx-auto mb-4 flex justify-center">
              <LottieIcon name="payment-processing" size="4xl" loop autoplay fallbackIcon="loader" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display">¡Pedido enviado!</h1>
            <p className="text-lg font-mono text-primary font-bold mt-2">Pedido #{manualOrder.id}</p>
            <p className="text-gray-700 mt-3 max-w-md mx-auto">
              Gracias por tu compra. Recibimos tu solicitud — <strong>estamos validando tu comprobante</strong> y te confirmaremos por WhatsApp muy pronto.
            </p>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white">
            <h2 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wide">Tu pedido</h2>
            <div className="space-y-2 text-sm">
              {(manualOrder.items || []).map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-700">
                    {it.product_name}
                    {it.sale_type === 'by_weight'
                      ? ` · ${it.weight_grams} g`
                      : ` · ${it.quantity} und`}
                  </span>
                  <span className="font-medium text-gray-800">{fmt(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-3 space-y-1 text-sm">
              {manualOrder.delivery_cost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Domicilio</span>
                  <span>{fmt(manualOrder.delivery_cost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-charcoal text-lg pt-1">
                <span>Total</span>
                <span className="text-primary">{fmt(manualOrder.total)}</span>
              </div>
            </div>
            {manualOrder.payment_reference && (
              <p className="text-[11px] text-gray-400 font-mono mt-3 text-center">Ref: {manualOrder.payment_reference}</p>
            )}
          </div>

          <div className="p-5 bg-cream border-t">
            <div className="bg-white/70 border border-primary/20 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-charcoal mb-1">Qué sigue:</p>
              <ol className="list-decimal pl-5 space-y-1 text-[13px]">
                <li>Nuestra cajera revisa tu comprobante en WhatsApp.</li>
                <li>Al confirmar, descontamos tu producto del inventario.</li>
                <li>Coordinamos entrega contigo por el mismo chat.</li>
              </ol>
            </div>
          </div>

          <div className="p-6 bg-white border-t space-y-3">
            <a
              href={whatsappLink(settings.whatsapp_number, '')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
            >
              <MessageSquare size={18} />
              Volver al chat de WhatsApp
            </a>
            <Link
              to="/productos"
              onClick={() => { setManualSent(false); setManualOrder(null); setPaymentMethod('whatsapp') }}
              className="w-full block text-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Vista "Pago manual" (transferencia directa sin comisión): QR + llaves de
  // Nequi/Bancolombia. El cliente paga por fuera, escanea QR o copia la llave
  // y luego envía comprobante por WhatsApp. La cajera confirma en el admin.
  if (manualOrder) {
    const methodLabels = { breb: 'Llave Bre-B', nequi: 'Nequi QR', bancolombia: 'Bancolombia' }
    const waMsg = buildManualPaymentWhatsAppMessage(manualOrder, methodLabels[manualTab])
    const waUrl = whatsappLink(settings.whatsapp_number, waMsg)

    // 3 métodos. La llave Bre-B es universal — cualquier banco puede enviar
    // a ella (Nequi, Davivienda, Bancolombia, etc.) sin comisión. Por eso va
    // primero y con la llave en grande (sin QR).
    // Paleta institucional Avisander: primary (naranja), accent (rojo),
    // gold (amarillo). Los acentos por método se usan solo en el pill del
    // tab, no dominan la vista.
    const methods = {
      breb: {
        label: 'Llave Bre-B',
        short: 'Bre-B',
        pill: 'bg-accent',
        tagline: 'Universal · envía desde cualquier banco',
        kind: 'key',
        keyValue: '@leydif2110',
        keyLabel: 'Llave Bre-B',
        holder: 'LEY* FON*'
      },
      nequi: {
        label: 'Nequi QR',
        short: 'Nequi',
        pill: 'bg-primary',
        tagline: 'Escanea desde la app Nequi',
        kind: 'qr-only',
        qr: '/media/pagos/nequi-qr.jpeg',
        holder: 'LEY* FON*'
      },
      bancolombia: {
        label: 'Bancolombia',
        short: 'Bancolombia',
        pill: 'bg-gold',
        tagline: 'QR + cuenta de ahorros',
        kind: 'qr-rows',
        qr: '/media/pagos/bancolombia-qr.jpeg',
        holder: 'LEY* FON*',
        rows: [
          { label: 'Cuenta de ahorros', value: '09059841545', copyId: 'banco-cuenta' },
          { label: 'Titular', value: 'LEY* FON*', copyId: 'banco-titular' }
        ]
      }
    }
    const m = methods[manualTab]

    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Hero institucional Avisander (naranja primary) */}
          <div className="relative overflow-hidden bg-primary text-white p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,216,0,0.18),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-white/85 text-xs uppercase tracking-widest font-semibold">
                <ShieldCheck size={14} /> Sin comisión · pago directo
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2 font-display">Transferencia directa</h1>
              <p className="text-white/90 text-sm mt-1">Pedido #{manualOrder.id} reservado · stock apartado 15 min</p>
              <div className="mt-5">
                <p className="text-[11px] uppercase text-white/75 tracking-widest">Total a pagar</p>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight font-display">{fmt(manualOrder.total)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 sm:px-8 pt-5 bg-white">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
              {Object.entries(methods).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setManualTab(key)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    manualTab === key
                      ? 'bg-white shadow text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.pill}`} />
                    {meta.short}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{m.tagline}</p>
          </div>

          {/* Contenido del método seleccionado */}
          <div className="px-4 sm:px-8 py-6 bg-white">
            {m.kind === 'key' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
                  <QrCode size={12} /> Llave interoperable · todos los bancos
                </div>
                <p className="text-xs text-gray-500 mt-4 mb-1 uppercase tracking-wider">{m.keyLabel}</p>
                <div className="relative inline-block">
                  <div className="absolute -inset-3 bg-primary/10 rounded-3xl blur-2xl" />
                  <div className="relative bg-white border-2 border-primary/30 rounded-2xl px-6 sm:px-10 py-6 shadow-lg">
                    <p className="font-mono text-4xl sm:text-6xl font-black text-charcoal break-all tracking-tight select-all">
                      {m.keyValue}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(m.keyValue, 'breb-llave')}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-sm ${
                      copiedKey === 'breb-llave'
                        ? 'bg-success text-white scale-105'
                        : 'bg-charcoal text-white hover:bg-gray-700'
                    }`}
                  >
                    {copiedKey === 'breb-llave' ? <><Check size={18} /> ¡Copiada!</> : <><Copy size={18} /> Copiar llave</>}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Titular: <strong>{m.holder}</strong>
                </p>
                <div className="mt-5 max-w-md mx-auto bg-cream border border-primary/20 rounded-lg p-3 text-[11px] text-gray-700 leading-relaxed text-left">
                  <strong className="text-primary">Cómo usarla:</strong> abre tu app (Nequi, Bancolombia, Daviplata,
                  cualquier banco), elige "Enviar por Bre-B" o "Enviar por llave" y pega esta llave.
                  Transferencia instantánea y sin comisión.
                </div>
              </div>
            )}

            {m.kind === 'qr-only' && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Abre tu app Nequi y escanea</p>
                <div className="relative inline-block">
                  <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-2xl" />
                  <div className="relative bg-white border-4 border-white rounded-2xl shadow-xl p-3 ring-1 ring-primary/10">
                    <img
                      src={m.qr}
                      alt={`QR ${m.label}`}
                      className="w-72 h-72 sm:w-80 sm:h-80 object-contain rounded-lg mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden w-72 h-72 sm:w-80 sm:h-80 bg-gray-50 rounded-lg flex-col items-center justify-center text-gray-400 text-xs text-center p-4">
                      <QrCode size={64} className="mb-2 opacity-40" />
                      QR pendiente de cargar
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Titular: <strong>{m.holder}</strong>
                </p>
              </div>
            )}

            {m.kind === 'qr-rows' && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-xl" />
                  <div className="relative bg-white border-4 border-white rounded-2xl shadow-xl p-3 ring-1 ring-primary/10">
                    <img
                      src={m.qr}
                      alt={`QR ${m.label}`}
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden w-64 h-64 sm:w-72 sm:h-72 bg-gray-50 rounded-lg flex-col items-center justify-center text-gray-400 text-xs text-center p-4">
                      <QrCode size={48} className="mb-2 opacity-40" />
                      QR pendiente de cargar
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
                    <QrCode size={12} /> Escanea con tu app
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {m.rows.map((row) => (
                    <div
                      key={row.copyId}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition-colors"
                    >
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{row.label}</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="font-mono text-base sm:text-lg font-bold text-charcoal break-all">{row.value}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(row.value, row.copyId)}
                          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                            copiedKey === row.copyId
                              ? 'bg-success text-white scale-110'
                              : 'bg-white text-gray-500 hover:bg-primary hover:text-white border border-gray-200'
                          }`}
                          aria-label={`Copiar ${row.label}`}
                        >
                          {copiedKey === row.copyId ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed">
              <strong>Importante:</strong> transfiere <strong>exactamente {fmt(manualOrder.total)}</strong> para
              que podamos emparejar tu pago sin demoras.
            </div>
          </div>

          {/* CTA WhatsApp */}
          <div className="px-4 sm:px-8 pb-6 bg-white">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
              <p className="text-sm text-gray-700 text-center mb-3">
                Después de pagar, envíanos tu comprobante (PDF o captura).
                Una cajera lo valida y despachamos tu pedido.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { clearCart(); setManualSent(true) }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.01]"
              >
                <MessageSquare size={20} />
                Enviar comprobante por WhatsApp
              </a>
            </div>
          </div>

          {/* Pie */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setManualOrder(null); setPaymentMethod('whatsapp') }}
              className="text-gray-500 hover:text-gray-800 underline"
            >
              ← Cambiar método de pago
            </button>
            <span className="font-mono text-gray-400">{manualOrder.payment_reference}</span>
          </div>
        </div>
      </div>
    )
  }

  // Vista "Validando pago": bloqueante mientras esperamos el webhook de Bold.
  // Nequi/PSE en prod pueden tardar varios minutos — el cliente ve un Lottie
  // con contador, el número de pedido y un fallback a WhatsApp para adjuntar
  // comprobante manual si la espera se hace larga.
  if (validating && !paidOrder) {
    const mins = Math.floor(validationElapsed / 60)
    const secs = validationElapsed % 60
    const elapsedLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    const pendingRef = pendingOrder?.payment_reference
      || (() => { try { return JSON.parse(localStorage.getItem('avisander:pending_bold_order') || 'null')?.reference } catch { return null } })()

    const waFallbackMsg = [
      '⏳ *PAGO EN VALIDACIÓN - AVISANDER*',
      '',
      'Acabo de pagar con Bold pero aún estoy esperando la confirmación.',
      pendingOrder?.id ? `*Pedido N°:* #${pendingOrder.id}` : null,
      pendingRef ? `*Ref Bold:* ${pendingRef}` : null,
      pendingOrder?.total ? `*Total:* ${fmt(pendingOrder.total)}` : null,
      '',
      'Les adjunto el comprobante de mi app (Nequi / PSE / tarjeta).'
    ].filter(Boolean).join('\n')
    const waFallbackUrl = whatsappLink(settings.whatsapp_number, waFallbackMsg)

    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-primary overflow-hidden">
          <div className="p-8 text-center bg-orange-50">
            <div className="mx-auto mb-3 flex justify-center">
              <LottieIcon name="payment-processing" size="xl" loop autoplay fallbackIcon="loader" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Validando tu pago…</h1>
            {pendingOrder?.id && (
              <p className="text-lg font-mono text-primary font-bold mt-2">Pedido #{pendingOrder.id}</p>
            )}
            <p className="text-gray-600 mt-3">
              Estamos esperando la confirmación definitiva de Bold.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Tiempo transcurrido: <strong>{elapsedLabel}</strong>
            </p>
          </div>

          <div className="p-6 bg-white border-t">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">¿Por qué tarda?</p>
              <p>
                Nequi y PSE pueden tardar hasta <strong>5 minutos</strong> en
                notificarnos. Con tarjeta de crédito es casi instantáneo. No
                cierres esta ventana: apenas confirmen, te mostramos el
                comprobante y un botón para WhatsApp.
              </p>
            </div>

            {pendingOrder && (
              <div className="mt-5 space-y-1 text-sm">
                <h2 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">Tu pedido</h2>
                {pendingOrder.items?.map((it, i) => (
                  <div key={i} className="flex justify-between text-gray-700">
                    <span>
                      {it.product_name}
                      {it.sale_type === 'by_weight'
                        ? ` · ${it.weight_grams} g`
                        : ` · ${it.quantity} und`}
                    </span>
                    <span className="font-medium">{fmt(it.subtotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-800 pt-2 border-t mt-2">
                  <span>Total</span>
                  <span className="text-primary">{fmt(pendingOrder.total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t space-y-3">
            <p className="text-xs text-gray-500 text-center">
              ¿Ya pagaste y no quieres esperar? Envíanos tu comprobante por WhatsApp:
            </p>
            <a
              href={waFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <MessageSquare size={18} />
              Enviar comprobante por WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setValidating(false)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar esta vista (seguiremos validando en segundo plano)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vista de pago aprobado (tras confirmación del webhook Bold). Tiene prioridad
  // sobre el carrito vacío: queremos que el cliente vea el éxito incluso cuando
  // ya limpiamos el carrito.
  if (paidOrder) {
    const waMsg = buildPaidWhatsAppMessage(paidOrder)
    const waUrl = whatsappLink(settings.whatsapp_number, waMsg)
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-green-500 overflow-hidden">
          <div className="p-8 text-center bg-green-50">
            <div className="mx-auto mb-3 flex justify-center">
              <LottieIcon name="payment-success" size="xl" loop={false} autoplay fallbackIcon="check" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">¡Pago aprobado!</h1>
            <p className="text-lg font-mono text-green-700 font-bold mt-2">Pedido #{paidOrder.id}</p>
            <p className="text-gray-600 mt-2">Tu pago fue confirmado por Bold. Ya descontamos tu producto del inventario.</p>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white">
            <h2 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Detalle</h2>
            <div className="space-y-2 text-sm">
              {paidOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-700">
                    {it.product_name}
                    {it.sale_type === 'by_weight'
                      ? ` · ${it.weight_grams} g`
                      : ` · ${it.quantity} und`}
                  </span>
                  <span className="font-medium text-gray-800">{fmt(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-3 space-y-1 text-sm">
              {paidOrder.delivery_cost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Domicilio</span>
                  <span>{fmt(paidOrder.delivery_cost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-lg pt-1">
                <span>Total pagado</span>
                <span className="text-green-600">{fmt(paidOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Envía el comprobante por WhatsApp para que coordinemos la entrega.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              <MessageSquare size={20} />
              Enviar comprobante por WhatsApp
            </a>
            <Link
              to="/productos"
              onClick={() => setPaidOrder(null)}
              className="w-full block text-center mt-3 text-sm text-gray-500 hover:text-primary"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <span className="animate-cart-invite">
            <Icon3D name="shopping-cart" size="2xl" alt="Carrito vacío" />
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-8">Agrega productos del catálogo para empezar tu pedido.</p>
        <Link to="/productos" className="btn-primary">Ver productos</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrito de compras</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items + entrega */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            {items.map((item, index) => {
              const lt = lineTotal(item)
              const isWeight = item.sale_type === 'by_weight'
              const ppk = item.product.price_per_kg ?? item.product.price
              return (
                <div key={item.id} className={`p-4 ${index > 0 ? 'border-t' : ''}`}>
                  {/* Fila superior: foto + nombre/precio + eliminar */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <ProductImage product={item.product} size="xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2">{item.product.name}</h3>
                        <button
                          onClick={() => removeLine(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-primary font-medium">
                        {isWeight
                          ? `${fmt(ppk)} / kg`
                          : `${fmt(item.product.price)} / ${item.product.unit || 'und'}`}
                      </p>
                      {isWeight && (
                        <p className="text-sm text-gray-600 mt-1">
                          Pediste: <strong>{item.weight_grams} g</strong>
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-amber-700 mt-1 italic">📝 {item.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila inferior: qty + total (apilados en su propia fila en móvil) */}
                  <div className="flex items-center justify-between mt-3 ml-[76px] sm:ml-[92px]">
                    {!isWeight ? (
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateLine(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 sm:w-12 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateLine(item.id, { quantity: item.quantity + 1 })}
                          className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <span />
                    )}
                    <p className="font-semibold text-gray-800">{fmt(lt)}</p>
                  </div>

                  {/* Notas */}
                  <div className="mt-3 ml-[76px] sm:ml-[92px]">
                    {openNotesId === item.id ? (
                      <div>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={item.notes || ''}
                          onChange={(e) => updateLine(item.id, { notes: e.target.value })}
                          placeholder="Ej: sin piel, en pedazos, en bolsas separadas…"
                          className="input resize-none text-sm"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{(item.notes || '').length}/500</span>
                          <button onClick={() => setOpenNotesId(null)} className="text-sm text-primary hover:underline">
                            Listo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenNotesId(item.id)}
                        className="text-xs text-gray-500 hover:text-primary inline-flex items-center gap-1"
                      >
                        <MessageSquare size={12} />
                        {item.notes ? 'Editar observaciones' : 'Agregar observaciones'}
                      </button>
                    )}
                  </div>

                  {/* Cambiar gramos */}
                  {isWeight && (
                    <div className="mt-2 ml-24 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Cambiar gramos:</span>
                      <input
                        type="number"
                        min={50}
                        max={20000}
                        step={50}
                        value={item.weight_grams}
                        onChange={(e) =>
                          updateLine(item.id, {
                            weight_grams: Math.max(50, Math.min(20000, Number(e.target.value) || 50))
                          })
                        }
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs text-gray-500">g</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-between">
            <Link to="/productos" className="text-primary hover:underline">← Continuar comprando</Link>
            <button onClick={clearCart} className="text-gray-500 hover:text-red-500 transition-colors text-sm">
              Vaciar carrito
            </button>
          </div>

          {/* Datos de contacto (obligatorios para crear el pedido) */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-bold mb-4">Datos de contacto</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo <span className="text-primary">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Tu nombre"
                  className="input"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono / WhatsApp <span className="text-primary">*</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="3001234567"
                  className="input"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
            {!contactValid && (contact.name || contact.phone) && (
              <p className="text-xs text-amber-700 mt-2">
                Tu nombre debe tener al menos 2 letras y el teléfono 10 dígitos (o 7 para fijo).
              </p>
            )}
          </div>

          {/* Entrega */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-bold mb-4">Entrega</h2>
            <DeliveryPicker
              subtotal={subtotal}
              value={delivery}
              onChange={setDelivery}
            />
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-bold mb-4">Método de pago</h2>

            {hasByWeight ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      Tu carrito tiene productos por peso. Lo coordinamos por WhatsApp.
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      El peso real al cortar puede variar respecto a lo solicitado. Para evitar cobros
                      incorrectos, completamos este pedido por WhatsApp y confirmamos el total contigo
                      antes de cobrar.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('manual')}
                  className={`relative border-2 rounded-lg p-3 text-left transition ${
                    paymentMethod === 'manual' ? 'border-primary bg-red-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="absolute -top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Sin comisión
                  </span>
                  <div className="flex items-center gap-2 font-medium">
                    <QrCode size={16} /> Transferencia directa
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nequi · Bancolombia (QR)</p>
                </button>
                {boldConfig.enabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bold')}
                    className={`relative border-2 rounded-lg p-3 text-left transition ${
                      paymentMethod === 'bold' ? 'border-primary bg-red-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Banknote size={16} /> Tarjeta o PSE
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Bold · pago instantáneo</p>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`border-2 rounded-lg p-3 text-left transition ${
                    paymentMethod === 'whatsapp' ? 'border-primary bg-red-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <MessageSquare size={16} /> WhatsApp
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Coordinamos contigo</p>
                </button>
              </div>
            )}

            {!boldConfig.enabled && !hasByWeight && (
              <p className="text-xs text-gray-400 mt-3">
                Próximamente: pago online con PSE, Nequi y tarjetas.
              </p>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal <span className="text-xs text-gray-400">({items.length} {items.length === 1 ? 'producto' : 'productos'})</span></span>
                <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {discountPreview.reason || `Descuento ${discountPreview.percent}%`}
                  </span>
                  <span className="font-semibold">− {fmt(discountAmount)}</span>
                </div>
              )}
              {loyaltyInfo.enabled && user?.id && loyaltyInfo.balance > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-800 font-medium">Tus puntos</span>
                    <span className="font-bold text-amber-600">{loyaltyInfo.balance} pts</span>
                  </div>
                  {loyaltyInfo.balance >= (loyaltyInfo.redeem_min || 1000) ? (
                    <>
                      <label className="flex items-center gap-2 text-xs text-amber-700">
                        <input
                          type="checkbox"
                          checked={redeemPoints > 0}
                          onChange={(e) => setRedeemPoints(e.target.checked ? loyaltyInfo.balance : 0)}
                          className="accent-amber-500"
                        />
                        Usar puntos (−{fmt(loyaltyInfo.balance * (loyaltyInfo.point_value || 1))})
                      </label>
                      {redeemPoints > 0 && (
                        <div className="flex justify-between text-amber-700 text-sm">
                          <span>Canje {redeemPoints} puntos</span>
                          <span className="font-semibold">− {fmt(loyaltyDiscount)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Necesitas al menos <strong>{loyaltyInfo.redeem_min || 1000} puntos</strong> para canjear.
                      Te faltan <strong>{(loyaltyInfo.redeem_min || 1000) - loyaltyInfo.balance}</strong>.
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-between items-start">
                <span>
                  {delivery.method === 'pickup' ? 'Recoge en tienda' : 'Domicilio'}
                  {delivery.method === 'delivery' && !delivery.in_coverage && (
                    <span className="block text-[11px] text-gray-400">Elige tu dirección arriba</span>
                  )}
                </span>
                <span className={
                  delivery.method === 'pickup' || delivery.free
                    ? 'text-green-600 font-semibold'
                    : delivery.in_coverage ? 'font-medium text-gray-800' : 'text-gray-400 text-sm'
                }>
                  {delivery.method === 'pickup'
                    ? 'Gratis'
                    : (delivery.in_coverage
                      ? (delivery.free ? 'Gratis' : fmt(deliveryCost))
                      : 'Por calcular')}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-baseline">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-2xl font-extrabold text-primary">{fmt(total)}</span>
              </div>
            </div>

            {/* Invitación a registrarse para obtener el descuento (solo si user invitado). */}
            {!user?.id && discountPreview.percent === 0 && items.length > 0 && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-semibold text-green-800">
                  Regístrate y obtén 10% en tu primera compra
                </p>
                <p className="text-xs text-green-700 mt-1">
                  El descuento se aplica automáticamente al checkout si es tu primer pedido.
                </p>
                <div className="mt-2 flex gap-2">
                  <Link to="/registro" className="text-xs font-semibold text-primary hover:underline">
                    Crear cuenta
                  </Link>
                  <span className="text-gray-300">·</span>
                  <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            )}

            {items.some((it) => it.sale_type === 'by_weight') && (
              <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
                ⚖️ Los productos por peso se ajustan al pesar real. Confirmamos el total por WhatsApp antes de cobrar.
              </p>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={submitting || !canCheckout}
              className={`mt-6 w-full btn py-3 flex items-center justify-center gap-2 font-semibold transition-all text-white ${
                paymentMethod === 'bold'
                  ? 'bg-primary hover:bg-primary-dark disabled:bg-gray-300'
                  : paymentMethod === 'manual'
                    ? 'bg-accent hover:bg-accent-dark disabled:bg-gray-300'
                    : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
              } disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Procesando…
                </>
              ) : !canCheckout ? (
                <>
                  {delivery.method === 'delivery' && !delivery.in_coverage
                    ? '📍 Completa la dirección de entrega'
                    : '🛒 Selecciona cómo recibir'}
                </>
              ) : paymentMethod === 'bold' ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  Pagar {fmt(total)} de forma segura
                </>
              ) : paymentMethod === 'manual' ? (
                <>
                  <QrCode size={18} />
                  Continuar — ver llaves y QR
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Enviar pedido por WhatsApp
                </>
              )}
            </button>

            {canCheckout && (
              <p className="mt-3 text-xs text-gray-500 text-center leading-relaxed">
                {paymentMethod === 'bold' && '🔒 Tu pago es procesado por Bold (Bancolombia). Nunca guardamos tu tarjeta.'}
                {paymentMethod === 'manual' && '✨ Sin comisión de pasarela. Pagas directo y envías comprobante por WhatsApp.'}
                {paymentMethod === 'whatsapp' && 'Te redirigimos a WhatsApp para confirmar tu pedido.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Bold: contiene el botón oficial de la pasarela. Visible para que
          el cliente lo pulse explícitamente — el SDK exige contenedor visible. */}
      {boldPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-5">
              <h2 className="font-display text-xl font-bold">Pagar con Bold</h2>
              <p className="text-white/85 text-sm mt-1">
                Tarjetas · PSE · Nequi · Bancolombia
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-cream rounded-xl p-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Pedido</span>
                  <span className="font-mono text-xs">{boldPayload.order_id}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">{fmt(total)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500">
                Pulsa el botón naranja para pagar. Bold abrirá su ventana segura dentro de esta página.
              </p>
              <div id="bold-btn-target" className="flex justify-center min-h-[56px] [&_button]:!w-full"></div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-1">
                <Loader2 size={14} className="animate-spin" />
                <span>Esperando confirmación del pago…</span>
              </div>
              <button
                onClick={closeBoldModal}
                className="w-full text-sm text-gray-500 hover:text-charcoal transition-colors"
              >
                Cancelar
              </button>
              <p className="text-center text-[11px] text-gray-400 border-t pt-3">
                🔒 Tu pago es procesado por Bold (Bancolombia). Nunca guardamos los datos de tu tarjeta.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
