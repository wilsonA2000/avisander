// Tab Editor de Imagen — editor completo con react-filerobot-image-editor.
// Soporta: crop, resize, filtros, texto, dibujo, anotaciones.
// La imagen editada se guarda en backend/media/ia/ via POST /api/ai/save-edited.

import { useState, useCallback } from 'react'
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
import { Upload, FolderOpen, History, X, ImagePlus, Save } from 'lucide-react'
import { api } from '../../../lib/apiClient'
import { useToast } from '../../../context/ToastContext'

function TabEditorImagen() {
  const toast = useToast()
  const [imageSrc, setImageSrc] = useState(null)
  const [imageName, setImageName] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [saving, setSaving] = useState(false)

  // Subir archivo desde disco
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setImageName(file.name)
    setShowEditor(true)
  }

  // Cargar desde URL (biblioteca o historial)
  const loadFromUrl = (url) => {
    setImageSrc(url)
    setImageName(url.split('/').pop() || 'imagen')
    setShowEditor(true)
  }

  // Guardar imagen editada al backend
  const handleSave = useCallback(async (editedImageObject) => {
    setSaving(true)
    try {
      // editedImageObject tiene: imageBase64, fullName, width, height, mimeType
      const { imageBase64, fullName, mimeType } = editedImageObject
      // Convertir base64 a blob
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

  // Pantalla de selección de imagen
  if (!showEditor) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
          <ImagePlus size={48} className="mx-auto text-primary/40 mb-4" />
          <h2 className="text-xl font-bold text-charcoal mb-2">Editor de Imagen</h2>
          <p className="text-gray-500 text-sm mb-6">
            Selecciona una imagen para editarla con crop, filtros, texto, dibujo y más.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Subir archivo */}
            <label className="btn-primary inline-flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              Subir imagen
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* URL directa */}
            <button
              onClick={() => {
                const url = prompt('Pega la URL de la imagen (ej: /media/ia/ai-xxx.webp o /uploads/xxx.jpg):')
                if (url) loadFromUrl(url)
              }}
              className="px-4 py-2 bg-white text-charcoal border border-gray-200 rounded-lg hover:bg-cream inline-flex items-center gap-2 text-sm transition"
            >
              <FolderOpen size={16} />
              Desde URL / Biblioteca
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-cream/50 rounded-xl p-4 max-w-2xl mx-auto text-sm text-gray-600">
          <p><strong>Tip:</strong> También puedes generar una imagen en el tab "Generar IA" y luego venir aquí a editarla. Copia la URL de la imagen generada y pégala con "Desde URL".</p>
        </div>
      </div>
    )
  }

  // Editor activo
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
          onSave={(editedImageObject) => handleSave(editedImageObject)}
          onClose={() => { setShowEditor(false); setImageSrc(null) }}
          annotationsCommon={{
            fill: '#8B1F28'
          }}
          Text={{
            text: 'Avisander',
            fontFamily: 'Inter',
            fontSize: 28,
            fill: '#8B1F28'
          }}
          tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE, TABS.RESIZE]}
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
            typography: {
              fontFamily: 'Inter, system-ui, sans-serif'
            }
          }}
        />
      </div>
    </div>
  )
}

export default TabEditorImagen
