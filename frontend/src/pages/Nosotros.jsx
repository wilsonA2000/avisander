import { motion } from 'framer-motion'
import { Target, Eye, Heart, Award, Snowflake, Users, ShieldCheck, Truck, MessageCircle } from 'lucide-react'
import SEO from '../components/SEO'
import useScrollToTop from '../hooks/useScrollToTop'

const VALUES = [
  { Icon: Award, title: 'Calidad', text: 'Seleccionamos a mano cada corte que entra a nuestra tienda.' },
  { Icon: Snowflake, title: 'Frescura', text: 'Cadena de frío garantizada desde el proveedor hasta tu cocina.' },
  { Icon: Users, title: 'Cercanía', text: 'Te atendemos como lo hacían los carniceros de antes: caso por caso.' }
]

function Nosotros() {
  useScrollToTop()
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <SEO title="Nosotros · Avisander" description="Misión, visión y valores de la carnicería premium Avisander en Bucaramanga." />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
          Nuestra historia
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-charcoal leading-tight mb-4">
          Carnicería artesanal,<br />
          <span className="italic text-primary">pensada para tu mesa.</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Llevamos más de dos décadas seleccionando los mejores cortes para las familias y restaurantes
          de Bucaramanga. Lo que empezó como una tienda de barrio hoy es una marca de referencia por
          su calidad, trazabilidad y atención personalizada.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-14">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Target size={24} />
          </div>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-3">Misión</h2>
          <p className="text-gray-600 leading-relaxed">
            Ofrecer carnes y especialidades de la más alta calidad a los hogares y cocinas profesionales
            de Bucaramanga, con un servicio cercano, trazabilidad completa y cadena de frío garantizada.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent-dark flex items-center justify-center mb-4">
            <Eye size={24} />
          </div>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-3">Visión</h2>
          <p className="text-gray-600 leading-relaxed">
            Ser la carnicería premium de referencia en el Santander, reconocida por innovar en servicio
            digital y por elevar la experiencia gastronómica desde la materia prima.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10"
      >
        <h2 className="font-display text-3xl font-bold text-center text-charcoal mb-2">Nuestros valores</h2>
        <p className="text-center text-gray-500 mb-8">Lo que guía cada decisión, desde el proveedor hasta tu mesa.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {VALUES.map(({ Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cream rounded-2xl p-7 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary text-white flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* "Por qué Avisander" — movido aquí desde Home */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        className="mt-14 pt-10 border-t border-gray-200"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-charcoal mb-2">
          Por qué Avisander
        </h2>
        <p className="text-center text-gray-500 mb-8 max-w-xl mx-auto">
          Más que una carnicería: una experiencia pensada para llevarte los mejores cortes a casa.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { Icon: ShieldCheck, title: 'Calidad garantizada', text: 'Selección diaria de cortes premium y trazabilidad total del producto.' },
            { Icon: Truck, title: 'Domicilios rápidos', text: 'Entregamos en toda el área metropolitana de Bucaramanga, con cadena de frío.' },
            { Icon: MessageCircle, title: 'Atención personalizada', text: 'Coordinamos cortes y peso exacto por WhatsApp, para que sea justo como lo necesitas.' }
          ].map(({ Icon, title, text }) => (
            <motion.div
              key={title}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-7 shadow-soft border border-gray-100"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">{title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mt-10 pt-10 border-t border-gray-200"
      >
        <Heart size={32} className="text-primary mx-auto mb-3" />
        <p className="italic text-gray-600 max-w-xl mx-auto">
          "Cada corte que entra a nuestra tienda es un corte que merecen nuestros clientes."
        </p>
      </motion.div>
    </div>
  )
}

export default Nosotros
