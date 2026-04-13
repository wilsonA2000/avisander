import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Beef, Drumstick, Egg, Milk, Package } from 'lucide-react'
import ProductCard from '../components/ProductCard'

const categoryIcons = {
  res: Beef,
  cerdo: Beef,
  pollo: Drumstick,
  huevos: Egg,
  lacteos: Milk,
  otros: Package
}

function Home() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [saleProducts, setSaleProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, featuredRes, saleRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products/featured'),
        fetch('/api/products/on-sale')
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data)
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json()
        setFeaturedProducts(data)
      }
      if (saleRes.ok) {
        const data = await saleRes.json()
        setSaleProducts(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Carnes Premium a Domicilio
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-red-100">
            en Bucaramanga
          </p>
          <p className="max-w-2xl mx-auto mb-8 text-red-100">
            Res, cerdo, pollo, huevos, lacteos y mas. Calidad garantizada
            directamente a tu puerta.
          </p>
          <Link to="/productos" className="btn bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3">
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="card p-6 text-center animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => {
                const Icon = categoryIcons[category.name.toLowerCase()] || Package
                return (
                  <Link
                    key={category.id}
                    to={`/categoria/${category.name.toLowerCase()}`}
                    className="card p-6 text-center hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                      <Icon className="text-primary group-hover:text-white transition-colors" size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  </Link>
                )
              })
            ) : (
              <p className="col-span-full text-center text-gray-500">
                Pronto tendras categorias disponibles
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Productos Destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sale Products */}
      {saleProducts.length > 0 && (
        <section className="py-16 bg-yellow-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Ofertas de la Semana</h2>
            <p className="text-center text-gray-600 mb-12">Aprovecha estos precios especiales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {saleProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Visitanos</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">Direccion:</strong><br />
                  Cra 23 #20-70 Local 2, Bucaramanga
                </p>
                <p>
                  <strong className="text-white">Telefono:</strong><br />
                  <a href="tel:+573162530287" className="hover:text-primary transition-colors">
                    316 253 0287
                  </a>
                </p>
                <p>
                  <strong className="text-white">Horarios:</strong><br />
                  Lunes a Sabado: 7:00 AM - 7:00 PM<br />
                  Domingos: 7:00 AM - 1:00 PM
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Entregas a Domicilio</h2>
              <p className="text-gray-300 mb-6">
                Realizamos entregas a domicilio en Bucaramanga y area metropolitana.
                Envia tu pedido por WhatsApp y coordinamos la entrega.
              </p>
              <a
                href="https://wa.me/573162530287"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Pedir por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
