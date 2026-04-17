// Tab Generar — generación de imágenes con FLUX vía Replicate.
// Extraído de EstudioAI.jsx para el nuevo container EstudioMultimedia.

import { useEffect, useState } from 'react'
import {
  Sparkles,
  Wand2,
  Loader2,
  Download,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eraser,
  Maximize2
} from 'lucide-react'
import { api } from '../../../lib/apiClient'
import { useToast } from '../../../context/ToastContext'

const PRESETS = [
  {
    label: 'Bandeja de carne premium',
    prompt:
      'premium beef cuts displayed on dark wooden cutting board, butcher shop product photography, dramatic editorial lighting from above, glistening fresh meat with marbling, depth of field, ultra realistic, 4k photography'
  },
  {
    label: 'Pollo entero crudo',
    prompt:
      'whole raw chicken on rustic wooden board with fresh herbs (rosemary, thyme), garlic and lemon, natural light from window, food photography, professional butcher shop catalog, 4k, depth of field'
  },
  {
    label: 'Costillas de cerdo',
    prompt:
      'rack of fresh raw pork ribs on dark slate, sprinkled with sea salt and herbs, dramatic side lighting, butcher shop product photography, glistening texture, ultra realistic, 4k'
  },
  {
    label: 'Embutidos colombianos',
    prompt:
      'colombian artisan chorizo and longaniza sausages displayed on wooden board with fresh chili and herbs, warm rustic lighting, food photography, premium butcher shop',
  },
  {
    label: 'Hamburguesa cruda',
    prompt:
      'raw beef hamburger patty on parchment paper, dark moody lighting, glistening fresh meat texture, herbs scattered, butcher shop product photography, 4k'
  },
  {
    label: 'Filete de pescado',
    prompt:
      'fresh salmon fillet on ice with lemon slices and dill, natural daylight, food photography, premium fishmonger product shot, 4k'
  }
]

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 · Producto cuadrado' },
  { value: '4:5', label: '4:5 · Instagram post' },
  { value: '9:16', label: '9:16 · Story / Reel' },
  { value: '16:9', label: '16:9 · Hero banner' },
  { value: '3:2', label: '3:2 · Editorial' }
]

