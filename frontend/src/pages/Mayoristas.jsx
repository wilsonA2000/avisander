import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import BlockRenderer from '../components/pages/BlockRenderer'
import SEO from '../components/SEO'

function Mayoristas() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/pages/mayoristas', { skipAuth: true })
      .then((data) => {
        if (!cancelled) setPage(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Error cargando contenido')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Contenido no disponible</h1>
        <p className="text-gray-500">{error || 'No pudimos cargar la página.'}</p>
      </div>
    )
  }

  return (
    <>
      <SEO
        title={`${page.title} · Avisander`}
        description="Programa de distribuidores mayoristas Avisander."
      />
      <BlockRenderer blocks={page.blocks} />
    </>
  )
}

export default Mayoristas
