import { ShieldAlert, FileSearch, AlertTriangle, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'
import { useSettings, formatPhone } from '../context/SettingsContext'

function PoliticaSarlaft() {
  useScrollToTop()
  const { settings } = useSettings()
  const nombre = settings.store_name || 'DISTRIBUIDORA AVICOLA DE SANTANDER — AVISANDER'

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <SEO
        title="Política SARLAFT · Avisander"
        description={`Política de prevención de lavado de activos y financiación del terrorismo de ${nombre}.`}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/15 text-accent-dark flex items-center justify-center mb-4">
          <ShieldAlert size={26} />
        </div>
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          Cumplimiento normativo
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
          Política SARLAFT
        </h1>
        <p className="text-sm text-gray-500">
          Sistema de Autocontrol y Gestión de Riesgos de LA/FT/FPADM
        </p>
      </motion.div>

      <article className="bg-white rounded-2xl shadow-soft border border-gray-100 p-7 md:p-10 space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">1. Compromiso institucional</h2>
          <p>
            <strong>Distribuidora Avícola de Santander</strong> (nombre comercial <strong>Avisander</strong>),
            con <strong>NIT 1098732110</strong>, establecimiento de comercio abierto al público en
            Bucaramanga, declara su compromiso pleno con la prevención del lavado de activos (LA),
            la financiación del terrorismo (FT) y la financiación de la proliferación de armas de
            destrucción masiva (FPADM). Operamos conforme a la{' '}
            <strong>Circular Externa 100-000016 de 2020</strong> de la Superintendencia de Sociedades y
            demás normas aplicables.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">2. Alcance</h2>
          <p>
            Esta política aplica a todas las operaciones comerciales, clientes, proveedores, colaboradores
            y aliados estratégicos de Avisander, tanto en operaciones presenciales como digitales a través
            de nuestra plataforma de e-commerce.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">3. Debida diligencia</h2>
          <p>
            Aplicamos procedimientos de conocimiento del cliente (KYC) proporcionales al nivel de riesgo
            de cada operación:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Identificación plena de clientes con documento válido cuando supere los umbrales legales.</li>
            <li>Consulta en listas vinculantes (OFAC, ONU, listas nacionales).</li>
            <li>Verificación de la coherencia entre el perfil del cliente y sus operaciones.</li>
            <li>Monitoreo de transacciones atípicas o inusuales.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">4. Medios de pago autorizados</h2>
          <p>
            Solo aceptamos pagos a través de medios formales y trazables:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Bold Payments</strong> (PSE, tarjetas, Nequi) — entidad vigilada por la Superintendencia Financiera.</li>
            <li><strong>Transferencias bancarias</strong> desde cuenta a nombre del cliente.</li>
            <li><strong>Efectivo</strong> únicamente en compra presencial en tienda, sujeto a límites legales.</li>
          </ul>
          <p className="mt-3 bg-cream rounded-lg p-3 text-sm">
            <AlertTriangle size={14} className="inline mr-1 text-accent" />
            No aceptamos criptomonedas, giros postales de origen desconocido ni pagos fragmentados sospechosos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">5. Señales de alerta</h2>
          <p>Nuestro equipo monitorea activamente patrones de actividad inusual, entre ellos:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Operaciones fragmentadas para evadir umbrales de reporte.</li>
            <li>Pedidos de alto valor sin justificación comercial clara.</li>
            <li>Cambios abruptos en el comportamiento transaccional del cliente.</li>
            <li>Direcciones de entrega cambiantes o inconsistentes.</li>
            <li>Clientes que insisten en medios de pago atípicos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">6. Reporte de operaciones sospechosas</h2>
          <p>
            Avisander reporta a la <strong>UIAF (Unidad de Información y Análisis Financiero)</strong>{' '}
            las operaciones sospechosas detectadas, según los plazos y formatos que establece la ley.
            Ningún empleado podrá informar al cliente ni a terceros sobre un reporte presentado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">7. Oficial de cumplimiento</h2>
          <p>
            Contamos con un responsable designado para la administración del sistema SARLAFT, quien recibe
            reportes internos, coordina con la UIAF y capacita al equipo.
          </p>
          <p className="mt-2">
            <strong>Contacto:</strong>{' '}
            <a href="mailto:cumplimiento@avisander.com" className="text-primary hover:underline">
              cumplimiento@avisander.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">8. Capacitación</h2>
          <p>
            Todo el personal de Avisander recibe capacitación anual en materia de SARLAFT. Los casos
            detectados se gestionan con confidencialidad absoluta.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">9. Vigencia y revisión</h2>
          <p>
            Esta política se revisa anualmente o cuando ocurran cambios regulatorios. La última revisión
            fue en <strong>abril de 2026</strong>.
          </p>
        </section>
      </article>

      <div className="mt-8 bg-cream rounded-2xl p-6 flex items-start gap-4">
        <FileSearch size={28} className="text-primary flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-charcoal mb-1">¿Necesitas reportar algo?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Puedes contactarnos directamente al oficial de cumplimiento. Recibimos reportes anónimos.
          </p>
          <div className="flex gap-2 flex-wrap text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Mail size={12} /> cumplimiento@avisander.com
            </span>
            <span>· Tel {formatPhone(settings.whatsapp_number)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoliticaSarlaft
