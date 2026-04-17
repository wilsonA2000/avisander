// Tab Editor de Imagen — editor completo con react-filerobot-image-editor.
// Incluye browser de medios que carga desde la biblioteca, videos, IA, publicidad y upload.

import React, { useState, useCallback, useEffect } from 'react'
// Filerobot internamente usa React.createElement sin importar React (bug conocido).
// Exponemos React al scope global para que no crashee con "React is not defined".
if (typeof window !== 'undefined') window.React = React
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
import {
  Upload, FolderOpen, X, ImagePlus, Search, Loader2,
  Image as ImageIcon, Film, Sparkles, Megaphone, ChevronLeft,
  Zap, Palette
} from 'lucide-react'
import { api } from '../../../lib/apiClient'
import { useToast } from '../../../context/ToastContext'
import KonvaEditor from './canvas/KonvaEditor'

// Carpetas disponibles en backend/media/
const FOLDERS = [
  { id: 'biblioteca', label: 'Biblioteca', icon: ImageIcon, desc: '377 fotos de productos', apiType: 'image' },
  { id: 'videos', label: 'Videos (thumbnails)', icon: Film, desc: '104 videos', apiType: 'video' },
  { id: 'ia', label: 'Generadas con IA', icon: Sparkles, desc: 'Imágenes generadas', apiPath: '/api/ai/history' },
  { id: 'publicidad', label: 'Publicidad', icon: Megaphone, desc: 'Banners y piezas', folder: 'publicidad' },
]

