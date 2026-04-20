import { RefreshCcw, AlertTriangle, MessageSquare, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, formatPhone } from '../context/SettingsContext'

function CambiosDevoluciones() {
  useScrollToTop()
  const { settings } = useSettings()

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <SEO
        title="Cambios y devoluciones · Avisander"
        description="Política de cambios, devoluciones y reposiciones de Avisander — carne fresca, productos perecederos."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/15 text-accent-dark flex items-center justify-center mb-4">
          <RefreshCcw size={26} />
        </div>
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          Política comercial
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
          Cambios y devoluciones
        </h1>
        <p className="text-sm text-gray-500">Última actualización: abril 2026</p>
      </motion.div>

      <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-7 md:p-10 space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">Identificación del comercio</h2>
          <p>
            <strong>Distribuidora Avícola de Santander</strong> (nombre comercial{' '}
            <strong>Avisander</strong>), con <strong>NIT 1098732110</strong>, establecimiento de comercio
            abierto al público, con domicilio en Bucaramanga, Santander, Colombia. Esta política aplica a
            todos los pedidos realizados en <strong>distribuidoraavisander.com</strong> y en los canales
            oficiales de WhatsApp del comercio.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">1. Naturaleza perecedera del producto</h2>
          <p>
            Avisander comercializa <strong>carne fresca, embutidos, vísceras y derivados cárnicos</strong>,
            todos productos perecederos que requieren cadena de frío. Por esta razón, conforme al{' '}
            <strong>Artículo 47 numeral 2 de la Ley 1480 de 2011</strong> (Estatuto del Consumidor), el
            derecho de retracto no aplica sobre nuestros productos.
          </p>
          <p className="mt-3 bg-cream rounded-lg p-3 text-sm">
            <AlertTriangle size={14} className="inline mr-1 text-accent" />
            Esto no anula las garantías legales: si el producto llega en mal estado o no corresponde a lo
            pedido, siempre lo reponemos o reintegramos el pago.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">2. Casos en los que reponemos o reintegramos</h2>
          <p>Reemplazamos el producto o devolvemos el pago en estos casos:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Producto en mal estado</strong> — olor desagradable, color alterado, temperatura por encima de 4 °C al momento de la entrega.</li>
            <li><strong>Producto equivocado</strong> — la pieza entregada no corresponde al corte pedido.</li>
            <li><strong>Peso inferior al facturado</strong> — si el peso entregado es menor al facturado por encima de una tolerancia del 3 %.</li>
            <li><strong>Empaque dañado</strong> — roto o con fuga de líquidos antes de abrirlo.</li>
            <li><strong>Producto caducado</strong> — fecha de vencimiento vencida al momento de entrega (aplica a embutidos o productos empacados).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">3. Plazo y procedimiento para reclamar</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <strong>Revisa tu pedido al recibirlo.</strong> El cliente debe revisar el producto al momento
              de la entrega, delante del domiciliario cuando sea posible.
            </li>
            <li>
              <strong>Notifica por WhatsApp dentro de las 2 horas siguientes</strong> al recibo. Envía:
              <ul className="list-disc pl-6 mt-1 space-y-0.5">
                <li>Número del pedido.</li>
                <li>Fotos del producto y del empaque.</li>
                <li>Descripción breve del problema.</li>
              </ul>
            </li>
            <li>
              <strong>Validación.</strong> Nuestro equipo revisa el caso en el mismo día hábil y propone la
              solución (reposición, devolución del pago o nota crédito).
            </li>
          </ol>
          <p className="mt-3 bg-cream rounded-lg p-3 text-sm">
            <AlertTriangle size={14} className="inline mr-1 text-accent" />
            <strong>No aceptamos reclamos</strong> si el producto ya fue almacenado fuera de la cadena de
            frío, cocinado, porcionado en casa o consumido parcialmente, porque no es posible verificar el
            estado original.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">4. Formas de resolución</h2>
          <p>Según el caso, ofrecemos una de estas opciones:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Reposición en la siguiente entrega</strong> — enviamos el producto correcto sin costo adicional, en el próximo despacho a tu zona.</li>
            <li><strong>Devolución del pago</strong> — reintegro al mismo medio de pago usado:
              <ul className="list-disc pl-6 mt-1 space-y-0.5">
                <li><strong>Bold (tarjeta o PSE):</strong> 5 a 15 días hábiles, gestionado a través de la pasarela Bold.</li>
                <li><strong>Transferencia Nequi / Bancolombia:</strong> 1 a 3 días hábiles.</li>
              </ul>
            </li>
            <li><strong>Nota crédito</strong> — saldo a favor para usar en futuras compras, disponible de inmediato.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">5. Cancelación antes del despacho</h2>
          <p>
            Si el cliente desea cancelar un pedido <strong>antes de que salga a despacho</strong> y ya pagó,
            puede escribirnos por WhatsApp y gestionamos la devolución del 100 % del valor al medio de pago
            original, sin costo. Una vez el pedido sale a despacho, solo aplican las causales del numeral 2.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">6. Productos no reemplazables</h2>
          <p>Por su naturaleza, los siguientes no son sujetos de reposición una vez entregados:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Cortes personalizados según especificación del cliente (tamaños, marinados, picados especiales).</li>
            <li>Productos ya consumidos parcialmente.</li>
            <li>Productos almacenados sin respetar cadena de frío.</li>
            <li>Pedidos "por encargo" confirmados por WhatsApp con especificaciones puntuales.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">7. Canal oficial de reclamos</h2>
          <p>
            Todas las solicitudes de cambio, devolución o reclamo se gestionan exclusivamente a través de
            nuestros canales oficiales:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>WhatsApp:</strong> {formatPhone(settings.whatsapp_number)}
            </li>
            <li>
              <strong>Correo:</strong>{' '}
              <a href="mailto:contacto@avisander.com" className="text-primary hover:underline">
                contacto@avisander.com
              </a>
            </li>
            <li>
              <strong>PQRS formal:</strong>{' '}
              <a href="/pqrs" className="text-primary hover:underline">
                Formulario PQRS
              </a>
            </li>
          </ul>
          <p className="mt-2">
            Los reclamos que lleguen por otras vías (redes sociales, mensajes a terceros) podrían no tener
            seguimiento trazable — siempre solicita quedar con la constancia del caso.
          </p>
        </section>
      </article>

      <div className="mt-8 bg-cream rounded-2xl p-6 flex items-start gap-4">
        <MessageSquare size={28} className="text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-charcoal mb-1">¿Tienes un inconveniente con tu pedido?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Escríbenos lo antes posible — entre más pronto recibimos la foto, más rápido resolvemos.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a href="mailto:contacto@avisander.com" className="btn-outline text-sm inline-flex items-center gap-2">
              <Mail size={14} /> contacto@avisander.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CambiosDevoluciones
