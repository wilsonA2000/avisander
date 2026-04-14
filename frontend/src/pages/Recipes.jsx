// Listado público de recetas.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChefHat } from 'lucide-react'
import { api } from '../lib/apiClient'
import RecipeImage from '../components/RecipeImage'

function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState('')

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (difficulty) p.set('difficulty', difficulty)
    api.get(`/api/recipes?${p.toString()}`, { skipAuth: true })
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [difficulty])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ChefHat size={28} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Recetas Avisander</h1>
          <p className="text-gray-600 text-sm">Inspiración para sacar el máximo a cada corte.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 mb-6 shadow-sm flex items-center gap-2 flex-wrap">
        <label className="text-sm text-gray-600">Filtrar por dificultad:</label>
        {['', 'facil', 'media', 'dificil'].map((d) => (
          <button
            key={d || 'all'}
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              difficulty === d ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d || 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <ChefHat size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aún no hay recetas publicadas.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <Link
              key={r.id}
              to={`/recetas/${r.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="aspect-video bg-gray-100 overflow-hidden">
                <RecipeImage recipe={r} />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 line-clamp-2">{r.title}</h3>
                {r.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>}
                <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-gray-500">
                  {r.duration_min && <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.duration_min} min</span>}
                  {r.difficulty && <span className="capitalize">· {r.difficulty}</span>}
                  {r.products?.length > 0 && <span>· {r.products.length} ingredientes</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Recipes
