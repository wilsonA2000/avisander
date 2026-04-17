// Editor de canvas Konva — modo "Diseño Creativo" del Estudio Multimedia.
// Stage con capas, texto, imágenes, formas, transformer y export PNG.

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Star, Line, Text, Image, Transformer, Group } from 'react-konva'
import useImage from 'use-image'
import { Download, Save, Undo2, Redo2, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import EditorToolbar from './EditorToolbar'
import EditorProperties from './EditorProperties'
import CollageLayouts, { LAYOUTS } from './CollageLayouts'
import StickerPicker from './StickerPicker'
import { TEMPLATES, getTemplatesByCategory } from './templates/index'
import useCanvasHistory from './useCanvasHistory'

let nextId = 1
const genId = () => `el-${nextId++}`

// Componente para renderizar imagen desde URL en Konva
function KonvaImage({ src, ...props }) {
  const [img] = useImage(src, 'anonymous')
  if (!img) return null
  return <Image image={img} {...props} />
}

// Escala el stage para que quepa en el viewport
function fitScale(canvasW, canvasH, containerW, containerH) {
  const scaleX = containerW / canvasW
  const scaleY = containerH / canvasH
  return Math.min(scaleX, scaleY, 1) * 0.9
}

function KonvaEditor({ initialImage, onSave, onClose, onPickImage }) {
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const containerRef = useRef(null)

  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 })
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [activeTool, setActiveTool] = useState('select')
  const [zoom, setZoom] = useState(1)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [saving, setSaving] = useState(false)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [activeFrame, setActiveFrame] = useState(null)
  const [sidePanel, setSidePanel] = useState(null) // 'collage' | 'templates' | null
  const [activeCollage, setActiveCollage] = useState(null)

  const history = useCanvasHistory([])

  // Medir container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: r.width, height: r.height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Calcular escala para que el canvas quepa
  const scale = fitScale(canvasSize.width, canvasSize.height, containerSize.width, containerSize.height) * zoom

  // Cargar imagen inicial como fondo
  useEffect(() => {
    if (initialImage) {
      setElements([{
        id: genId(),
        type: 'image',
        attrs: { src: initialImage, x: 0, y: 0, width: canvasSize.width, height: canvasSize.height, draggable: true }
      }])
    }
  }, [initialImage])

  // Sync transformer con selección
  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    if (selectedId) {
      const node = stage.findOne('#' + selectedId)
      if (node) { tr.nodes([node]); tr.getLayer().batchDraw() }
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId, elements])

  const pushHistory = useCallback((els) => { history.push(els) }, [history])

  const updateElement = useCallback((id, newAttrs) => {
    setElements(prev => {
      const next = prev.map(el => el.id === id ? { ...el, attrs: newAttrs } : el)
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  const deleteElement = useCallback((id) => {
    setElements(prev => {
      const next = prev.filter(el => el.id !== id)
      pushHistory(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
  }, [selectedId, pushHistory])

  const duplicateElement = useCallback((id) => {
    setElements(prev => {
      const el = prev.find(e => e.id === id)
      if (!el) return prev
      const newEl = { ...el, id: genId(), attrs: { ...el.attrs, x: (el.attrs.x || 0) + 20, y: (el.attrs.y || 0) + 20 } }
      const next = [...prev, newEl]
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  const moveElement = useCallback((id, dir) => {
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swapIdx = dir === 'up' ? idx + 1 : idx - 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }, [])

  // Agregar elementos
  const addText = useCallback(() => {
    const el = {
      id: genId(),
      type: 'text',
      attrs: {
        text: 'Tu texto aquí', x: canvasSize.width / 2 - 100, y: canvasSize.height / 2 - 20,
        fontSize: 48, fontFamily: 'Inter', fill: '#F58220',
        draggable: true, fontStyle: 'bold'
      }
    }
    setElements(prev => { const n = [...prev, el]; pushHistory(n); return n })
    setSelectedId(el.id)
    setActiveTool('select')
  }, [canvasSize, pushHistory])

  const addShape = useCallback((type) => {
    const cx = canvasSize.width / 2
    const cy = canvasSize.height / 2
    let attrs = { x: cx - 50, y: cy - 50, fill: '#F58220', stroke: '#8B1F28', strokeWidth: 2, draggable: true, opacity: 0.8 }
    if (type === 'rect') Object.assign(attrs, { width: 150, height: 100 })
    else if (type === 'circle') Object.assign(attrs, { x: cx, y: cy, radius: 60 })
    else if (type === 'star') Object.assign(attrs, { x: cx, y: cy, numPoints: 5, innerRadius: 30, outerRadius: 60 })
    else if (type === 'line') Object.assign(attrs, { points: [0, 0, 200, 0], x: cx - 100, y: cy, stroke: '#F58220', strokeWidth: 4, fill: undefined })
    const el = { id: genId(), type, attrs }
    setElements(prev => { const n = [...prev, el]; pushHistory(n); return n })
    setSelectedId(el.id)
    setActiveTool('select')
  }, [canvasSize, pushHistory])

  const addImage = useCallback((src) => {
    const el = {
      id: genId(),
      type: 'image',
      attrs: { src, x: 100, y: 100, width: 300, height: 300, draggable: true }
    }
    setElements(prev => { const n = [...prev, el]; pushHistory(n); return n })
    setSelectedId(el.id)
    setActiveTool('select')
  }, [pushHistory])

  // Aplicar plantilla
  const applyTemplate = useCallback((template) => {
    setCanvasSize(template.canvasSize)
    setBgColor(template.bgColor || '#FFFFFF')
    const newElements = template.elements.map(el => ({
      id: genId(),
      type: el.type,
      attrs: { ...el.attrs }
    }))
    setElements(newElements)
    pushHistory(newElements)
    setSidePanel(null)
    setActiveTool('select')
  }, [pushHistory])

  // Aplicar collage
  const applyCollage = useCallback((layout) => {
    setActiveCollage(layout)
    // Crear rectángulos placeholder para cada celda
    const newElements = layout.cells.map((cell, i) => ({
      id: genId(),
      type: 'rect',
      attrs: {
        x: cell.x * canvasSize.width,
        y: cell.y * canvasSize.height,
        width: cell.w * canvasSize.width,
        height: cell.h * canvasSize.height,
        fill: i % 2 === 0 ? '#F5F0EB' : '#E8E0D8',
        stroke: '#CCCCCC',
        strokeWidth: 1,
        draggable: false
      }
    }))
    setElements(newElements)
    pushHistory(newElements)
    setSidePanel(null)
    setActiveTool('select')
  }, [canvasSize, pushHistory])

  // Handle tool change
  const handleToolChange = useCallback((tool) => {
    setActiveTool(tool)
    setSidePanel(null)
    if (tool === 'text') addText()
    else if (['rect', 'circle', 'star', 'line'].includes(tool)) addShape(tool)
    else if (tool === 'image' && onPickImage) onPickImage((url) => addImage(url))
    else if (tool === 'collage') setSidePanel('collage')
    else if (tool === 'templates') setSidePanel('templates')
    else if (tool === 'stickers') setSidePanel('stickers')
    else if (tool === 'frames') setSidePanel(null) // frames are in right panel
  }, [addText, addShape, addImage, onPickImage])

  // Click en stage: deseleccionar o seleccionar
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      setSelectedId(null)
    }
  }

  // Drag end: actualizar posición
  const handleDragEnd = (id, e) => {
    const node = e.target
    updateElement(id, { ...elements.find(el => el.id === id)?.attrs, x: node.x(), y: node.y() })
  }

  // Transform end: actualizar tamaño/rotación
  const handleTransformEnd = (id, e) => {
    const node = e.target
    const el = elements.find(el => el.id === id)
    if (!el) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const newAttrs = {
      ...el.attrs,
      x: node.x(), y: node.y(),
      rotation: node.rotation(),
      width: Math.max(5, (el.attrs.width || node.width()) * scaleX),
      height: Math.max(5, (el.attrs.height || node.height()) * scaleY),
    }
    if (el.type === 'text') {
      newAttrs.fontSize = Math.max(8, (el.attrs.fontSize || 36) * scaleX)
      delete newAttrs.width
      delete newAttrs.height
    }
    if (el.type === 'circle') {
      newAttrs.radius = Math.max(5, (el.attrs.radius || 50) * scaleX)
    }
    updateElement(id, newAttrs)
  }

  // Double click text: edit inline
  const handleTextDblClick = (id, e) => {
    const el = elements.find(el => el.id === id)
    if (!el) return
    const textNode = e.target
    const stage = stageRef.current
    const stageBox = stage.container().getBoundingClientRect()
    const textPos = textNode.absolutePosition()
    const areaPos = { x: stageBox.left + textPos.x * scale, y: stageBox.top + textPos.y * scale }

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.value = el.attrs.text
    textarea.style.cssText = `
      position:fixed; left:${areaPos.x}px; top:${areaPos.y}px;
      font-size:${(el.attrs.fontSize || 36) * scale}px; font-family:${el.attrs.fontFamily || 'Inter'};
      color:${el.attrs.fill || '#000'}; border:2px solid #F58220; border-radius:4px;
      padding:4px; margin:0; overflow:hidden; background:rgba(255,255,255,0.95);
      min-width:100px; min-height:40px; resize:none; outline:none; z-index:9999;
    `
    textarea.focus()
    textarea.addEventListener('blur', () => {
      updateElement(id, { ...el.attrs, text: textarea.value })
      textarea.remove()
    })
    textarea.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' || (ev.key === 'Enter' && !ev.shiftKey)) { textarea.blur() }
    })
  }

  // Undo/redo
  const handleUndo = () => { const r = history.undo(); if (r) setElements(r) }
  const handleRedo = () => { const r = history.redo(); if (r) setElements(r) }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { deleteElement(selectedId); e.preventDefault() }
      if (e.ctrlKey && e.key === 'z') { handleUndo(); e.preventDefault() }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { handleRedo(); e.preventDefault() }
      if (e.ctrlKey && e.key === 'd' && selectedId) { duplicateElement(selectedId); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, deleteElement, duplicateElement])

  // Export
  const handleExport = async () => {
    setSaving(true)
    try {
      setSelectedId(null)
      await new Promise(r => setTimeout(r, 100)) // let transformer hide
      const stage = stageRef.current
      const uri = stage.toDataURL({ pixelRatio: 2, x: 0, y: 0, width: canvasSize.width, height: canvasSize.height })
      const resp = await fetch(uri)
      const blob = await resp.blob()
      onSave(blob)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setSaving(false)
    }
  }

  const selectedElement = elements.find(el => el.id === selectedId)

  // Offset para centrar el canvas en el container
  const offsetX = (containerSize.width - canvasSize.width * scale) / 2
  const offsetY = (containerSize.height - canvasSize.height * scale) / 2

  return (
    <div className="flex gap-3 h-full">
      {/* Toolbar izquierda */}
      <EditorToolbar activeTool={activeTool} onToolChange={handleToolChange} />

      {/* Side panel (collage/templates) */}
      {sidePanel && (
        <div className="w-56 bg-white rounded-xl shadow-sm p-3 overflow-y-auto max-h-[calc(100vh-300px)] flex-shrink-0">
          {sidePanel === 'collage' && (
            <CollageLayouts onSelect={applyCollage} activeLayoutId={activeCollage?.id} />
          )}
          {sidePanel === 'stickers' && (
            <StickerPicker onSelect={(src, name) => { addImage(src); setSidePanel(null) }} />
          )}
          {sidePanel === 'templates' && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Plantillas</h4>
              {Object.entries(getTemplatesByCategory()).map(([cat, templates]) => (
                <div key={cat}>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">{cat}</p>
                  <div className="space-y-1">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
                      >
                        <div className="h-8 rounded" style={{ backgroundColor: t.bgColor || '#eee' }} />
                        <p className="text-[10px] text-charcoal font-medium mt-1">{t.name}</p>
                        <p className="text-[9px] text-gray-400">{t.canvasSize.width}×{t.canvasSize.height}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Canvas central */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={handleUndo} disabled={!history.canUndo} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30" title="Deshacer (Ctrl+Z)"><Undo2 size={16} /></button>
            <button onClick={handleRedo} disabled={!history.canRedo} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30" title="Rehacer (Ctrl+Y)"><Redo2 size={16} /></button>
            <span className="text-[10px] text-gray-400 ml-2">{canvasSize.width}×{canvasSize.height} · {Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 rounded hover:bg-gray-100"><ZoomOut size={16} /></button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 rounded hover:bg-gray-100"><ZoomIn size={16} /></button>
            <button onClick={handleExport} disabled={saving} className="btn-primary text-xs inline-flex items-center gap-1 px-3 py-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
            <button onClick={handleExport} disabled={saving} className="text-xs inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-cream">
              <Download size={14} /> PNG
            </button>
          </div>
        </div>

        {/* Stage container */}
        <div
          ref={containerRef}
          className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative"
          style={{ backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            onClick={handleStageClick}
            onTap={handleStageClick}
            scaleX={scale}
            scaleY={scale}
            x={offsetX}
            y={offsetY}
          >
            {/* Background */}
            <Layer>
              <Rect name="bg" x={0} y={0} width={canvasSize.width} height={canvasSize.height} fill={bgColor} listening={true} />
            </Layer>

            {/* Elements */}
            <Layer>
              {elements.map(el => {
                const commonProps = {
                  key: el.id,
                  id: el.id,
                  ...el.attrs,
                  onClick: () => setSelectedId(el.id),
                  onTap: () => setSelectedId(el.id),
                  onDragEnd: (e) => handleDragEnd(el.id, e),
                  onTransformEnd: (e) => handleTransformEnd(el.id, e),
                }
                switch (el.type) {
                  case 'text':
                    return <Text {...commonProps} onDblClick={(e) => handleTextDblClick(el.id, e)} onDblTap={(e) => handleTextDblClick(el.id, e)} />
                  case 'image':
                    return <KonvaImage {...commonProps} src={el.attrs.src} />
                  case 'rect':
                    return <Rect {...commonProps} />
                  case 'circle':
                    return <Circle {...commonProps} />
                  case 'star':
                    return <Star {...commonProps} />
                  case 'line':
                    return <Line {...commonProps} />
                  default:
                    return null
                }
              })}
              {/* Marco decorativo */}
              {activeFrame?.border && (
                <Rect
                  x={0} y={0}
                  width={canvasSize.width} height={canvasSize.height}
                  stroke={activeFrame.border.stroke}
                  strokeWidth={activeFrame.border.strokeWidth}
                  cornerRadius={activeFrame.border.cornerRadius || 0}
                  fill="transparent"
                  listening={false}
                  shadowColor={activeFrame.border.shadow?.color}
                  shadowBlur={activeFrame.border.shadow?.blur || 0}
                  shadowOffsetX={activeFrame.border.shadow?.offsetX || 0}
                  shadowOffsetY={activeFrame.border.shadow?.offsetY || 0}
                />
              )}
              <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox
                return newBox
              }} />
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Properties panel */}
      <EditorProperties
        selectedElement={selectedElement}
        onUpdate={updateElement}
        onDelete={deleteElement}
        onDuplicate={duplicateElement}
        onMoveUp={(id) => moveElement(id, 'up')}
        onMoveDown={(id) => moveElement(id, 'down')}
        canvasSize={canvasSize}
        onCanvasSizeChange={setCanvasSize}
        activeFrame={activeFrame}
        onFrameChange={setActiveFrame}
      />
    </div>
  )
}

export default KonvaEditor
