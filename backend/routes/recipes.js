const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { recipeCreateSchema, recipeUpdateSchema } = require('../schemas/recipe')
const { slugify } = require('../lib/productUtils')

const router = express.Router()

// Genera un slug único para recetas (igual que products/uniqueSlug pero para esta tabla)
function uniqueRecipeSlug(base, ignoreId = null) {
  const baseSlug = slugify(base) || 'receta'
  const stmt = db.prepare('SELECT id FROM recipes WHERE slug = ? AND id != ? LIMIT 1')
  let candidate = baseSlug
  let n = 2
  while (stmt.get(candidate, ignoreId || 0)) {
    candidate = `${baseSlug}-${n++}`
    if (n > 999) break
  }
  return candidate
}

function withProducts(recipe) {
  if (!recipe) return recipe
  const products = db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.image_url, p.price, p.price_per_kg, p.sale_type,
              p.unit, p.is_available, p.brand
       FROM recipe_products rp
       JOIN products p ON p.id = rp.product_id
       WHERE rp.recipe_id = ?`
    )
    .all(recipe.id)
  return { ...recipe, products, is_published: !!recipe.is_published }
}

// Listado público (solo publicadas por defecto)
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { published, difficulty, meal_type, limit, by_product, random } = req.query
    const where = []
    const params = []

    // Admin puede ver no-publicadas si pasa ?published=all
    const showAll = req.user?.role === 'admin' && published === 'all'
    if (!showAll) where.push('r.is_published = 1')

    if (difficulty) {
      where.push('r.difficulty = ?')
      params.push(difficulty)
    }
    if (meal_type) {
      const types = String(meal_type).split(',').map((s) => s.trim()).filter(Boolean)
      if (types.length) {
        where.push(`r.meal_type IN (${types.map(() => '?').join(',')})`)
        params.push(...types)
      }
    }

    let query = `SELECT r.* FROM recipes r`
    if (by_product) {
      query += ` JOIN recipe_products rp ON rp.recipe_id = r.id AND rp.product_id = ?`
      params.unshift(parseInt(by_product))
    }
    if (where.length) query += ` WHERE ${where.join(' AND ')}`
    // El home pide ?random=1 para rotar recetas cada carga.
    query += random === '1' ? ' ORDER BY RANDOM()' : ' ORDER BY r.created_at DESC'
    if (limit) query += ` LIMIT ${Math.min(50, Math.max(1, parseInt(limit) || 20))}`

    const rows = db.prepare(query).all(...params).map(withProducts)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Por slug (público si publicada; admin la ve siempre)
router.get('/by-slug/:slug', optionalAuth, (req, res, next) => {
  try {
    const recipe = db.prepare('SELECT * FROM recipes WHERE slug = ?').get(req.params.slug)
    if (!recipe) return res.status(404).json({ error: 'Receta no encontrada' })
    if (!recipe.is_published && req.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Receta no encontrada' })
    }
    res.json(withProducts(recipe))
  } catch (error) {
    next(error)
  }
})

// Por ID (admin principalmente)
router.get('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id)
    if (!recipe) return res.status(404).json({ error: 'Receta no encontrada' })
    res.json(withProducts(recipe))
  } catch (error) {
    next(error)
  }
})

// Crear
router.post('/', authenticateToken, requireAdmin, validate(recipeCreateSchema), (req, res, next) => {
  try {
    const {
      title, summary, cover_image_url, video_url, body_markdown,
      duration_min, difficulty, is_published, meal_type, servings,
      slug: providedSlug, product_ids
    } = req.body

    const slug = uniqueRecipeSlug(providedSlug || title)

    const tx = db.transaction(() => {
      const r = db
        .prepare(
          `INSERT INTO recipes
            (slug, title, summary, cover_image_url, video_url, body_markdown,
             duration_min, difficulty, meal_type, servings, is_published)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          slug,
          title,
          summary || null,
          cover_image_url || null,
          video_url || null,
          body_markdown || null,
          duration_min || null,
          difficulty || null,
          meal_type || null,
          servings || null,
          is_published ? 1 : 0
        )
      const id = r.lastInsertRowid
      if (Array.isArray(product_ids)) {
        const ins = db.prepare('INSERT INTO recipe_products (recipe_id, product_id) VALUES (?, ?)')
        for (const pid of product_ids) ins.run(id, pid)
      }
      return id
    })
    const id = tx()
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id)
    res.status(201).json(withProducts(recipe))
  } catch (error) {
    next(error)
  }
})

// Actualizar
router.put('/:id', authenticateToken, requireAdmin, validate(recipeUpdateSchema), (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Receta no encontrada' })

    const merged = { ...existing, ...req.body }
    let slug = existing.slug
    if (req.body.slug && req.body.slug !== existing.slug) {
      slug = uniqueRecipeSlug(req.body.slug, req.params.id)
    }

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE recipes SET
          slug = ?, title = ?, summary = ?, cover_image_url = ?, video_url = ?,
          body_markdown = ?, duration_min = ?, difficulty = ?,
          meal_type = ?, servings = ?, is_published = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        slug,
        merged.title,
        merged.summary ?? null,
        merged.cover_image_url ?? null,
        merged.video_url ?? null,
        merged.body_markdown ?? null,
        merged.duration_min ?? null,
        merged.difficulty ?? null,
        merged.meal_type ?? null,
        merged.servings ?? null,
        merged.is_published ? 1 : 0,
        req.params.id
      )
      if (Array.isArray(req.body.product_ids)) {
        db.prepare('DELETE FROM recipe_products WHERE recipe_id = ?').run(req.params.id)
        const ins = db.prepare('INSERT INTO recipe_products (recipe_id, product_id) VALUES (?, ?)')
        for (const pid of req.body.product_ids) ins.run(req.params.id, pid)
      }
    })
    tx()
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id)
    res.json(withProducts(recipe))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const r = db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id)
    if (!r.changes) return res.status(404).json({ error: 'Receta no encontrada' })
    res.json({ message: 'Receta eliminada' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