function MediaBrowser({ onSelect }) {
  const [activeFolder, setActiveFolder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadFolder = useCallback(async (folder, pg = 1, q = '') => {
    setLoading(true)
    try {
      if (folder.apiPath) {
        // Historial IA
        const data = await api.get(folder.apiPath)
        const filtered = q
          ? data.filter(d => (d.prompt || d.kind || '').toLowerCase().includes(q.toLowerCase()))
          : data
        setItems(filtered.map(d => ({ url: d.local_url, name: d.prompt?.slice(0, 40) || d.kind || 'IA', type: 'image' })))
        setTotal(filtered.length)
      } else if (folder.folder) {
        // Carpeta directa (publicidad, etc.) — scan via API
        const data = await api.get(`/api/media?q=${encodeURIComponent(q)}&page=${pg}&per_page=60`)
        const filtered = (data.items || []).filter(i =>
          i.url.includes(`/media/${folder.folder}/`) && i.type === 'image'
        )
        setItems(filtered.map(i => ({ url: i.url, name: i.original_name || i.url.split('/').pop(), type: i.type })))
        setTotal(filtered.length)
      } else {
        // Biblioteca / videos via API media
        const params = new URLSearchParams({ page: pg, per_page: 60 })
        if (folder.apiType) params.set('type', folder.apiType)
        if (q) params.set('q', q)
        const data = await api.get(`/api/media?${params}`)
        setItems((data.items || []).map(i => ({ url: i.url, name: i.original_name || i.url.split('/').pop(), type: i.type })))
        setTotal(data.total || 0)
      }
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeFolder) loadFolder(activeFolder, page, searchQuery)
  }, [activeFolder, page, searchQuery, loadFolder])

  // Vista de carpetas
  if (!activeFolder) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-charcoal text-sm">Selecciona una carpeta</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {FOLDERS.map(f => {
            const Icon = f.icon
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f); setPage(1); setSearchQuery('') }}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-charcoal">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Vista de archivos dentro de carpeta
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveFolder(null)}
          className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Carpetas
        </button>
        <span className="text-sm font-semibold text-charcoal">{activeFolder.label}</span>
        <span className="text-xs text-gray-400">{total} archivos</span>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
          placeholder="Buscar por nombre..."
          className="input text-sm pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin resultados.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
            {items.filter(i => i.type === 'image' || i.type === 'video').map((item, idx) => (
              <button
                key={item.url + idx}
                onClick={() => onSelect(item.url, item.name)}
                className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition bg-gray-50 aspect-square"
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-charcoal/80">
                    <Film size={24} className="text-white/60" />
                  </div>
                ) : (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <p className="text-[9px] text-white truncate">{item.name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Paginación simple */}
          {total > 60 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1 rounded border disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500 py-1">Página {page}</span>
              <button
                disabled={items.length < 60}
                onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1 rounded border disabled:opacity-30"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TabEditorImagen() {
  const toast = useToast()
  const [imageSrc, setImageSrc] = useState(null)
  const [imageName, setImageName] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('rapida') // 'rapida' (Filerobot) | 'creativo' (Konva)
  const [pickImageCallback, setPickImageCallback] = useState(null) // para insertar imágenes en Konva

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageSrc(URL.createObjectURL(file))
    setImageName(file.name)
    setShowEditor(true)
  }

  const handleMediaSelect = (url, name) => {
    setImageSrc(url)
    setImageName(name || url.split('/').pop())
    setShowEditor(true)
  }

  // Save para Filerobot (recibe objeto con imageBase64)
  const handleSaveFilerobot = useCallback(async (editedImageObject) => {
    setSaving(true)
    try {
      const { imageBase64, fullName, mimeType } = editedImageObject
      const resp = await fetch(imageBase64)
      const blob = await resp.blob()
      const formData = new FormData()
      const ext = (mimeType || 'image/png').split('/')[1] || 'png'
      formData.append('image', blob, fullName || `editado.${ext}`)
      const result = await api.post('/api/ai/save-edited', formData)
      toast.success(`Imagen guardada: ${result.url}`)
    } catch (e) {
      toast.error(e.message || 'Error al guardar la imagen editada')
    } finally {
      setSaving(false)
    }
  }, [toast])

  // Save para KonvaEditor (recibe blob directo)
  const handleSaveKonva = useCallback(async (blob) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('image', blob, `diseno-${Date.now()}.png`)
      const result = await api.post('/api/ai/save-edited', formData)
      toast.success(`Diseño guardado: ${result.url}`)
    } catch (e) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [toast])

  // Pantalla de selección
  if (!showEditor) {
    return (
      <div className="space-y-6">
        {/* Header + upload */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Toggle de modo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMode('rapida')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'rapida' ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500 hover:text-charcoal'
                }`}
              >
                <Zap size={14} /> Edición Rápida
              </button>
              <button
                onClick={() => setMode('creativo')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'creativo' ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500 hover:text-charcoal'
                }`}
              >
                <Palette size={14} /> Diseño Creativo
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <ImagePlus size={20} className="text-primary" />
                {mode === 'rapida' ? 'Editor de Imagen' : 'Diseño Creativo'}
              </h2>
              <p className="text-sm text-gray-500">Selecciona una imagen de tu biblioteca o sube una nueva.</p>
            </div>
            <label className="btn-primary inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={14} />
              Subir imagen
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Browser de medios */}
          <MediaBrowser onSelect={handleMediaSelect} />
        </div>
      </div>
    )
  }

  // Editor activo — modo Rápida (Filerobot) o Creativo (Konva)
  if (mode === 'creativo') {
    return (
      <div className="space-y-3" style={{ height: 'calc(100vh - 240px)', minHeight: '550px' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Diseño Creativo {imageName && <>· <strong>{imageName}</strong></>}
          </p>
          <button
            onClick={() => { setShowEditor(false); setImageSrc(null) }}
            className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1"
          >
            <X size={14} /> Cerrar
          </button>
        </div>
        <div className="flex-1" style={{ height: 'calc(100% - 32px)' }}>
          <KonvaEditor
            initialImage={imageSrc}
            onSave={handleSaveKonva}
            onClose={() => { setShowEditor(false); setImageSrc(null) }}
            onPickImage={(callback) => {
              // Volver al browser para elegir imagen, luego callback(url)
              setPickImageCallback(() => callback)
              setShowEditor(false)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Editando: <strong>{imageName}</strong>
        </p>
        <button
          onClick={() => { setShowEditor(false); setImageSrc(null) }}
          className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1"
        >
          <X size={14} /> Cerrar editor
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"
        style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
      >
        <FilerobotImageEditor
          source={imageSrc}
          onSave={(editedImageObject) => handleSaveFilerobot(editedImageObject)}
          onClose={() => { setShowEditor(false); setImageSrc(null) }}
          annotationsCommon={{ fill: '#8B1F28' }}
          Text={{ text: 'Avisander', fontFamily: 'Inter', fontSize: 28, fill: '#8B1F28' }}
          tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE, TABS.WATERMARK]}
          defaultTabId={TABS.ADJUST}
          defaultToolId={TOOLS.CROP}
          savingPixelRatio={2}
          previewPixelRatio={2}
          showBackButton
          closeAfterSave={false}
          theme={{
            palette: {
              'bg-primary': '#1A1A1A',
              'bg-primary-active': '#8B1F28',
              'bg-secondary': '#F5F0EB',
              'accent-primary': '#F58220',
              'accent-primary-active': '#C79B5B',
              'icons-primary': '#FFFFFF',
              'icons-secondary': '#8B1F28',
              'borders-primary': '#E5E7EB',
              'borders-secondary': '#D1D5DB',
              'txt-primary': '#1A1A1A',
              'txt-secondary': '#6B7280',
              'txt-primary-invert': '#FFFFFF',
              'btn-primary-text': '#FFFFFF',
              warning: '#D97706',
              error: '#DC2626',
              success: '#16A34A'
            },
            typography: { fontFamily: 'Inter, system-ui, sans-serif' }
          }}
        />
      </div>
    </div>
  )
}

export default TabEditorImagen
