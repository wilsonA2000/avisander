import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, MessageSquare, Banknote } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/apiClient'
import DeliveryPicker from '../components/DeliveryPicker'
import ProductImage from '../components/ProductImage'

function fmt(n) {
  return `$${Number(n || 0).toLocaleString('es-CO')}`
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
  const [submitting, setSubmitting] = useState(false)
  const [openNotesId, setOpenNotesId] = useState(null)

  const navigate = useNavigate()

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
  const total = subtotal + (items.length > 0 ? deliveryCost : 0)

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

  const launchBoldCheckout = (payload) => {
    // Devolvemos true de una: el click lo da el cliente desde el modal.
    // Al pagar, Bold redirige a /pago/:ref y PaymentResult hace polling del status.
    setBoldPayload(payload)
    return Promise.resolve(true)
  }

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
    script.setAttribute('data-amount', String(boldPayload.amount_in_cents))
    script.setAttribute('data-currency', boldPayload.currency)
    script.setAttribute('data-integrity-signature', boldPayload.signature)
    script.setAttribute('data-description', boldPayload.description || 'Pedido Avisander')
    script.setAttribute(
      'data-redirection-url',
      `${window.location.origin}/pago/${boldPayload.order_id}`
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
    try {
      const res = await api.post('/api/orders', {
        items: toOrderItems(),
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        delivery_method: delivery.method,
        delivery_lat: delivery.lat,
        delivery_lng: delivery.lng,
        delivery_city: delivery.city,
        payment_method: paymentMethod
      })

      if (paymentMethod === 'bold' && res.bold) {
        const ok = await launchBoldCheckout(res.bold)
        if (!ok) {
          toast.error('No se pudo cargar Bold. Intenta otro método de pago.')
          return
        }
        // Bold abre su UI. Al terminar redirige a /pago/:reference.
        // No limpiamos carrito aún: lo hace PaymentResult cuando el pago está aprobado.
      } else {
        // WhatsApp / Cash: abrimos WhatsApp y limpiamos carrito
        window.open(getWhatsAppUrl({ ...customer, deliveryInfo: delivery }), '_blank')
        clearCart()
        toast.success('¡Pedido enviado! Te contactamos por WhatsApp.')
      }
    } catch (err) {
      toast.error(err.message || 'No pudimos guardar el pedido. Abriendo WhatsApp igual.')
      if (paymentMethod !== 'bold') {
        window.open(getWhatsAppUrl({ ...customer, deliveryInfo: delivery }), '_blank')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
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
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <ProductImage product={item.product} size="xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{item.product.name}</h3>
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

                    {!isWeight && (
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateLine(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="p-2 hover:bg-gray-100 transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateLine(item.id, { quantity: item.quantity + 1 })}
                          className="p-2 hover:bg-gray-100 transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}

                    <div className="text-right min-w-[100px]">
                      <p className="font-semibold text-gray-800">{fmt(lt)}</p>
                    </div>

                    <button
                      onClick={() => removeLine(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Notas */}
                  <div className="mt-3 ml-24">
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
              <div className="grid sm:grid-cols-2 gap-2">
                {boldConfig.enabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bold')}
                    className={`relative border-2 rounded-lg p-3 text-left transition ${
                      paymentMethod === 'bold' ? 'border-primary bg-red-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="absolute -top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Más económico
                    </span>
                    <div className="flex items-center gap-2 font-medium">
                      <Banknote size={16} /> Pagar con PSE / Nequi
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Transferencia directa · tarjetas también</p>
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
                Pulsa el botón naranja para continuar. Bold abrirá su ventana segura.
              </p>
              <div id="bold-btn-target" className="flex justify-center min-h-[56px] [&_button]:!w-full"></div>
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
