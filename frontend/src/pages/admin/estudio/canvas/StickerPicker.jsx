// Browser de stickers para el canvas Konva.
// Categorías: badges de venta, emojis food, decorativos.
// Los stickers son SVG data URLs generados en el cliente (sin assets externos).

import { useState } from 'react'

function makeSvgDataUrl(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// Badges de venta
const SALE_BADGES = [
  { name: 'Oferta', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect width="200" height="80" rx="12" fill="#E63946"/><text x="100" y="52" text-anchor="middle" font-family="Impact" font-size="40" fill="white">OFERTA</text></svg>` },
  { name: '-30%', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="75" fill="#F58220"/><text x="80" y="90" text-anchor="middle" font-family="Impact" font-size="52" fill="white">-30%</text></svg>` },
  { name: '-50%', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="75" fill="#E63946"/><text x="80" y="90" text-anchor="middle" font-family="Impact" font-size="52" fill="white">-50%</text></svg>` },
  { name: 'Nuevo', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 70"><rect width="180" height="70" rx="35" fill="#16A34A"/><text x="90" y="46" text-anchor="middle" font-family="Arial" font-size="32" font-weight="bold" fill="white">NUEVO</text></svg>` },
  { name: 'Gratis', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect width="200" height="80" rx="12" fill="#8B1F28"/><text x="100" y="52" text-anchor="middle" font-family="Impact" font-size="38" fill="#FFD800">¡GRATIS!</text></svg>` },
  { name: 'Domicilio', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70"><rect width="220" height="70" rx="12" fill="#16A34A"/><text x="110" y="46" text-anchor="middle" font-family="Arial" font-size="26" font-weight="bold" fill="white">🚚 DOMICILIO GRATIS</text></svg>` },
  { name: 'Premium', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 70"><rect width="200" height="70" rx="8" fill="#DAA520" stroke="#8B6914" stroke-width="3"/><text x="100" y="46" text-anchor="middle" font-family="Georgia" font-size="30" font-weight="bold" fill="white">★ PREMIUM</text></svg>` },
  { name: 'Hot', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="#FF4500"/><text x="60" y="50" text-anchor="middle" font-size="40">🔥</text><text x="60" y="85" text-anchor="middle" font-family="Impact" font-size="24" fill="white">HOT</text></svg>` },
]

// Emojis/iconos food
const FOOD_STICKERS = [
  { name: 'Carne', emoji: '🥩' },
  { name: 'Pollo', emoji: '🍗' },
  { name: 'Cerdo', emoji: '🐷' },
  { name: 'Huevo', emoji: '🥚' },
  { name: 'Fuego', emoji: '🔥' },
  { name: 'Chef', emoji: '👨‍🍳' },
  { name: 'Estrella', emoji: '⭐' },
  { name: 'Corona', emoji: '👑' },
  { name: 'Corazón', emoji: '❤️' },
  { name: 'Pulgar', emoji: '👍' },
  { name: 'Fiesta', emoji: '🎉' },
  { name: 'Medalla', emoji: '🏅' },
  { name: 'Cohete', emoji: '🚀' },
  { name: 'Dinero', emoji: '💰' },
  { name: 'WhatsApp', emoji: '📱' },
  { name: 'Ubicación', emoji: '📍' },
].map(s => ({
  ...s,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><text x="60" y="85" text-anchor="middle" font-size="80">${s.emoji}</text></svg>`
}))

// Formas decorativas
const DECO_STICKERS = [
  { name: 'Flecha →', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><path d="M10,40 L150,40 L130,15 M150,40 L130,65" stroke="#F58220" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { name: 'Círculo', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#F58220" stroke-width="6"/></svg>` },
  { name: 'Estrella', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><polygon points="60,5 75,45 118,45 83,70 95,110 60,85 25,110 37,70 2,45 45,45" fill="#FFD800"/></svg>` },
  { name: 'Rayo', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><polygon points="55,0 20,55 45,55 35,120 80,50 55,50" fill="#F58220"/></svg>` },
  { name: 'Cinta', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60"><path d="M0,0 L220,0 L240,30 L220,60 L0,60 L20,30 Z" fill="#8B1F28"/></svg>` },
  { name: 'Check', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="#16A34A"/><path d="M35,60 L52,77 L85,44" stroke="white" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
]

const CATEGORIES = [
  { id: 'badges', label: 'Badges', items: SALE_BADGES },
  { id: 'food', label: 'Food & Emojis', items: FOOD_STICKERS },
  { id: 'deco', label: 'Decorativos', items: DECO_STICKERS },
]

function StickerPicker({ onSelect }) {
  const [activeCategory, setActiveCategory] = useState('badges')
  const category = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Stickers</h4>

      {/* Category tabs */}
      <div className="flex gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-[10px] px-2 py-1 rounded-full transition ${
              activeCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {category?.items.map((sticker, i) => (
          <button
            key={sticker.name + i}
            onClick={() => onSelect(makeSvgDataUrl(sticker.svg), sticker.name)}
            className="p-1 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
            title={sticker.name}
          >
            <img
              src={makeSvgDataUrl(sticker.svg)}
              alt={sticker.name}
              className="w-full aspect-square object-contain"
            />
            <p className="text-[8px] text-center text-gray-500 truncate">{sticker.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default StickerPicker
