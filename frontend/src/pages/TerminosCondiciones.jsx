import { ScrollText, MessageSquare, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, formatPhone } from '../context/SettingsContext'

function TerminosCondiciones() {
  useScrollToTop()
  const { settings } = useSettings()
  const direccion = settings.store_address || 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga'

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <SEO
        title="Términos y condiciones · Avisander"
        description="Términos y condiciones de venta de Distribuidora Avícola de Santander (Avisander), NIT 1098732110, Bucaramanga."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ScrollText size={26} />
        </div>
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          Documento legal
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
          Términos y condiciones
        </h1>
        <p className="text-sm text-gray-500">Última actualización: abril 2026</p>
      </motion.div>

      <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-7 md:p-10 space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">1. Identificación del comercio</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Razón social: <strong>Distribuidora Avícola de Santander</strong></li>
            <li>Nombre comercial: <strong>Avisander</strong></li>
            <li>NIT: <strong>1098732110</strong></li>
            <li>Establecimiento de comercio abierto al público</li>
            <li>Dirección: <em>{direccion}</em></li>
            <li>Teléfono / WhatsApp: {formatPhone(settings.whatsapp_number)}</li>
            <li>Correo electrónico: <a href="mailto:contacto@avisander.com" className="text-primary hover:underline">contacto@avisander.com</a></li>
            <li>Sitio web: <strong>distribuidoraavisander.com</strong></li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">2. Objeto y ámbito</h2>
          <p>
            Avisander comercializa al detal productos cárnicos y avícolas frescos (res, cerdo, pollo, embutidos
            y vísceras) a través de nuestro canal físico y del sitio web. Estos términos y condiciones regulan
            el uso de la plataforma digital y la relación comercial entre el cliente y la empresa. El uso del
            sitio implica la aceptación expresa de estos términos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">3. Proceso de compra</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>El cliente selecciona productos desde el catálogo.</li>
            <li>Ingresa sus datos de contacto y dirección (para domicilio) o confirma "Recoger en tienda".</li>
            <li>Elige el método de pago: Bold (tarjeta/PSE/Nequi/Bancolombia), transferencia directa o WhatsApp.</li>
            <li>Al confirmar el pedido, la empresa genera una orden con número único y reserva el inventario
              por un máximo de 15 minutos mientras se completa el pago.</li>
            <li>Una vez validado el pago, la empresa confirma por WhatsApp y coordina la entrega.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">4. Medios de pago aceptados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Bold Payments</strong> — tarjetas de crédito y débito (Visa, Mastercard, American Express, Diners), PSE, Nequi y Bancolombia. Bold es entidad vigilada por la Superintendencia Financiera de Colombia.</li>
            <li><strong>Transferencia directa</strong> — Nequi, Bancolombia o QR. El pedido se mantiene pending hasta que la cajera valide el comprobante.</li>
            <li><strong>Coordinación por WhatsApp</strong> — para productos por peso variable y pedidos especiales. El cobro se confirma después del pesaje real.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">5. Precios</h2>
          <p>
            Todos los precios están expresados en <strong>pesos colombianos (COP)</strong> e incluyen el IVA
            cuando aplica, conforme a la normativa tributaria vigente. Los precios pueden variar sin previo
            aviso, pero el precio aplicable a cada pedido es el vigente al momento de <em>confirmar</em> la
            orden. Si un producto cambia de precio entre que se agrega al carrito y se confirma la orden,
            el sistema avisa al cliente y solicita confirmar el nuevo total antes de cobrar.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">6. Productos por peso variable</h2>
          <p>
            Los productos marcados como <strong>"Por peso"</strong> se venden al precio por kilogramo
            publicado. El peso solicitado es aproximado: el peso real del corte puede variar ±5 % respecto a
            lo solicitado, porque depende de la pieza disponible. El total final se confirma al cliente por
            WhatsApp antes de despachar. Si el cliente no acepta el peso real, la empresa ajusta el pedido
            o cancela sin costo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">7. Entrega y domicilios</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Cobertura:</strong> área metropolitana de Bucaramanga (Bucaramanga, Floridablanca, Girón, Piedecuesta). Direcciones fuera de cobertura se coordinan manualmente por WhatsApp.</li>
            <li><strong>Costo del domicilio:</strong> se calcula en el checkout según la distancia real hasta la dirección.</li>
            <li><strong>Tiempo estimado:</strong> mismo día para pedidos confirmados antes de las 3:00 p. m.; siguiente día hábil para pedidos posteriores.</li>
            <li><strong>Recibo del pedido:</strong> el cliente o una persona autorizada debe estar presente. Si no hay nadie, el domiciliario intenta contacto por teléfono; si no hay respuesta, el pedido regresa al punto y se reprograma.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">8. Garantía y cadena de frío</h2>
          <p>
            Todos los productos se despachan en cadena de frío (refrigerados o congelados según
            corresponda) y están aptos para consumo al momento de la entrega. La empresa garantiza la
            frescura del producto hasta el momento de recibirlo. Las condiciones de conservación posteriores
            son responsabilidad del cliente.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">9. Derecho de retracto — Excepción legal</h2>
          <p>
            Por tratarse de <strong>bienes perecederos</strong>, los productos comercializados por Avisander
            están expresamente excluidos del derecho de retracto, conforme al{' '}
            <strong>Artículo 47, numeral 2, de la Ley 1480 de 2011</strong> (Estatuto del Consumidor):
          </p>
          <blockquote className="border-l-4 border-primary/40 pl-4 mt-2 italic text-sm text-gray-600">
            "El derecho de retracto no aplicará en los siguientes casos: (...) 2. En los contratos de
            suministro de bienes cuyo precio esté sujeto a fluctuaciones de coeficientes del mercado que el
            proveedor no pueda controlar; 3. En los contratos de suministro de bienes confeccionados conforme
            a las especificaciones del consumidor o claramente personalizados; 4. En los contratos de
            suministro de bienes que, por su naturaleza, no puedan ser devueltos o puedan deteriorarse o
            caducar con rapidez."
          </blockquote>
          <p className="mt-2">
            Esto no afecta las garantías legales por defectos del producto o errores de la empresa: ver la{' '}
            <a href="/cambios-devoluciones" className="text-primary hover:underline">
              Política de Cambios y Devoluciones
            </a>{' '}
            para los casos en que sí se reemplaza o reintegra el producto.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">10. Uso del sitio</h2>
          <p>El cliente se obliga a usar el sitio de buena fe. Está prohibido:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Usar la plataforma con datos falsos o suplantando identidad.</li>
            <li>Realizar scraping, ingeniería inversa o accesos no autorizados al sistema.</li>
            <li>Intentar manipular precios, inventarios o el flujo de pedidos.</li>
            <li>Usar el sitio para fines ilícitos o que vulneren derechos de terceros.</li>
          </ul>
          <p className="mt-2">
            La empresa puede suspender o cancelar cuentas que incurran en estas conductas, sin perjuicio de
            las acciones legales a que haya lugar.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">11. Propiedad intelectual</h2>
          <p>
            La marca Avisander, el logotipo, los textos, las fotografías y el diseño del sitio son propiedad
            de Distribuidora Avícola de Santander o se usan bajo licencia. Queda prohibida su reproducción
            total o parcial sin autorización previa y por escrito.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">12. Protección de datos</h2>
          <p>
            El tratamiento de los datos personales del cliente se rige por la{' '}
            <a href="/politica-privacidad" className="text-primary hover:underline">
              Política de tratamiento de datos personales
            </a>{' '}
            conforme a la Ley 1581 de 2012.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">13. Modificaciones</h2>
          <p>
            La empresa puede modificar estos términos en cualquier momento. Los cambios aplican desde su
            publicación en el sitio. Para operaciones en curso rige la versión aceptada al momento de
            confirmar el pedido.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">14. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de la <strong>República de Colombia</strong>. Cualquier
            controversia que no pueda resolverse directamente entre las partes se someterá a los jueces
            competentes del circuito de <strong>Bucaramanga, Santander</strong>.
          </p>
        </section>
      </article>

      <div className="mt-8 bg-cream rounded-2xl p-6 flex items-start gap-4">
        <MessageSquare size={28} className="text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-charcoal mb-1">¿Dudas sobre tu compra?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Escríbenos por WhatsApp o correo — te respondemos en horario comercial.
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

export default TerminosCondiciones
