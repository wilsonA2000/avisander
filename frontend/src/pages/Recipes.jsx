// Listado público de recetas.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChefHat, Users, Coffee, Sun, Moon, Star, Zap, Gem } from 'lucide-react'
import { api } from '../lib/apiClient'
import RecipeImage from '../components/RecipeImage'

const MEAL_TYPES = [
  { key: '',          label: 'Todas',        Icon: ChefHat },
  { key: 'desayuno',  label: 'Desayuno',     Icon: Coffee },
  { key: 'almuerzo',  label: 'Almuerzo',     Icon: Sun },
  { key: 'cena',      label: 'Cena',         Icon: Moon },
  { key: 'rapido',    label: 'Rápidos',      Icon: Zap },
  { key: 'gourmet',   label: 'Gourmet',      Icon: Gem },
  { key: 'especial',  label: 'Día especial', Icon: Star },
]

const MEAL_BADGES = {
  desayuno: { label: 'Desayuno',     cls: 'bg-amber-100 text-amber-800' },
  almuerzo: { label: 'Almuerzo',     cls: 'bg-orange-100 text-orange-800' },
  cena:     { label: 'Cena',         cls: 'bg-indigo-100 text-indigo-800' },
  rapido:   { label: 'Rápido',       cls: 'bg-green-100 text-green-800' },
  gourmet:  { label: 'Gourmet',      cls: 'bg-purple-100 text-purple-800' },
  especial: { label: 'Día especial', cls: 'bg-rose-100 text-rose-800' },
}

function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState('')
  const [mealType, setMealType] = useState('')

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (difficulty) p.set('difficulty', difficulty)
    if (mealType) p.set('meal_type', mealType)
    api.get(`/api/recipes?${p.toString()}`, { skipAuth: true })
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [difficulty, mealType])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ChefHat size={28} className="text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Recetas Avisander</h1>
          <p className="text-gray-600 text-sm">Inspiración para sacar el máximo a cada corte.</p>
        </div>
      </div>

      <div className="mb-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-max">
          {MEAL_TYPES.map(({ key, label, Icon }) => (
            <button
              key={key || 'all'}
              onClick={() => setMealType(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                mealType === key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary/50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 mb-6 shadow-sm flex items-center gap-2 flex-wrap">
        <label className="text-sm text-gray-600">Dificultad:</label>
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
          <p className="text-gray-500">No hay recetas con estos filtros.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => {
            const badge = MEAL_BADGES[r.meal_type]
            return (
              <Link
                key={r.id}
                to={`/recetas/${r.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <RecipeImage recipe={r} />
                  {badge && (
                    <span className={`absolute top-2 left-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                  {r.summary && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>}
                  <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {r.duration_min && <span className="inline-flex items-center gap-1"><Clock size={12} /> {r.duration_min} min</span>}
                    {r.servings && <span className="inline-flex items-center gap-1"><Users size={12} /> {r.servings}</span>}
                    {r.difficulty && <span className="capitalize">· {r.difficulty}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Recipes
