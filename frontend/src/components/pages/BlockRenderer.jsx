import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BadgeCheck, Truck, Shield, Star, Sparkles, ArrowRight } from 'lucide-react'

const ICONS = {
  badge: BadgeCheck,
  truck: Truck,
  shield: Shield,
  star: Star,
  sparkles: Sparkles
}

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

function Hero({ title, subtitle, image_url, cta_label, cta_href }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white">
      {image_url && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${image_url})` }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(255,255,255,0.15), transparent 50%)'
        }}
      />
      <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
        <motion.h1
          {...reveal}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-4 drop-shadow-lg"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8"
          >
            {subtitle}
          </motion.p>
        )}
        {cta_label && cta_href && (
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
          >
            <CTAButton href={cta_href} className="bg-white text-orange-600 hover:bg-orange-50">
              {cta_label} <ArrowRight size={18} />
            </CTAButton>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Benefits({ title, items = [] }) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      {title && (
        <motion.h2
          {...reveal}
          className="font-display text-3xl md:text-4xl font-bold text-center text-charcoal mb-12"
        >
          {title}
        </motion.h2>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it, i) => {
          const Icon = ICONS[it.icon] || BadgeCheck
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/50 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <Icon size={24} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-charcoal mb-2">{it.title}</h3>
              <p className="text-sm text-gray-600">{it.text}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function Split({ image_url, imagePosition = 'right', title, text }) {
  const right = imagePosition === 'right'
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, x: right ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className={right ? 'order-1' : 'order-1 md:order-2'}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-charcoal mb-5 leading-tight">
            {title}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">{text}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
          className={right ? 'order-2' : 'order-2 md:order-1'}
        >
          {image_url ? (
            <img
              src={image_url}
              alt=""
              loading="lazy"
              className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl" />
          )}
        </motion.div>
      </div>
    </section>
  )
}

function Numbers({ items = [] }) {
  return (
    <section className="bg-charcoal text-white py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 text-center">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="font-display text-5xl md:text-6xl font-black bg-gradient-to-br from-orange-300 to-orange-500 bg-clip-text text-transparent mb-2">
                {it.number}
              </div>
              <div className="text-sm uppercase tracking-widest text-white/60 font-semibold">
                {it.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Process({ steps = [] }) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-black text-2xl flex items-center justify-center mb-4 shadow-lg">
              {s.n || i + 1}
            </div>
            <h3 className="font-bold text-lg text-charcoal mb-2">{s.title}</h3>
            <p className="text-sm text-gray-600">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function CTAButton({ href, children, className = '' }) {
  const isExternal = /^https?:\/\//.test(href || '')
  const cls = `inline-flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-full transition-colors shadow-lg ${className}`
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href || '#'} className={cls}>
      {children}
    </Link>
  )
}

function CTASection({ title, text, button_label, button_href }) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <motion.div
        {...reveal}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white rounded-3xl p-10 md:p-16 text-center shadow-2xl"
      >
        <h2 className="font-display text-3xl md:text-5xl font-black mb-4 leading-tight">
          {title}
        </h2>
        {text && <p className="text-white/90 text-lg mb-7 max-w-2xl mx-auto">{text}</p>}
        {button_label && button_href && (
          <CTAButton href={button_href} className="bg-white text-orange-600 hover:bg-orange-50">
            {button_label} <ArrowRight size={18} />
          </CTAButton>
        )}
      </motion.div>
    </section>
  )
}

function BlockRenderer({ blocks = [] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'hero':
            return <Hero key={i} {...b} />
          case 'benefits':
            return <Benefits key={i} {...b} />
          case 'split':
            return <Split key={i} {...b} />
          case 'numbers':
            return <Numbers key={i} {...b} />
          case 'process':
            return <Process key={i} {...b} />
          case 'cta':
            return <CTASection key={i} {...b} />
          default:
            return null
        }
      })}
    </>
  )
}

export default BlockRenderer
