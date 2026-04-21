import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  Eye,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import { api, apiFetchFormData } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'

const BLOCK_DEFAULTS = {
  hero: { type: 'hero', title: '', subtitle: '', image_url: '', cta_label: '', cta_href: '' },
  benefits: {
    type: 'benefits',
    title: '',
    items: [{ icon: 'badge', title: '', text: '' }]
  },
  split: { type: 'split', image_url: '', imagePosition: 'right', title: '', text: '' },
  numbers: { type: 'numbers', items: [{ number: '', label: '' }] },
  process: { type: 'process', steps: [{ n: 1, title: '', text: '' }] },
  cta: { type: 'cta', title: '', text: '', button_label: '', button_href: '' }
}

const BLOCK_LABELS = {
  hero: 'Hero',
  benefits: 'Beneficios (grid)',
  split: 'Imagen + texto',
  numbers: 'Números',
  process: 'Proceso',
  cta: 'CTA / Banner'
}

function PageEditor() {
  const { slug } = useParams()
  const toast = useToast()
  const [page, setPage] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function load() {
    setLoading(true)
    try {
      const data = await api.get(`/api/pages/admin/${slug}`)
      setPage(data)
      setTitle(data.title || slug)
      setBlocks(data.blocks || [])
      setDirty(false)
    } catch (err) {
      toast.error(err.message || 'Error cargando página')
    } finally {
      setLoading(false)
    }
  }

  function updateBlock(idx, patch) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
    setDirty(true)
  }

  function move(idx, dir) {
    const j = dir === 'up' ? idx - 1 : idx + 1
    if (j < 0 || j >= blocks.length) return
    setBlocks((prev) => {
      const next = [...prev]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
    setDirty(true)
  }

  function remove(idx) {
    if (!confirm('¿Eliminar este bloque?')) return
    setBlocks((prev) => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  function add(type) {
    const tpl = BLOCK_DEFAULTS[type]
    if (!tpl) return
    setBlocks((prev) => [...prev, JSON.parse(JSON.stringify(tpl))])
    setDirty(true)
    setShowAdd(false)
  }

  async function save() {
    setSaving(true)
    try {
      const updated = await api.put(`/api/pages/admin/${slug}`, {
        title: title.trim() || slug,
        blocks,
        published: true
      })
      setPage(updated)
      setBlocks(updated.blocks || [])
      setDirty(false)
      toast.success('Página guardada')
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando…</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Editor: {slug}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edita los bloques que componen la página pública.
          </p>
          {page?.updated_at && (
            <p className="text-xs text-gray-400 mt-1">
              Última edición: {new Date(page.updated_at).toLocaleString('es-CO')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 px-3 py-2"
          >
            <Eye size={16} /> Ver pública <ExternalLink size={12} />
          </Link>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
          >
            <Save size={16} /> {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Título de página</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        />
      </div>

      <div className="space-y-3">
        {blocks.map((b, i) => (
          <BlockCard
            key={i}
            block={b}
            index={i}
            onChange={(patch) => updateBlock(i, patch)}
            onMoveUp={i > 0 ? () => move(i, 'up') : null}
            onMoveDown={i < blocks.length - 1 ? () => move(i, 'down') : null}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      <div className="mt-4 relative">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="w-full bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4 text-sm font-semibold text-gray-600 inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Añadir bloque
        </button>
        {showAdd && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
            {Object.keys(BLOCK_DEFAULTS).map((type) => (
              <button
                key={type}
                onClick={() => add(type)}
                className="px-3 py-2 text-sm text-left rounded-lg hover:bg-orange-50 hover:text-orange-700"
              >
                {BLOCK_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {dirty && (
        <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
          Cambios sin guardar — recuerda pulsar <Save size={14} />
        </div>
      )}
    </div>
  )
}

function BlockCard({ block, index, onChange, onMoveUp, onMoveDown, onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            #{index + 1}
          </span>
          <span className="text-sm font-semibold text-charcoal">
            {BLOCK_LABELS[block.type] || block.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-red-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <BlockForm block={block} onChange={onChange} />
      </div>
    </div>
  )
}

function FieldInput({ label, value, onChange, ...rest }) {
  return (
    <label className="block text-xs text-gray-600">
      {label}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        {...rest}
      />
    </label>
  )
}

function FieldText({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block text-xs text-gray-600">
      {label}
      <textarea
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
      />
    </label>
  )
}

function ImageField({ label, value, onChange }) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const data = await apiFetchFormData('/api/upload/image', fd)
      onChange(data.url)
    } catch (err) {
      toast.error(err.message || 'Error subiendo imagen')
    } finally {
      setUploading(false)
    }
  }
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de imagen"
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <label className="inline-block text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer px-3 py-1.5 rounded-lg">
            {uploading ? 'Subiendo…' : 'Subir imagen'}
            <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  )
}

function BlockForm({ block, onChange }) {
  const set = (k, v) => onChange({ [k]: v })

  if (block.type === 'hero') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <FieldInput label="Título" value={block.title} onChange={(v) => set('title', v)} />
        <FieldInput label="Subtítulo" value={block.subtitle} onChange={(v) => set('subtitle', v)} />
        <div className="sm:col-span-2">
          <ImageField label="Imagen de fondo" value={block.image_url} onChange={(v) => set('image_url', v)} />
        </div>
        <FieldInput label="CTA texto" value={block.cta_label} onChange={(v) => set('cta_label', v)} />
        <FieldInput label="CTA enlace" value={block.cta_href} onChange={(v) => set('cta_href', v)} />
      </div>
    )
  }

  if (block.type === 'benefits') {
    return (
      <div className="space-y-3">
        <FieldInput label="Título" value={block.title} onChange={(v) => set('title', v)} />
        <ListEditor
          label="Items"
          items={block.items || []}
          onChange={(items) => set('items', items)}
          empty={{ icon: 'badge', title: '', text: '' }}
          render={(item, update) => (
            <div className="grid sm:grid-cols-3 gap-2">
              <FieldInput label="Icono" value={item.icon} onChange={(v) => update({ icon: v })} placeholder="badge|truck|shield|star" />
              <FieldInput label="Título" value={item.title} onChange={(v) => update({ title: v })} />
              <FieldInput label="Texto" value={item.text} onChange={(v) => update({ text: v })} />
            </div>
          )}
        />
      </div>
    )
  }

  if (block.type === 'split') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <FieldInput label="Título" value={block.title} onChange={(v) => set('title', v)} />
        <label className="block text-xs text-gray-600">
          Posición imagen
          <select
            value={block.imagePosition || 'right'}
            onChange={(e) => set('imagePosition', e.target.value)}
            className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
          >
            <option value="left">Izquierda</option>
            <option value="right">Derecha</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <ImageField label="Imagen" value={block.image_url} onChange={(v) => set('image_url', v)} />
        </div>
        <div className="sm:col-span-2">
          <FieldText label="Texto" value={block.text} onChange={(v) => set('text', v)} rows={4} />
        </div>
      </div>
    )
  }

  if (block.type === 'numbers') {
    return (
      <ListEditor
        label="Cifras"
        items={block.items || []}
        onChange={(items) => set('items', items)}
        empty={{ number: '', label: '' }}
        render={(item, update) => (
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="Número" value={item.number} onChange={(v) => update({ number: v })} placeholder="+50" />
            <FieldInput label="Etiqueta" value={item.label} onChange={(v) => update({ label: v })} />
          </div>
        )}
      />
    )
  }

  if (block.type === 'process') {
    return (
      <ListEditor
        label="Pasos"
        items={block.steps || []}
        onChange={(steps) => set('steps', steps)}
        empty={{ n: 1, title: '', text: '' }}
        render={(step, update, idx) => (
          <div className="grid sm:grid-cols-3 gap-2">
            <FieldInput
              label="Número"
              value={step.n}
              onChange={(v) => update({ n: Number(v) || idx + 1 })}
            />
            <FieldInput label="Título" value={step.title} onChange={(v) => update({ title: v })} />
            <FieldInput label="Texto" value={step.text} onChange={(v) => update({ text: v })} />
          </div>
        )}
      />
    )
  }

  if (block.type === 'cta') {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <FieldInput label="Título" value={block.title} onChange={(v) => set('title', v)} />
        <FieldInput label="Subtítulo" value={block.text} onChange={(v) => set('text', v)} />
        <FieldInput label="Botón texto" value={block.button_label} onChange={(v) => set('button_label', v)} />
        <FieldInput label="Botón enlace" value={block.button_href} onChange={(v) => set('button_href', v)} />
      </div>
    )
  }

  return <pre className="text-xs text-gray-500">{JSON.stringify(block, null, 2)}</pre>
}

function ListEditor({ label, items, onChange, render, empty }) {
  function update(idx, patch) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function remove(idx) {
    onChange(items.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...items, JSON.parse(JSON.stringify(empty))])
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <button
          type="button"
          onClick={add}
          className="text-xs text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
        >
          <Plus size={12} /> Añadir
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="border border-gray-100 rounded-lg p-2 bg-gray-50/50">
            {render(item, (patch) => update(idx, patch), idx)}
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> Quitar
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-3">
            Aún no hay items. Pulsa "Añadir".
          </div>
        )}
      </div>
    </div>
  )
}

export default PageEditor
