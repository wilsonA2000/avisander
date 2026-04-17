// Presets de WordArt para texto en el canvas Konva.
// Cada preset aplica gradiente, sombra, contorno y opcionalmente curvatura.

const WORDART_PRESETS = [
  {
    name: 'Avisander',
    preview: 'linear-gradient(135deg, #F58220, #C79B5B)',
    attrs: { fill: '#F58220', stroke: '#8B1F28', strokeWidth: 3, shadowColor: '#000', shadowBlur: 8, shadowOffsetX: 2, shadowOffsetY: 2, fontFamily: 'Playfair Display', fontStyle: 'bold' }
  },
  {
    name: 'Fuego',
    preview: 'linear-gradient(135deg, #FF6B00, #FFD800)',
    attrs: { fill: '#FF6B00', stroke: '#8B0000', strokeWidth: 2, shadowColor: '#FF4500', shadowBlur: 15, fontStyle: 'bold' }
  },
  {
    name: 'Hielo',
    preview: 'linear-gradient(135deg, #00BFFF, #E0F7FA)',
    attrs: { fill: '#00BFFF', stroke: '#005580', strokeWidth: 1, shadowColor: '#87CEEB', shadowBlur: 12, fontStyle: 'bold' }
  },
  {
    name: 'Dorado',
    preview: 'linear-gradient(135deg, #FFD700, #8B6914)',
    attrs: { fill: '#DAA520', stroke: '#8B6914', strokeWidth: 2, shadowColor: '#000', shadowBlur: 4, fontFamily: 'Playfair Display', fontStyle: 'bold' }
  },
  {
    name: 'Neon Verde',
    preview: 'linear-gradient(135deg, #39FF14, #00FF41)',
    attrs: { fill: '#39FF14', stroke: '#39FF14', strokeWidth: 0, shadowColor: '#39FF14', shadowBlur: 25, fontStyle: 'bold' }
  },
  {
    name: 'Neon Rosa',
    preview: 'linear-gradient(135deg, #FF1493, #FF69B4)',
    attrs: { fill: '#FF1493', stroke: '#FF1493', strokeWidth: 0, shadowColor: '#FF1493', shadowBlur: 25, fontStyle: 'bold' }
  },
  {
    name: 'Elegante',
    preview: 'linear-gradient(135deg, #1A1A1A, #333)',
    attrs: { fill: '#1A1A1A', stroke: '#C79B5B', strokeWidth: 2, shadowColor: '#000', shadowBlur: 3, fontFamily: 'Playfair Display', fontStyle: 'italic' }
  },
  {
    name: 'Promo',
    preview: 'linear-gradient(135deg, #E63946, #FF6B6B)',
    attrs: { fill: '#FFFFFF', stroke: '#E63946', strokeWidth: 4, shadowColor: '#E63946', shadowBlur: 10, fontStyle: 'bold' }
  },
  {
    name: 'Retro',
    preview: 'linear-gradient(135deg, #F4A460, #DEB887)',
    attrs: { fill: '#8B4513', stroke: '#DEB887', strokeWidth: 3, shadowColor: '#000', shadowBlur: 2, fontFamily: 'Georgia', fontStyle: 'bold' }
  },
  {
    name: 'Minimalista',
    preview: 'linear-gradient(135deg, #666, #999)',
    attrs: { fill: '#333333', stroke: 'transparent', strokeWidth: 0, shadowColor: 'transparent', shadowBlur: 0, fontFamily: 'Inter', fontStyle: 'normal' }
  },
  {
    name: 'Sombra Dura',
    preview: 'linear-gradient(135deg, #000, #333)',
    attrs: { fill: '#FFFFFF', stroke: '#000000', strokeWidth: 1, shadowColor: '#000000', shadowBlur: 0, shadowOffsetX: 4, shadowOffsetY: 4, fontStyle: 'bold' }
  },
  {
    name: 'Carnicero',
    preview: 'linear-gradient(135deg, #8B1F28, #D32F2F)',
    attrs: { fill: '#FFFFFF', stroke: '#8B1F28', strokeWidth: 3, shadowColor: '#8B1F28', shadowBlur: 12, fontFamily: 'Impact', fontStyle: 'normal' }
  },
]

function TextEffects({ onApply }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Efectos de Texto</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {WORDART_PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => onApply(preset.attrs)}
            className="text-left p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
          >
            <div
              className="h-6 rounded-md mb-1 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: preset.preview }}
            >
              {preset.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { WORDART_PRESETS }
export default TextEffects
