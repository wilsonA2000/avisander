import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('buscar') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, search])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (search) params.append('search', search)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('buscar', search)
    if (selectedCategory) params.set('categoria', selectedCategory)
    setSearchParams(params)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    const params = new URLSearchParams()
    if (search) params.set('buscar', search)
    if (category) params.set('categoria', category)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSearchParams({})
  }

  const hasFilters = search || selectedCategory

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Productos</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </form>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input md:w-48"
          >
            <option value="">Todas las categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name.toLowerCase()}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={18} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No se encontraron productos</p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-primary">
              Ver todos los productos
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default Products
