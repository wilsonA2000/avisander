// Sidebar de filtros del catálogo. Usa facets del backend para poblar listas con conteos.
// Controla estado via props (lifted up al padre), para que el padre sincronice con URL.

import { useMemo } from 'react'
import { X } from 'lucide-react'

function toggle(arr, value) {
  const s = new Set(arr)
  if (s.has(value)) s.delete(value)
  else s.add(value)
  return [...s]
}

function FiltersSidebar({ facets, filters, onChange, onClose, inDrawer = false }) {
  const activeCount = useMemo(() => {
    let n = 0
    if (filters.category?.length) n += filters.category.length
    if (filters.subcategory?.length) n += filters.subcategory.length
    if (filters.brand?.length) n += filters.brand.length
    if (filters.min_price) n++
    if (filters.max_price) n++
    if (filters.in_stock) n++
    if (filters.on_sale) n++
    if (filters.sale_type) n++
    return n
  }, [filters])

  const set = (patch) => onChange({ ...filters, ...patch, page: 1 })
  const clear = () => onChange({ page: 1 })

  const Section = ({ title, children }) => (
    <div className="border-b border-gray-200 py-3">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  )

  const Checkbox = ({ checked, onChange: onC, label, count }) => (
    <label className="flex items-center gap-2 py-1 cursor-pointer hover:text-primary text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onC}
        className="rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span className="text-xs text-gray-400">({count})</span>}
    </label>
  )

  return (
    <aside className={`bg-white ${inDrawer ? 'p-4 h-full overflow-y-auto' : 'rounded-xl p-4 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold">Filtros {activeCount > 0 && <span className="text-primary">({activeCount})</span>}</h2>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={clear} className="text-xs text-gray-500 hover:text-primary underline">
              Limpiar
            </button>
          )}
          {inDrawer && (
            <button onClick={onClose} aria-label="Cerrar" className="p-1 text-gray-500 hover:text-gray-900">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <Section title="Categoría">
        {(facets?.categories || []).map((c) => (
          <Checkbox
            key={c.id}
            checked={(filters.category || []).includes(c.name.toLowerCase())}
            onChange={() => set({ category: toggle(filters.category || [], c.name.toLowerCase()) })}
            label={c.name}
            count={c.count}
          />
        ))}
      </Section>

      {facets?.subcategories?.length > 0 && (
        <Section title="Subcategoría">
          {facets.subcategories.map((s) => (
            <Checkbox
              key={s.name}
              checked={(filters.subcategory || []).includes(s.name.toLowerCase())}
              onChange={() => set({ subcategory: toggle(filters.subcategory || [], s.name.toLowerCase()) })}
              label={s.name}
              count={s.count}
            />
          ))}
        </Section>
      )}

      {facets?.brands?.length > 0 && (
        <Section title="Marca">
          {facets.brands.map((b) => (
            <Checkbox
              key={b.name}
              checked={(filters.brand || []).includes(b.name.toLowerCase())}
              onChange={() => set({ brand: toggle(filters.brand || [], b.name.toLowerCase()) })}
              label={b.name}
              count={b.count}
            />
          ))}
        </Section>
      )}

      <Section title="Precio">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={filters.min_price || ''}
            onChange={(e) => set({ min_price: e.target.value || undefined })}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={filters.max_price || ''}
            onChange={(e) => set({ max_price: e.target.value || undefined })}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
        {facets?.price_range && (
          <p className="text-xs text-gray-500 mt-1">
            Rango actual: ${Number(facets.price_range.min || 0).toLocaleString('es-CO')} – ${Number(facets.price_range.max || 0).toLocaleString('es-CO')}
          </p>
        )}
      </Section>

      <Section title="Otros">
        <Checkbox checked={!!filters.on_sale} onChange={() => set({ on_sale: !filters.on_sale })} label="En oferta" />
        <Checkbox checked={!!filters.in_stock} onChange={() => set({ in_stock: !filters.in_stock })} label="Solo disponibles" />
        <Checkbox
          checked={filters.sale_type === 'by_weight'}
          onChange={() => set({ sale_type: filters.sale_type === 'by_weight' ? undefined : 'by_weight' })}
          label="Por peso (kg)"
        />
        <Checkbox
          checked={filters.sale_type === 'fixed'}
          onChange={() => set({ sale_type: filters.sale_type === 'fixed' ? undefined : 'fixed' })}
          label="Bandejas / pieza"
        />
      </Section>
    </aside>
  )
}

export default FiltersSidebar
