// Tab Asistente AI — genera contenido de marketing con Claude API.
// Tipos: descripción producto, caption Instagram, SEO meta, receta, texto libre.

import { useEffect, useState } from 'react'
import {
  MessageSquareText, FileText, Instagram, Search, ChefHat,
  Pencil, Loader2, Copy, Check, AlertCircle, Sparkles
} from 'lucide-react'
import { api } from '../../../lib/apiClient'
import { useToast } from '../../../context/ToastContext'

const CONTENT_TYPES = [
  { id: 'description', label: 'Descripción producto', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { id: 'caption', label: 'Caption Instagram', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
  { id: 'seo', label: 'SEO Meta', icon: Search, color: 'text-green-600 bg-green-50' },
  { id: 'recipe', label: 'Idea de receta', icon: ChefHat, color: 'text-amber-600 bg-amber-50' },
  { id: 'custom', label: 'Texto libre', icon: Pencil, color: 'text-purple-600 bg-purple-50' },
]

function TabAsistenteAI() {
  const toast = useToast()
  const [enabled, setEnabled] = useState(true)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [contentType, setContentType] = useState('description')
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/api/ai/assistant/status').then(r => setEnabled(r.enabled)).catch(() => setEnabled(false))
    api.get('/api/products?per_page=200&page=1').then(r => {
      const items = Array.isArray(r) ? r : r.items || []
      setProducts(items)
    }).catch(() => {})
  }, [])

  const generate = async () => {
    if (contentType === 'custom' && !customPrompt.trim()) {
      toast.warn('Escribe tu solicitud.')
      return
    }
    setGenerating(true)
    setResult(null)
    try {
      const body = {
        type: contentType,
        product_id: selectedProduct ? Number(selectedProduct) : undefined,
        prompt: customPrompt || undefined
      }
      const res = await api.post('/api/ai/assistant/generate', body)
      setResult(res)
    } catch (e) {
      toast.error(e.message || 'Error al generar contenido')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!result?.content) return
    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  if (!enabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold mb-1">Claude API no está configurada</h2>
            <p className="text-sm">
              Agrega <code className="bg-amber-100 px-1 py-0.5 rounded">ANTHROPIC_API_KEY=sk-ant-...</code>{' '}
              en <code>backend/.env</code>. Puedes obtener tu API key en{' '}
              <a href="https://console.anthropic.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                console.anthropic.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      {/* Panel izquierdo: config */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5 self-start lg:sticky lg:top-[100px]">
        <h3 className="font-semibold text-charcoal flex items-center gap-2">
          <Sparkles size={16} /> Asistente de contenido
        </h3>

        {/* Tipo de contenido */}
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">Tipo de contenido</label>
          <div className="space-y-1.5">
            {CONTENT_TYPES.map(ct => (
              <button
                key={ct.id}
                onClick={() => setContentType(ct.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  contentType === ct.id
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-cream'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ct.color}`}>
                  <ct.icon size={16} />
                </div>
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de producto */}
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">
            Producto (opcional)
          </label>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="input text-sm"
          >
            <option value="">— Sin producto específico —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.category_name || 'sin cat.'})</option>
            ))}
          </select>
        </div>

        {/* Prompt custom */}
        {contentType === 'custom' && (
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 mb-1 block">Tu solicitud</label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              rows={4}
              placeholder="Ej: Escribe un mensaje de WhatsApp para avisar que llegaron costillas frescas..."
              className="input text-sm"
            />
          </div>
        )}

        <button
          onClick={generate}
          disabled={generating}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 size={16} className="animate-spin" /> Generando...</>
          ) : (
            <><MessageSquareText size={16} /> Generar contenido</>
          )}
        </button>
      </div>

      {/* Panel derecho: resultado */}
      <div>
        {!result && !generating && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <MessageSquareText size={48} className="mx-auto text-primary/20 mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Resultado aparecerá aquí</h3>
            <p className="text-sm text-gray-400">
              Selecciona un tipo de contenido, opcionalmente un producto, y haz clic en "Generar".
            </p>
          </div>
        )}

        {generating && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-500">Claude está escribiendo...</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Resultado ({result.usage?.input_tokens + result.usage?.output_tokens} tokens)
              </span>
              <button
                onClick={copyToClipboard}
                className="text-sm inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-cream transition"
              >
                {copied ? <><Check size={14} className="text-green-600" /> Copiado</> : <><Copy size={14} /> Copiar</>}
              </button>
            </div>
            <div className="p-5 prose prose-sm max-w-none whitespace-pre-wrap text-charcoal leading-relaxed">
              {result.content}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TabAsistenteAI
