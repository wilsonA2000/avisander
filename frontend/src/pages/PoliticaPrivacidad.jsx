import { Shield, Lock, UserCheck, Mail, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, formatPhone } from '../context/SettingsContext'

function PoliticaPrivacidad() {
  useScrollToTop()
  const { settings } = useSettings()
  const nombre = settings.store_name || 'DISTRIBUIDORA AVICOLA DE SANTANDER — AVISANDER'
  const direccion = settings.store_address || 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga'

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <SEO
        title="Política de tratamiento de datos personales · Avisander"
        description={`Política de privacidad y tratamiento de datos personales de ${nombre}, según Ley 1581 de 2012.`}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Shield size={26} />
        </div>
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          Cumplimiento legal
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
          Política de tratamiento de datos personales
        </h1>
        <p className="text-sm text-gray-500">Última actualización: abril 2026</p>
      </motion.div>

      <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-7 md:p-10 space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">1. Responsable del tratamiento</h2>
          <p>
            <strong>{nombre}</strong>, con domicilio en <em>{direccion}</em>, teléfono{' '}
            {formatPhone(settings.whatsapp_number)}, correo electrónico{' '}
            <a href="mailto:contacto@avisander.com" className="text-primary hover:underline">
              contacto@avisander.com
            </a>
            , en adelante "la empresa", es responsable del tratamiento de los datos personales que recaude
            en ejercicio de su objeto social.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">2. Marco legal</h2>
          <p>
            Esta política da cumplimiento a la <strong>Ley 1581 de 2012</strong>,{' '}
            <strong>Decreto 1377 de 2013</strong> y demás normas concordantes sobre protección de datos
            personales en Colombia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">3. Finalidad del tratamiento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestionar pedidos, domicilios y atención al cliente.</li>
            <li>Procesar pagos en línea a través de nuestras pasarelas autorizadas.</li>
            <li>Enviar notificaciones sobre el estado de tu pedido.</li>
            <li>Envío de comunicaciones comerciales (solo si diste tu consentimiento).</li>
            <li>Mejorar nuestros productos y experiencia en la plataforma.</li>
            <li>Cumplir obligaciones legales, contables y tributarias.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">4. Datos que recolectamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nombres y apellidos.</li>
            <li>Número de documento (cuando se requiera factura).</li>
            <li>Teléfono celular y correo electrónico.</li>
            <li>Dirección de entrega y coordenadas geográficas (para cálculo de domicilio).</li>
            <li>Historial de compras.</li>
          </ul>
          <p className="mt-3 bg-cream rounded-lg p-3 text-sm">
            <strong>Nunca almacenamos datos de tu tarjeta de crédito/débito.</strong> Los pagos los procesa
            directamente <strong>Bold Payments</strong>, entidad vigilada por la Superintendencia Financiera.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">5. Tus derechos como titular</h2>
          <p>Conforme a la Ley 1581, como titular de los datos puedes:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se da a tus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
            <li>Revocar la autorización o solicitar la supresión del dato.</li>
            <li>Acceder gratuitamente a tus datos personales.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">6. Procedimiento para ejercer derechos</h2>
          <p>
            Puedes ejercer tus derechos escribiendo a{' '}
            <a href="mailto:privacidad@avisander.com" className="text-primary hover:underline">
              privacidad@avisander.com
            </a>{' '}
            o mediante el formulario de <a href="/pqrs" className="text-primary hover:underline">PQRS</a> en nuestra plataforma.
          </p>
          <p className="mt-2">Tiempos máximos de respuesta según la Ley 1581:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Consultas:</strong> 10 días hábiles.</li>
            <li><strong>Reclamos:</strong> 15 días hábiles.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">7. Medidas de seguridad</h2>
          <p>
            Aplicamos controles administrativos, técnicos y físicos para proteger tus datos contra pérdida,
            uso no autorizado, divulgación o alteración. Usamos conexiones HTTPS, contraseñas encriptadas
            con bcrypt, y tokens JWT de corta duración para las sesiones.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">8. Transferencia y transmisión</h2>
          <p>
            No vendemos, alquilamos ni cedemos tu información a terceros con fines comerciales. Solo
            compartimos datos con aliados estrictamente necesarios para la operación del servicio:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Bold Payments</strong> — procesamiento de pagos (Colombia).</li>
            <li><strong>Google Maps Platform</strong> — geocodificación de direcciones.</li>
            <li><strong>Proveedores de envío SMTP</strong> — notificaciones por correo.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">9. Vigencia</h2>
          <p>
            Esta política rige desde su fecha de publicación y puede ser modificada. Las modificaciones
            se comunicarán por nuestros canales oficiales. Tus datos personales permanecen almacenados
            durante el tiempo razonable y necesario para cumplir las finalidades aquí descritas.
          </p>
        </section>
      </article>

      <div className="mt-8 bg-cream rounded-2xl p-6 flex items-start gap-4">
        <UserCheck size={28} className="text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-charcoal mb-1">¿Dudas sobre tus datos?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Escríbenos — respondemos en máximo 10 días hábiles según ley.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a href="mailto:privacidad@avisander.com" className="btn-primary text-sm inline-flex items-center gap-2">
              <Mail size={14} /> privacidad@avisander.com
            </a>
            <a href="/pqrs" className="btn-outline text-sm inline-flex items-center gap-2">
              <FileText size={14} /> Enviar PQRS
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidad
