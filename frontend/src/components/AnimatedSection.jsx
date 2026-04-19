import { motion } from 'framer-motion'

// Wrapper con fade-up al entrar al viewport. Una sola vez (once: true) para
// no re-animar al hacer scroll hacia arriba. Margin negativo para que la
// animación arranque un poco antes de que el elemento sea visible del todo.
function AnimatedSection({ as = 'section', children, delay = 0, y = 24, className, ...rest }) {
  const Tag = motion[as] || motion.section
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default AnimatedSection
