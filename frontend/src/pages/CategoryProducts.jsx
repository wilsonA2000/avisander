import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import ProductCard from '../components/ProductCard'

function CategoryProducts() {
  const { slug } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [slug])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Capitalize category name for display
      setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1))

      const response = await fetch(`/api/products?category=${slug}`)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/productos"
        className="inline-flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        <span>Volver a productos</span>
      </Link>

      <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
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
          <p className="text-gray-500 text-lg mb-4">
            No hay productos en esta categoria
          </p>
          <Link to="/productos" className="btn-primary">
            Ver todos los productos
          </Link>
        </div>
      )}
    </div>
  )
}

export default CategoryProducts