function TabGenerar() {
  const toast = useToast()
  const [enabled, setEnabled] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [numOutputs, setNumOutputs] = useState(2)
  const [model, setModel] = useState('flux-schnell')
  const [busy, setBusy] = useState(false)
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [products, setProducts] = useState([])
  const [assignTarget, setAssignTarget] = useState(null)

  useEffect(() => {
    api.get('/api/ai/status').then((r) => setEnabled(r.enabled))
    refreshHistory()
    api.get('/api/products?per_page=200&page=1').then((r) => {
      const items = Array.isArray(r) ? r : r.items || []
      setProducts(items)
    }).catch(() => {})
  }, [])

  const refreshHistory = () => {
    api.get('/api/ai/history').then(setHistory).catch(() => {})
  }

  const generate = async () => {
    if (prompt.trim().length < 5) {
      toast.warn('Escribe un prompt con al menos 5 caracteres.')
      return
    }
    setBusy(true)
    try {
      const res = await api.post('/api/ai/generate-image', {
        prompt,
        negative_prompt: negativePrompt || undefined,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        model
      })
      setLatest(res)
      refreshHistory()
      toast.success(`✓ ${res.images.length} imagen(es) generada(s) · ~$${res.cost_estimate_usd.toFixed(4)} USD`)
    } catch (e) {
      toast.error(e.message || 'Falló la generación.')
    } finally {
      setBusy(false)
    }
  }

  const removeBg = async (imageUrl) => {
    setBusy(true)
    try {
      await api.post('/api/ai/remove-background', {
        image_url: window.location.origin + imageUrl
      })
      toast.success('✓ Fondo removido')
      refreshHistory()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const upscale = async (imageUrl) => {
    setBusy(true)
    try {
      await api.post('/api/ai/upscale', { image_url: window.location.origin + imageUrl })
      toast.success('✓ Imagen escalada 4×')
      refreshHistory()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const assignToProduct = async (productId, imageUrl) => {
    try {
      await api.put(`/api/products/${productId}`, { image_url: imageUrl })
      toast.success('Imagen asignada al producto')
      setAssignTarget(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (!enabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold mb-1">Replicate no está configurado</h2>
            <p className="text-sm">
              Falta agregar <code className="bg-amber-100 px-1 py-0.5 rounded">REPLICATE_API_TOKEN</code>{' '}
              en <code>backend/.env</code>. Pide ayuda al admin técnico.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* PANEL CONFIG */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 self-start lg:sticky lg:top-[100px]">
          <h3 className="font-semibold text-charcoal flex items-center gap-2">
            <Sparkles size={16} /> Configuración
          </h3>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Plantilla</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.prompt)}
                  className="text-xs px-2 py-1 rounded-full bg-cream hover:bg-primary hover:text-white border border-gray-200 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Describe la imagen en inglés (mejor resultado): premium beef cuts on wooden board..."
              className="input text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: prompts en inglés dan mejor resultado. Incluye términos como "professional photography",
              "dramatic lighting", "4k", "depth of field".
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">
              Negative prompt (opcional)
            </label>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, cartoon, low quality, text, watermark"
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Formato</label>
              <select className="input text-sm" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                {ASPECT_RATIOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Variantes</label>
              <select className="input text-sm" value={numOutputs} onChange={(e) => setNumOutputs(parseInt(e.target.value))}>
                <option value="1">1 imagen</option>
                <option value="2">2 imágenes</option>
                <option value="3">3 imágenes</option>
                <option value="4">4 imágenes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Calidad</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModel('flux-schnell')}
                className={`px-3 py-2 rounded-lg text-sm border-2 transition ${
                  model === 'flux-schnell' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600'
                }`}
              >
                <div className="font-semibold">Rápido</div>
                <div className="text-[10px] opacity-70">$0.003 · 3s</div>
              </button>
              <button
                onClick={() => setModel('flux-dev')}
                className={`px-3 py-2 rounded-lg text-sm border-2 transition ${
                  model === 'flux-dev' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600'
                }`}
              >
                <div className="font-semibold">Premium</div>
                <div className="text-[10px] opacity-70">$0.03 · 15s</div>
              </button>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={busy || prompt.trim().length < 5}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Generar
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            Costo estimado: ${((model === 'flux-dev' ? 0.03 : 0.003) * numOutputs).toFixed(4)} USD
          </p>
        </div>

        {/* PANEL RESULTADOS */}
        <div className="space-y-6">
          {latest && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-charcoal mb-3">Última generación</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {latest.images.map((src) => (
                  <div key={src} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={src} alt="" className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <a href={src} download className="btn-primary text-xs inline-flex items-center gap-1">
                        <Download size={12} /> Descargar
                      </a>
                      <button
                        onClick={() => setAssignTarget({ imageUrl: src })}
                        className="bg-white text-charcoal text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                      >
                        <ImageIcon size={12} /> Asignar a producto
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => removeBg(src)}
                          className="bg-cream text-charcoal text-[10px] px-2 py-1 rounded inline-flex items-center gap-1"
                        >
                          <Eraser size={10} /> Sin fondo
                        </button>
                        <button
                          onClick={() => upscale(src)}
                          className="bg-cream text-charcoal text-[10px] px-2 py-1 rounded inline-flex items-center gap-1"
                        >
                          <Maximize2 size={10} /> Upscale 4×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-charcoal mb-3">Historial reciente</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">Aún no has generado nada.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {history.map((h) => (
                  <div key={h.id} className="relative group rounded-lg overflow-hidden bg-gray-50 border">
                    <img src={h.local_url} alt="" className="w-full aspect-square object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white">
                      {h.kind}{h.cost_estimate_usd ? ` · $${h.cost_estimate_usd.toFixed(4)}` : ''}
                    </div>
                    <button
                      onClick={() => setAssignTarget({ imageUrl: h.local_url })}
                      className="absolute top-1 right-1 bg-white/90 hover:bg-primary hover:text-white p-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition"
                      title="Asignar a producto"
                    >
                      <Check size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal asignar a producto */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Asignar imagen a producto</h3>
              <button onClick={() => setAssignTarget(null)} className="text-gray-400">✕</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <img src={assignTarget.imageUrl} alt="" className="rounded-lg w-full aspect-square object-cover" />
              <div className="text-xs text-gray-500">
                Selecciona el producto al que quieres asignar esta imagen como portada principal.
              </div>
            </div>
            <div className="overflow-y-auto p-4 pt-0 space-y-1">
              {products.slice(0, 50).map((p) => (
                <button
                  key={p.id}
                  onClick={() => assignToProduct(p.id, assignTarget.imageUrl)}
                  className="w-full text-left flex items-center gap-3 p-2 hover:bg-cream rounded-lg"
                >
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.image_url && <img src={p.image_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500">{p.category_name || 'Sin categoría'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TabGenerar
