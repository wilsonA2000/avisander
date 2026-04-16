// TrustIcon3D — alias ergonómico sobre Icon3D.
//
// Mantiene la API original (name + className) para no tener que tocar los
// componentes que ya lo usan. Internamente traduce a Icon3D con fallback
// automático a lucide si el PNG 3D no está disponible.
//
// Uso:
//   <TrustIcon3D name="fresh" className="w-9 h-9" />
//   <TrustIcon3D name="cold" className="w-10 h-10" />
//   <TrustIcon3D name="truck" />
//   <TrustIcon3D name="chat" />
//   <TrustIcon3D name="medal" className="w-12 h-12" />

import Icon3D from './Icon3D'

// Mapeo de nombres antiguos a slugs del iconMap
const NAME_MAP = {
  'fresh':  'fresh',
  'cold':   'cold-chain',
  'truck':  'delivery',
  'chat':   'whatsapp-chat',
  'medal':  'quality-medal'
}

// Mapea el tamaño implícito en la className (w-8, w-9, w-10...) a size de Icon3D
function guessSize(className = '') {
  if (/w-(5|6|7|8)\b/.test(className)) return 'xs'
  if (/w-(9|10|11|12)\b/.test(className)) return 'sm'
  if (/w-(14|16)\b/.test(className)) return 'md'
  if (/w-(20|24)\b/.test(className)) return 'lg'
  if (/w-(28|32|36)\b/.test(className)) return 'xl'
  return 'sm'
}

function TrustIcon3D({ name, className = '' }) {
  const mapped = NAME_MAP[name] || name
  const size = guessSize(className)
  return <Icon3D name={mapped} size={size} className={className} animate />
}

export default TrustIcon3D
