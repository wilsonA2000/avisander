// Catálogo estilo eBay: sidebar de filtros + grid/lista + paginación + sort + URL state.
// El estado vive en la URL (useSearchParams), así el usuario puede compartir/guardar la vista.

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, LayoutGrid, List as ListIcon, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/apiClient'
import ProductCard from '../components/ProductCard'
import FiltersSidebar from '../components/FiltersSidebar'
import Pagination from '../components/Pagination'

const PER_PAGE = 24

function filtersToParams(f) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.category?.length) p.set('category', f.category.join(','))
  if (f.subcategory?.length) p.set('subcategory', f.subcategory.join(','))
  if (f.brand?.length) p.set('brand', f.brand.join(','))
  if (f.min_price) p.set('min_price', f.min_price)
  if (f.max_price) p.set('max_price', f.max_price)
  if (f.sale_type) p.set('sale_type', f.sale_type)
  if (f.in_stock) p.set('in_stock', '1')
  if (f.on_sale) p.set('on_sale', '1')
  if (f.sort && f.sort !== 'newest') p.set('sort', f.sort)
  if (f.view && f.view !== 'grid') p.set('view', f.view)
  if (f.page && f.page > 1) p.set('page', f.page)
  return p
}

function paramsToFilters(sp) {
  const asArr = (k) => {
    const v = sp.get(k)
    return v ? v.split(',').filter(Boolean) : []
  }
  return {
    q: sp.get('q') || '',
    category: asArr('category'),
    subcategory: asArr('subcategory'),
    brand: asArr('brand'),
    min_price: sp.get('min_price') || '',
    max_price: sp.get('max_price') || '',
    sale_type: sp.get('sale_type') || '',
    in_stock: sp.get('in_stock') === '1',
    on_sale: sp.get('on_sale') === '1',
    sort: sp.get('sort') || 'newest',
    view: sp.get('view') || 'grid',
    page: parseInt(sp.get('page')) || 1
  }
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])

  const [data, setData] = useState({ items: [], total: 0 })
  const [facets, setFacets] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const updateFilters = (patch) => {
    const next = { ...filters, ...patch }
    setSearchParams(filtersToParams(next))
  }

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    const p = new URLSearchParams()
    if (filters.q) p.set('q', filters.q)
    if (filters.category.length) p.set('category', filters.category.join(','))
    if (filters.subcategory.length) p.set('subcategory', filters.subcategory.join(','))
    if (filters.brand.length) p.set('brand', filters.brand.join(','))
    if (filters.min_price) p.set('min_price', filters.min_price)
    if (filters.max_price) p.set('max_price', filters.max_price)
    if (filters.sale_type) p.set('sale_type', filters.sale_type)
    if (filters.in_stock) p.set('in_stock', '1')
    if (filters.on_sale) p.set('on_sale', '1')
    if (filters.sort) p.set('sort', filters.sort)
    p.set('page', String(filters.page || 1))
    p.set('per_page', String(PER_PAGE))

    fetch(`/api/products?${p.toString()}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) setData({ items: res, total: res.length })
        else setData({ items: res.items || [], total: res.total || 0 })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setData({ items: [], total: 0 })
      })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [searchParams])

  useEffect(() => {
    api.get('/api/products/facets', { skipAuth: true })
      .then(setFacets)
      .catch(() => setFacets({ categories: [], subcategories: [], brands: [] }))
  }, [])

  const totalPages = Math.max(1, Math.ceil(data.total / PER_PAGE))
  const isList = filters.view === 'list'

  const activeChips = []
  if (filters.q) activeChips.push({ label: `"${filters.q}"`, clear: () => updateFilters({ q: '' }) })
  filters.category.forEach((c) => activeChips.push({ label: c, clear: () => updateFilters({ category: filters.category.filter((x) => x !== c) }) }))
  filters.brand.forEach((b) => activeChips.push({ label: b, clear: () => updateFilters({ brand: filters.brand.filter((x) => x !== b) }) }))
  filters.subcategory.forEach((s) => activeChips.push({ label: s, clear: () => updateFilters({ subcategory: filters.subcategory.filter((x) => x !== s) }) }))
  if (filters.on_sale) activeChips.push({ label: 'En oferta', clear: () => updateFilters({ on_sale: false }) })
  if (filters.sale_type) activeChips.push({ label: filters.sale_type === 'by_weight' ? 'Por peso' : 'Piezas', clear: () => updateFilters({ sale_type: '' }) })

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">Productos</span>
          {filters.category.length === 1 && (
            <><span className="mx-1">/</span><span className="text-gray-700 capitalize">{filters.category[0]}</span></>
          )}
        </nav>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="hidden lg:block">
            <div className="sticky top-[140px]">
              <FiltersSidebar facets={facets} filters={filters} onChange={updateFilters} />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl p-3 mb-4 shadow-sm flex flex-wrap items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:border-primary"
              >
                <SlidersHorizontal size={16} /> Filtros
              </button>

              <p className="text-sm text-gray-600 flex-1 min-w-0">
                {loading ? 'Cargando…' : (
                  <>
                    <strong className="text-gray-900">{data.total}</strong>{' '}
                    {data.total === 1 ? 'resultado' : 'resultados'}
                    {filters.q && <> para "<span className="text-primary font-medium">{filters.q}</span>"</>}
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600 hidden sm:inline">Ordenar:</label>
                <select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="name_asc">Nombre A–Z</option>
                  <option value="name_desc">Nombre Z–A</option>
                </select>

                <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateFilters({ view: 'grid' })}
                    className={`p-1.5 ${!isList ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-label="Vista en cuadrícula"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => updateFilters({ view: 'list' })}
                    className={`p-1.5 ${isList ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-label="Vista en lista"
                  >
                    <ListIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeChips.map((c, i) => (
                  <button
                    key={i}
                    onClick={c.clear}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors"
                  >
                    <span className="capitalize">{c.label}</span>
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className={isList ? 'space-y-3' : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={isList ? 'h-36 bg-white rounded-xl animate-pulse' : 'aspect-[3/4] bg-white rounded-xl animate-pulse'}
                  />
                ))}
              </div>
            ) : data.items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <Filter size={40} className="mx-auto text-gray-300 mb-3" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No encontramos productos</h2>
                <p className="text-gray-500 mb-4">Ajusta los filtros o intenta otra búsqueda.</p>
                <button onClick={() => setSearchParams(new URLSearchParams())} className="btn-primary">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={isList ? 'space-y-3' : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'}>
                  {data.items.map((p) => (
                    <ProductCard key={p.id} product={p} variant={isList ? 'list' : 'grid'} />
                  ))}
                </div>

                <div className="mt-8">
                  <Pagination
                    page={filters.page || 1}
                    totalPages={totalPages}
                    onChange={(p) => {
                      updateFilters({ page: p })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setDrawerOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <FiltersSidebar
              facets={facets}
              filters={filters}
              onChange={updateFilters}
              onClose={() => setDrawerOpen(false)}
              inDrawer
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
