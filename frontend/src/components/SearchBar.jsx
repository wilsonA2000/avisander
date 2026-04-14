// SearchBar global reutilizable.
// Patrón eBay: dropdown de categoría a la izquierda + input central con autocomplete
// + botón buscar. Historial en localStorage. Debounce de 250ms con AbortController.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, ChevronDown } from 'lucide-react'
import { api } from '../lib/apiClient'

const RECENT_KEY = 'avisander_recent_searches'
const MAX_RECENT = 8

function useRecentSearches() {
  const read = () => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }
  const [recent, setRecent] = useState(read)
  const push = (term) => {
    const t = String(term || '').trim()
    if (!t) return
    const next = [t, ...read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    setRecent(next)
  }
  const clear = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }
  return { recent, push, clear }
}

function SearchBar({ categories = [], size = 'md', autoFocus = false }) {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)
  const { recent, push: pushRecent, clear: clearRecent } = useRecentSearches()

  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
    if (!q || q.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => {
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      fetch(`/api/products/suggestions?q=${encodeURIComponent(q.trim())}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  const onSubmit = (e) => {
    e?.preventDefault?.()
    const term = q.trim()
    if (!term && !category) return
    if (term) pushRecent(term)
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (category) params.set('category', category)
    navigate(`/productos?${params.toString()}`)
    setOpen(false)
  }

  const pickSuggestion = (s) => {
    pushRecent(s.name)
    navigate(`/producto/${s.id}`)
    setOpen(false)
  }

  const pickRecent = (term) => {
    setQ(term)
    const params = new URLSearchParams({ q: term })
    if (category) params.set('category', category)
    navigate(`/productos?${params.toString()}`)
    setOpen(false)
  }

  const inputH = size === 'lg' ? 'h-12 text-base' : 'h-10 text-sm'

  return (
    <form
      ref={wrapRef}
      onSubmit={onSubmit}
      className={`flex items-stretch bg-white border-2 border-primary rounded-full overflow-hidden shadow-sm focus-within:shadow-md transition-shadow relative ${inputH}`}
      role="search"
    >
      {/* Dropdown categoría */}
      <div className="relative hidden md:block">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-full pl-3 pr-8 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 focus:outline-none appearance-none cursor-pointer max-w-[180px]"
          aria-label="Categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>

      {/* Input */}
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar productos, marcas y más…"
        autoFocus={autoFocus}
        className="flex-1 px-4 outline-none bg-white"
        aria-label="Búsqueda de productos"
      />

      {q && (
        <button
          type="button"
          onClick={() => { setQ(''); setSuggestions([]) }}
          className="px-2 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}

      <button
        type="submit"
        className="bg-primary hover:bg-primary-dark text-white px-5 flex items-center gap-1 transition-colors"
        aria-label="Buscar"
      >
        <Search size={18} />
        <span className="hidden sm:inline font-medium">Buscar</span>
      </button>

      {/* Dropdown de sugerencias + recientes */}
      {open && (q.length >= 2 || recent.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-[70vh] overflow-y-auto">
          {q.length >= 2 && (
            <div>
              <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                {loading ? 'Buscando…' : suggestions.length ? 'Sugerencias' : 'Sin coincidencias'}
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Search size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-medium truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.category_name && <>{s.category_name}</>}
                      {s.brand && <> · {s.brand}</>}
                    </div>
                  </div>
                  <div className="text-sm text-primary font-semibold whitespace-nowrap">
                    ${Number(s.sale_type === 'by_weight' ? s.price_per_kg : s.price).toLocaleString('es-CO')}
                    {s.sale_type === 'by_weight' ? '/kg' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          {q.length < 2 && recent.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50 flex items-center justify-between">
                <span>Búsquedas recientes</span>
                <button type="button" onClick={clearRecent} className="text-xs text-gray-400 hover:text-red-600 normal-case tracking-normal">
                  Borrar
                </button>
              </div>
              {recent.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickRecent(term)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                >
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  )
}

export default SearchBar
