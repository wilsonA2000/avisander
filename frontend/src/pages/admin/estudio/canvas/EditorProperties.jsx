// Panel derecho de propiedades del elemento seleccionado en el canvas Konva.
import { useState } from 'react'
import { Trash2, Copy, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import TextEffects from './TextEffects'
import FrameSelector from './FrameSelector'

const BRAND_COLORS = ['#F58220', '#8B1F28', '#C79B5B', '#FFD800', '#0A0A0A', '#FFFAF3', '#FFFFFF', '#16A34A']
const FONTS = ['Inter', 'Playfair Display', 'Manrope', 'Arial', 'Georgia', 'Impact', 'Courier New']

function ColorSwatches({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 mb-1">
      {BRAND_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-md border-2 transition ${value === c ? 'border-primary scale-110' : 'border-gray-300'}`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded-md cursor-pointer border-0 p-0" />
    </div>
  )
}

function EditorProperties({ selectedElement, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, canvasSize, onCanvasSizeChange, activeFrame, onFrameChange }) {
  if (!selectedElement) {
    // Sin selección: propiedades del canvas
    return (
      <div className="w-64 bg-white rounded-xl shadow-sm p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)] flex-shrink-0">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Canvas</h4>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Tamaño</label>
          <select
            className="input text-xs"
            value={`${canvasSize.width}x${canvasSize.height}`}
            onChange={e => {
              const [w, h] = e.target.value.split('x').map(Number)
              onCanvasSizeChange({ width: w, height: h })
            }}
          >
            <option value="1080x1080">Instagram Post (1080×1080)</option>
            <option value="1080x1920">Story / Reel (1080×1920)</option>
            <option value="1200x630">Facebook Post (1200×630)</option>
            <option value="820x312">Facebook Cover (820×312)</option>
            <option value="1280x720">YouTube Thumbnail (1280×720)</option>
            <option value="800x800">Producto (800×800)</option>
            <option value="1200x400">Banner Promo (1200×400)</option>
          </select>
        </div>
        <FrameSelector onSelect={onFrameChange} activeFrameId={activeFrame?.id || 'none'} />

        <p className="text-[10px] text-gray-400 mt-4">Selecciona un elemento en el canvas para ver sus propiedades.</p>
      </div>
    )
  }

  const el = selectedElement
  const update = (key, val) => onUpdate(el.id, { ...el.attrs, [key]: val })

  return (
    <div className="w-64 bg-white rounded-xl shadow-sm p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] flex-shrink-0">
      {/* Acciones rápidas */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {el.type === 'text' ? 'Texto' : el.type === 'image' ? 'Imagen' : 'Forma'}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onMoveUp(el.id)} className="p-1 text-gray-400 hover:text-charcoal" title="Subir capa"><ChevronUp size={14} /></button>
          <button onClick={() => onMoveDown(el.id)} className="p-1 text-gray-400 hover:text-charcoal" title="Bajar capa"><ChevronDown size={14} /></button>
          <button onClick={() => onDuplicate(el.id)} className="p-1 text-gray-400 hover:text-primary" title="Duplicar"><Copy size={14} /></button>
          <button onClick={() => onDelete(el.id)} className="p-1 text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Texto */}
      {el.type === 'text' && (
        <>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Fuente</label>
            <select className="input text-xs" value={el.attrs.fontFamily || 'Inter'} onChange={e => update('fontFamily', e.target.value)}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Tamaño</label>
              <input type="number" min={8} max={200} value={el.attrs.fontSize || 36} onChange={e => update('fontSize', Number(e.target.value))} className="input text-xs" />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Estilo</label>
              <div className="flex gap-1">
                <button onClick={() => update('fontStyle', el.attrs.fontStyle === 'bold' ? 'normal' : 'bold')}
                  className={`px-2 py-1 text-xs rounded ${el.attrs.fontStyle === 'bold' ? 'bg-primary text-white' : 'bg-gray-100'}`}>B</button>
                <button onClick={() => update('fontStyle', el.attrs.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`px-2 py-1 text-xs rounded italic ${el.attrs.fontStyle === 'italic' ? 'bg-primary text-white' : 'bg-gray-100'}`}>I</button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Color</label>
            <ColorSwatches value={el.attrs.fill} onChange={v => update('fill', v)} />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Contorno</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="color" value={el.attrs.stroke || '#000000'} onChange={e => update('stroke', e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              <input type="number" min={0} max={20} value={el.attrs.strokeWidth || 0} onChange={e => update('strokeWidth', Number(e.target.value))} className="input text-xs" placeholder="Grosor" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Sombra</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="color" value={el.attrs.shadowColor || '#000000'} onChange={e => update('shadowColor', e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              <input type="range" min={0} max={30} value={el.attrs.shadowBlur || 0} onChange={e => update('shadowBlur', Number(e.target.value))} />
            </div>
          </div>

          {/* WordArt presets */}
          <TextEffects onApply={(presetAttrs) => {
            onUpdate(el.id, { ...el.attrs, ...presetAttrs })
          }} />
        </>
      )}

      {/* Imagen */}
      {el.type === 'image' && (
        <>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Opacidad</label>
            <input type="range" min={0} max={1} step={0.05} value={el.attrs.opacity ?? 1} onChange={e => update('opacity', Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Redondeo</label>
            <input type="range" min={0} max={200} value={el.attrs.cornerRadius || 0} onChange={e => update('cornerRadius', Number(e.target.value))} className="w-full" />
          </div>
        </>
      )}

      {/* Forma */}
      {(el.type === 'rect' || el.type === 'circle' || el.type === 'star') && (
        <>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Relleno</label>
            <ColorSwatches value={el.attrs.fill} onChange={v => update('fill', v)} />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Borde</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="color" value={el.attrs.stroke || '#000000'} onChange={e => update('stroke', e.target.value)} className="w-full h-8 rounded cursor-pointer" />
              <input type="number" min={0} max={20} value={el.attrs.strokeWidth || 0} onChange={e => update('strokeWidth', Number(e.target.value))} className="input text-xs" />
            </div>
          </div>
        </>
      )}

      {/* Opacidad general */}
      <div>
        <label className="text-[11px] text-gray-500 block mb-1">Opacidad: {Math.round((el.attrs.opacity ?? 1) * 100)}%</label>
        <input type="range" min={0} max={1} step={0.05} value={el.attrs.opacity ?? 1} onChange={e => update('opacity', Number(e.target.value))} className="w-full" />
      </div>
    </div>
  )
}

export default EditorProperties
