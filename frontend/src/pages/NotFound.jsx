import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          Pagina no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la pagina que buscas no existe o fue movida.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={20} />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFound
