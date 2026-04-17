// Estudio Multimedia — container con tabs para generación AI, edición de imagen,
// edición de video y asistente de contenido.
// Cada tab se carga lazy para no inflar el bundle inicial.

import { useState, Suspense, lazy } from 'react'
import { Wand2, ImagePlus, Film, MessageSquareText, Loader2, MonitorPlay } from 'lucide-react'

const TabGenerar = lazy(() => import('./estudio/TabGenerar'))
const TabEditorImagen = lazy(() => import('./estudio/TabEditorImagen'))
const TabEditorVideo = lazy(() => import('./estudio/TabEditorVideo'))
const TabAsistenteAI = lazy(() => import('./estudio/TabAsistenteAI'))

const TABS = [
  { id: 'generar', label: 'Generar IA', icon: Wand2, description: 'Crea imágenes con FLUX' },
  { id: 'editor-imagen', label: 'Editor Imagen', icon: ImagePlus, description: 'Crop, filtros, texto' },
  { id: 'editor-video', label: 'Editor Video', icon: Film, description: 'Trim, texto, audio' },
  { id: 'asistente', label: 'Asistente AI', icon: MessageSquareText, description: 'Copy y marketing' },
]

function EstudioMultimedia() {
  const [activeTab, setActiveTab] = useState('generar')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MonitorPlay size={24} className="text-primary" /> Estudio Multimedia
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera, edita y optimiza contenido visual para tu tienda y redes sociales.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-white text-gray-600 hover:bg-cream border border-gray-200'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Cargando módulo…
          </div>
        }
      >
        {activeTab === 'generar' && <TabGenerar />}
        {activeTab === 'editor-imagen' && <TabEditorImagen />}
        {activeTab === 'editor-video' && <TabEditorVideo />}
        {activeTab === 'asistente' && <TabAsistenteAI />}
      </Suspense>
    </div>
  )
}

export default EstudioMultimedia
