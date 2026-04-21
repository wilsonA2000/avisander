import { useEffect, useMemo, useState } from 'react'
import { Flame, Search, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { api } from '../../lib/apiClient'
import { useToast } from '../../context/ToastContext'

const MAX_ACTIVE = 10

function formatCOP(n) {
  if (n == null || isNaN(Number(n))) return '-'
  return `$${Math.round(Number(n)).toLocaleString('es-CO')}`
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function Imperdibles() {
  const toast = useToast()
  const [offers, setOffers] = useState([])
  const [activeCount, setActiveCount] = useState(0)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [offersRes, productsRes] = await Promise.all([
        api.get('/api/offers/admin/imperdibles'),
        api.get('/api/products')
      ])
      setOffers(offersRes.items || [])
      setActiveCount(offersRes.active_count || 0)
      const list = Array.isArray(productsRes) ? productsRes : productsRes.items || []
      setProducts(list)
    } catch (err) {
      toast.error(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const offeredProductIds = useMemo(
    () => new Set(offers.map((o) => o.product_id)),
    [offers]
  )

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => !offeredProductIds.has(p.id))
      .filter((p) => (q ? (p.name || '').toLowerCase().includes(q) : true))
      .slice(0, 40)
  }, [products, search, offeredProductIds])

  async function addProduct(productId) {
    if (activeCount >= MAX_ACTIVE) {
      toast.error(`Máximo ${MAX_ACTIVE} imperdibles activos. Desactiva alguno primero.`)
      return
    }
    try {
      const created = await api.post('/api/offers/admin/imperdibles', {
        product_id: productId,
        position: offers.length,
        is_active: 1
      })
      setOffers((prev) => [...prev, created])
      setActiveCount((c) => c + 1)
      toast.success('Imperdible agregado')
    } catch (err) {
      toast.error(err.message || 'No se pudo agregar')
    }
  }

  async function updateOffer(id, patch) {
    setSavingId(id)
    try {
      const updated = await api.patch(`/api/offers/admin/imperdibles/${id}`, patch)
      setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)))
      const newActiveCount = (await api.get('/api/offers/admin/imperdibles')).active_count || 0
      setActiveCount(newActiveCount)
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar')
    } finally {
      setSavingId(null)
    }
  }

  async function removeOffer(id) {
    if (!confirm('¿Quitar este imperdible?')) return
    try {
      await api.delete(`/api/offers/admin/imperdibles/${id}`)
      setOffers((prev) => prev.filter((o) => o.id !== id))
      const newActiveCount = (await api.get('/api/offers/admin/imperdibles')).active_count || 0
      setActiveCount(newActiveCount)
      toast.success('Imperdible eliminado')
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar')
    }
  }

  async function move(id, direction) {
    const sorted = [...offers].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex((o) => o.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    try {
      await api.post('/api/offers/admin/imperdibles/reorder', {
        items: [
          { id: a.id, position: b.position },
          { id: b.id, position: a.position }
        ]
      })
      setOffers((prev) =>
        prev.map((o) => {
          if (o.id === a.id) return { ...o, position: b.position }
          if (o.id === b.id) return { ...o, position: a.position }
          return o
        })
      )
    } catch (err) {
      toast.error(err.message || 'No se pudo reordenar')
    }
  }

  const sortedOffers = [...offers].sort(
    (a, b) => Number(b.is_active) - Number(a.is_active) || a.position - b.position
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame size={26} className="text-orange-500" /> Imperdibles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ofertas curadas que aparecen en la página pública con scroll y contador regresivo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              activeCount >= MAX_ACTIVE
                ? 'bg-red-100 text-red-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {activeCount}/{MAX_ACTIVE} activas
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Slots ({sortedOffers.length})
            </h2>
            {sortedOffers.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">
                Aún no hay imperdibles. Agrega productos desde el panel de la derecha.
              </p>
            )}
            <ul className="space-y-3">
              {sortedOffers.map((o, idx) => (
                <OfferRow
                  key={o.id}
                  offer={o}
                  saving={savingId === o.id}
                  onChange={(patch) => updateOffer(o.id, patch)}
                  onRemove={() => removeOffer(o.id)}
                  onMoveUp={idx > 0 ? () => move(o.id, 'up') : null}
                  onMoveDown={idx < sortedOffers.length - 1 ? () => move(o.id, 'down') : null}
                />
              ))}
            </ul>
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Agregar producto</h2>
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 && (
                <li className="text-sm text-gray-400 py-4 text-center">
                  {search ? 'Sin resultados' : 'Todos los productos ya son imperdibles'}
                </li>
              )}
              {filteredProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">{formatCOP(p.price)}</div>
                  </div>
                  <button
                    onClick={() => addProduct(p.id)}
                    className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    + Imperdible
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function OfferRow({ offer, saving, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [local, setLocal] = useState({
    special_price: offer.special_price ?? '',
    ends_at: toDatetimeLocal(offer.ends_at),
    headline: offer.headline ?? '',
    is_active: !!offer.is_active
  })
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setLocal({
      special_price: offer.special_price ?? '',
      ends_at: toDatetimeLocal(offer.ends_at),
      headline: offer.headline ?? '',
      is_active: !!offer.is_active
    })
    setDirty(false)
  }, [offer.id, offer.is_active, offer.special_price, offer.ends_at, offer.headline])

  function update(patch) {
    setLocal((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  function save() {
    const payload = {
      special_price:
        local.special_price === '' || local.special_price == null
          ? null
          : Number(local.special_price),
      ends_at: fromDatetimeLocal(local.ends_at),
      headline: local.headline?.trim() || null,
      is_active: local.is_active ? 1 : 0
    }
    onChange(payload)
  }

  function toggleActive() {
    const next = !local.is_active
    setLocal((prev) => ({ ...prev, is_active: next }))
    onChange({ is_active: next ? 1 : 0 })
  }

  return (
    <li className="border border-gray-200 rounded-xl p-3 flex gap-3 items-start bg-white">
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          title="Subir"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          title="Bajar"
        >
          <ArrowDown size={14} />
        </button>
      </div>

      {offer.product?.image_url ? (
        <img
          src={offer.product.image_url}
          alt=""
          className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
      )}

      <div className="min-w-0 flex-1 grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <div className="font-semibold text-sm truncate">{offer.product?.name}</div>
          <div className="text-xs text-gray-500">
            Precio base: {formatCOP(offer.product?.price)}
            {offer.discount_percent > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                -{offer.discount_percent}%
              </span>
            )}
          </div>
        </div>

        <label className="text-xs text-gray-600">
          Precio imperdible
          <input
            type="number"
            min="0"
            step="100"
            value={local.special_price}
            onChange={(e) => update({ special_price: e.target.value })}
            placeholder={String(Math.round(offer.product?.price || 0))}
            className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </label>

        <label className="text-xs text-gray-600">
          Termina
          <input
            type="datetime-local"
            value={local.ends_at}
            onChange={(e) => update({ ends_at: e.target.value })}
            className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </label>

        <label className="text-xs text-gray-600 col-span-2">
          Headline (opcional)
          <input
            type="text"
            maxLength={120}
            value={local.headline}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="Flash 48h, Stock limitado, etc."
            className="mt-0.5 w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 items-stretch">
        <button
          type="button"
          onClick={toggleActive}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            local.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {local.is_active ? 'Activa' : 'Inactiva'}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600 inline-flex items-center gap-1 justify-center disabled:opacity-60"
          >
            <Check size={12} /> Guardar
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 justify-center"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )
}

export default Imperdibles
