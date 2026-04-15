// Trae recetas de carnes de TheMealDB (API gratuita sin key) y las guarda en la BD.
// Ejecutar: node scripts/fetch-recipes.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { db, initialize } = require('../db/database')
const { slugify, uniqueSlug } = require('../lib/productUtils')

initialize()

const CATEGORIES = ['Beef', 'Chicken', 'Pork', 'Lamb', 'Goat']
const PER_CATEGORY = 4 // Apuntamos a ~15-20 recetas totales

// Traducción muy básica de títulos comunes. TheMealDB devuelve en inglés.
// Estrategia: dejamos el título en inglés pero agregamos un summary en español
// que describe el tipo de plato. El admin luego puede editar si quiere.
function spanishSummary(meal) {
  const category = meal.strCategory || 'Carne'
  const area = meal.strArea || ''
  const map = {
    Beef: 'Receta con carne de res',
    Chicken: 'Receta con pollo',
    Pork: 'Receta con cerdo',
    Lamb: 'Receta con cordero',
    Goat: 'Receta con cabrito'
  }
  const base = map[category] || 'Plato con carne'
  return area ? `${base} · Estilo ${area}` : base
}

// Estimar dificultad a partir del número de ingredientes.
function difficultyFrom(meal) {
  let count = 0
  for (let i = 1; i <= 20; i++) {
    if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim()) count++
  }
  if (count <= 7) return 'facil'
  if (count <= 13) return 'media'
  return 'dificil'
}

function estimateDuration(meal) {
  const inst = String(meal.strInstructions || '')
  // Heurística rudimentaria: más instrucciones = más tiempo
  const len = inst.length
  if (len < 400) return 25
  if (len < 800) return 40
  if (len < 1400) return 60
  return 90
}

// Convierte instrucciones plain a Markdown con pasos numerados.
function instructionsToMarkdown(meal) {
  const raw = (meal.strInstructions || '').trim()
  if (!raw) return ''
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`]
    const mea = meal[`strMeasure${i}`]
    if (ing && ing.trim()) {
      ingredients.push(`- ${mea?.trim() || ''} ${ing.trim()}`.trim())
    }
  }

  const steps = raw
    .split(/\r?\n|\. (?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 12)

  let md = ''
  md += `## Ingredientes\n\n${ingredients.join('\n')}\n\n`
  md += `## Preparación\n\n`
  steps.forEach((s, i) => {
    md += `${i + 1}. ${s.replace(/\.$/, '')}.\n`
  })
  if (meal.strYoutube) {
    md += `\n## Video\n\nConsulta el video paso a paso: ${meal.strYoutube}\n`
  }
  if (meal.strSource) {
    md += `\n_Receta original: ${meal.strSource}_\n`
  }
  return md
}

async function fetchCategory(category) {
  const r = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
  const data = await r.json()
  return data.meals || []
}

async function fetchMealDetail(id) {
  const r = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
  const data = await r.json()
  return data.meals?.[0]
}

async function run() {
  console.log('── Fetching recetas de TheMealDB ──')
  const insert = db.prepare(
    `INSERT INTO recipes (slug, title, summary, cover_image_url, video_url, body_markdown, duration_min, difficulty, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  )
  const exists = db.prepare('SELECT id FROM recipes WHERE slug = ?')
  let total = 0

  for (const cat of CATEGORIES) {
    console.log(`\n▸ Categoría: ${cat}`)
    const list = await fetchCategory(cat)
    // Tomamos PER_CATEGORY aleatorios
    const picked = list.sort(() => Math.random() - 0.5).slice(0, PER_CATEGORY)

    for (const { idMeal, strMeal, strMealThumb } of picked) {
      const meal = await fetchMealDetail(idMeal)
      if (!meal) continue

      const baseSlug = slugify(meal.strMeal)
      if (exists.get(baseSlug)) {
        console.log(`  · skipped "${meal.strMeal}" (ya existe)`)
        continue
      }
      const slug = uniqueSlug(db, meal.strMeal)

      insert.run(
        slug,
        meal.strMeal,
        spanishSummary(meal),
        meal.strMealThumb || strMealThumb,
        meal.strYoutube || null,
        instructionsToMarkdown(meal),
        estimateDuration(meal),
        difficultyFrom(meal)
      )
      total++
      console.log(`  ✓ ${meal.strMeal}`)
      // Rate-limit cortesía
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  console.log(`\n✅ ${total} recetas agregadas`)
  console.log('La Home las muestra aleatoriamente en la sección "Recetas".')
}

run().catch((err) => {
  console.error('Fallo:', err)
  process.exit(1)
})
