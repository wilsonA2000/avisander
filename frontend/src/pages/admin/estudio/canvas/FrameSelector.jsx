// Selector de marcos decorativos para el canvas.
// Los marcos se renderizan como SVG inline sobre el canvas Konva.

const FRAMES = [
  {
    id: 'none',
    name: 'Sin marco',
    border: null
  },
  {
    id: 'thin-black',
    name: 'Línea negra',
    border: { stroke: '#000000', strokeWidth: 4, cornerRadius: 0 }
  },
  {
    id: 'thin-white',
    name: 'Línea blanca',
    border: { stroke: '#FFFFFF', strokeWidth: 6, cornerRadius: 0 }
  },
  {
    id: 'thick-gold',
    name: 'Dorado grueso',
    border: { stroke: '#DAA520', strokeWidth: 12, cornerRadius: 0 }
  },
  {
    id: 'rounded-white',
    name: 'Redondeado blanco',
    border: { stroke: '#FFFFFF', strokeWidth: 8, cornerRadius: 20 }
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    border: { stroke: '#FFFFFF', strokeWidth: 40, cornerRadius: 0, bottomExtra: 60 }
  },
  {
    id: 'double-line',
    name: 'Doble línea',
    border: { stroke: '#333333', strokeWidth: 3, cornerRadius: 0, gap: 6, double: true }
  },
  {
    id: 'neon-orange',
    name: 'Neon naranja',
    border: { stroke: '#F58220', strokeWidth: 6, cornerRadius: 8, shadow: { color: '#F58220', blur: 20 } }
  },
  {
    id: 'neon-green',
    name: 'Neon verde',
    border: { stroke: '#39FF14', strokeWidth: 4, cornerRadius: 8, shadow: { color: '#39FF14', blur: 20 } }
  },
  {
    id: 'avisander',
    name: 'Avisander Brand',
    border: { stroke: '#8B1F28', strokeWidth: 8, cornerRadius: 0, accent: '#F58220' }
  },
  {
    id: 'shadow-box',
    name: 'Sombra profunda',
    border: { stroke: '#FFFFFF', strokeWidth: 10, cornerRadius: 4, shadow: { color: '#000000', blur: 30, offsetX: 8, offsetY: 8 } }
  },
  {
    id: 'vintage',
    name: 'Vintage',
    border: { stroke: '#8B7355', strokeWidth: 14, cornerRadius: 0 }
  },
]

function FrameSelector({ onSelect, activeFrameId }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Marcos</h4>
      <div className="grid grid-cols-3 gap-1.5">
        {FRAMES.map(frame => (
          <button
            key={frame.id}
            onClick={() => onSelect(frame)}
            className={`p-1.5 rounded-lg border-2 transition ${
              activeFrameId === frame.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="aspect-square rounded bg-gray-100 flex items-center justify-center relative overflow-hidden">
              {frame.border ? (
                <div
                  className="w-full h-full"
                  style={{
                    border: `${Math.min(frame.border.strokeWidth, 6)}px solid ${frame.border.stroke}`,
                    borderRadius: frame.border.cornerRadius || 0,
                    boxShadow: frame.border.shadow ? `${frame.border.shadow.offsetX || 0}px ${frame.border.shadow.offsetY || 0}px ${frame.border.shadow.blur}px ${frame.border.shadow.color}` : 'none'
                  }}
                />
              ) : (
                <span className="text-[9px] text-gray-400">Ninguno</span>
              )}
            </div>
            <p className="text-[9px] text-center text-gray-600 mt-0.5 truncate">{frame.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { FRAMES }
export default FrameSelector
