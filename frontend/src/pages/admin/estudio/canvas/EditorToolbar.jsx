// Barra lateral izquierda del editor Konva con herramientas.
import {
  MousePointer2, Type, ImagePlus, Square, Circle, Star,
  Smile, Frame, LayoutGrid, LayoutTemplate, Minus
} from 'lucide-react'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Seleccionar', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'Texto', shortcut: 'T' },
  { id: 'image', icon: ImagePlus, label: 'Imagen', shortcut: 'I' },
  { divider: true },
  { id: 'rect', icon: Square, label: 'Rectángulo' },
  { id: 'circle', icon: Circle, label: 'Círculo' },
  { id: 'star', icon: Star, label: 'Estrella' },
  { id: 'line', icon: Minus, label: 'Línea' },
  { divider: true },
  { id: 'stickers', icon: Smile, label: 'Stickers', disabled: false },
  { id: 'frames', icon: Frame, label: 'Marcos', disabled: false },
  { id: 'collage', icon: LayoutGrid, label: 'Collage', disabled: false },
  { id: 'templates', icon: LayoutTemplate, label: 'Plantillas', disabled: false },
]

function EditorToolbar({ activeTool, onToolChange }) {
  return (
    <div className="w-14 bg-charcoal rounded-xl flex flex-col items-center py-2 gap-0.5 flex-shrink-0">
      {TOOLS.map((tool, i) => {
        if (tool.divider) return <div key={i} className="w-8 h-px bg-white/10 my-1" />
        const Icon = tool.icon
        const active = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => !tool.disabled && onToolChange(tool.id)}
            disabled={tool.disabled}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${active ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}
              ${tool.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </div>
  )
}

export default EditorToolbar
