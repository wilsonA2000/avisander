// Layouts de collage predefinidos.
// Cada layout define celdas con posición relativa (0-1).

const LAYOUTS = [
  { id: '2v', name: '2 Vertical', icon: '▌▐', cells: [
    { x: 0, y: 0, w: 0.49, h: 1 },
    { x: 0.51, y: 0, w: 0.49, h: 1 }
  ]},
  { id: '2h', name: '2 Horizontal', icon: '▀▄', cells: [
    { x: 0, y: 0, w: 1, h: 0.49 },
    { x: 0, y: 0.51, w: 1, h: 0.49 }
  ]},
  { id: '3col', name: '3 Columnas', icon: '|||', cells: [
    { x: 0, y: 0, w: 0.32, h: 1 },
    { x: 0.34, y: 0, w: 0.32, h: 1 },
    { x: 0.68, y: 0, w: 0.32, h: 1 }
  ]},
  { id: '1-2', name: '1 + 2', icon: '▌▀▄', cells: [
    { x: 0, y: 0, w: 0.49, h: 1 },
    { x: 0.51, y: 0, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0.51, w: 0.49, h: 0.49 }
  ]},
  { id: '2x2', name: '2×2 Grid', icon: '▚', cells: [
    { x: 0, y: 0, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0, w: 0.49, h: 0.49 },
    { x: 0, y: 0.51, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0.51, w: 0.49, h: 0.49 }
  ]},
  { id: '2-1', name: '2 + 1', icon: '▀▀▄', cells: [
    { x: 0, y: 0, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0, w: 0.49, h: 0.49 },
    { x: 0, y: 0.51, w: 1, h: 0.49 }
  ]},
  { id: 'l-shape', name: 'L Grande', icon: '▌▄', cells: [
    { x: 0, y: 0, w: 0.65, h: 1 },
    { x: 0.67, y: 0, w: 0.33, h: 0.49 },
    { x: 0.67, y: 0.51, w: 0.33, h: 0.49 }
  ]},
  { id: '3row', name: '3 Filas', icon: '≡', cells: [
    { x: 0, y: 0, w: 1, h: 0.32 },
    { x: 0, y: 0.34, w: 1, h: 0.32 },
    { x: 0, y: 0.68, w: 1, h: 0.32 }
  ]},
]

function CollageLayouts({ onSelect, activeLayoutId }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Collage</h4>
      <div className="grid grid-cols-4 gap-1.5">
        {LAYOUTS.map(layout => (
          <button
            key={layout.id}
            onClick={() => onSelect(layout)}
            className={`p-1.5 rounded-lg border-2 transition ${
              activeLayoutId === layout.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/50'
            }`}
            title={layout.name}
          >
            <div className="aspect-square bg-gray-50 rounded relative overflow-hidden">
              {layout.cells.map((cell, i) => (
                <div
                  key={i}
                  className="absolute bg-primary/20 border border-primary/30"
                  style={{
                    left: `${cell.x * 100}%`,
                    top: `${cell.y * 100}%`,
                    width: `${cell.w * 100}%`,
                    height: `${cell.h * 100}%`
                  }}
                />
              ))}
            </div>
            <p className="text-[8px] text-center text-gray-500 mt-0.5">{layout.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { LAYOUTS }
export default CollageLayouts
