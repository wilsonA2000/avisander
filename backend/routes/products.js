const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { productCreateSchema, productUpdateSchema } = require('../schemas/product')

const { slugify, uniqueSlug, buildSearchText, parseTags } = require('../lib/productUtils')

const router = express.Router()

// Convierte gallery_urls y tags de TEXT (JSON) a array antes de devolver al cliente.
function hydrateProduct(p) {
  if (!p) return p
  if (typeof p.gallery_urls === 'string') {
    try {
      p.gallery_urls = JSON.parse(p.gallery_urls)
    } catch {
      p.gallery_urls = []
    }
  } else if (!p.gallery_urls) {
    p.gallery_urls = []
  }
  p.tags = parseTags(p.tags)
  return p
}

// Catálogo: filtros, búsqueda, facets, paginación.
// Retrocompat: si no viene `page`/`per_page`/`paginated=1`, devuelve un array plano
// como antes para no romper consumidores legacy. Si viene paginación, devuelve
// `{ items, total, page, per_page }`.
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const {
      q,
      category,
      subcategory,
      brand,
      tag,
      min_price,
      max_price,
      sale_type,
      in_stock,
      on_sale,
      featured,
      sort = 'newest',
      page,
      per_page,
      paginated,
      // legacy
      search
    } = req.query

    const where = ['1=1']
    const params = []

    const text = (q || search || '').toString().trim()
    if (text) {
      // Buscamos en search_text, con fallback a name para productos sin indexar todavía.
      where.push('(LOWER(COALESCE(p.search_text, p.name)) LIKE ?)')
      params.push(`%${text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()}%`)
    }

    if (category) {
      // Acepta lista separada por comas
      const cats = String(category).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (cats.length) {
        where.push(`LOWER(c.name) IN (${cats.map(() => '?').join(',')})`)
        params.push(...cats)
      }
    }
    if (subcategory) {
      const subs = String(subcategory).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (subs.length) {
        where.push(`LOWER(p.subcategory) IN (${subs.map(() => '?').join(',')})`)
        params.push(...subs)
      }
    }
    if (brand) {
      const brands = String(brand).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (brands.length) {
        where.push(`LOWER(p.brand) IN (${brands.map(() => '?').join(',')})`)
        params.push(...brands)
      }
    }
    if (tag) {
      // tags se guardan como JSON string: usamos LIKE con comillas para match exacto por token.
      const tags = String(tag).split(',').map((s) => s.trim()).filter(Boolean)
      for (const t of tags) {
        where.push('p.tags LIKE ?')
        params.push(`%"${t}"%`)
      }
    }
    if (min_price) {
      where.push('p.price >= ?')
      params.push(Number(min_price))
    }
    if (max_price) {
      where.push('p.price <= ?')
      params.push(Number(max_price))
    }
    if (sale_type === 'fixed' || sale_type === 'by_weight') {
      where.push('p.sale_type = ?')
      params.push(sale_type)
    }
    if (in_stock === '1' || in_stock === 'true') {
      where.push('p.is_available = 1')
    }
    if (on_sale === '1' || on_sale === 'true') {
      where.push('p.is_on_sale = 1')
    }
    if (featured === '1' || featured === 'true') {
      where.push('p.is_featured = 1')
    }

    const orderBy = {
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      name_asc: 'p.name COLLATE NOCASE ASC',
      name_desc: 'p.name COLLATE NOCASE DESC',
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC',
      relevance: 'p.created_at DESC' // placeholder: sin FTS, usamos newest
    }[sort] || 'p.created_at DESC'

    const whereClause = `WHERE ${where.join(' AND ')}`
    const baseFrom = `FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`

    const wantsPagination =
      page !== undefined || per_page !== undefined || paginated === '1' || paginated === 'true'

    if (wantsPagination) {
      const pg = Math.max(1, parseInt(page) || 1)
      const pp = Math.min(60, Math.max(1, parseInt(per_page) || 24))
      const offset = (pg - 1) * pp

      const total = db.prepare(`SELECT COUNT(*) as n ${baseFrom}`).get(...params).n
      const rows = db
        .prepare(
          `SELECT p.*, c.name as category_name ${baseFrom} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
        )
        .all(...params, pp, offset)
        .map(hydrateProduct)

      return res.json({ items: rows, total, page: pg, per_page: pp })
    }

    const rows = db
      .prepare(`SELECT p.*, c.name as category_name ${baseFrom} ORDER BY ${orderBy}`)
      .all(...params)
      .map(hydrateProduct)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Autocomplete de búsqueda: top 8 por coincidencia en search_text
router.get('/suggestions', (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 2) return res.json([])
    const needle = `%${q
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()}%`
    const rows = db
      .prepare(
        `SELECT p.id, p.name, p.image_url, p.sale_type, p.price, p.price_per_kg, p.slug,
                c.name as category_name, p.brand, p.subcategory
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_available = 1
           AND LOWER(COALESCE(p.search_text, p.name)) LIKE ?
         ORDER BY p.is_featured DESC, p.created_at DESC
         LIMIT 8`
      )
      .all(needle)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Facets para el sidebar: categorías, subcategorías, marcas con conteos
router.get('/facets', (req, res, next) => {
  try {
    // Aplicamos filtros de categoría para que subcategorías y marcas reflejen el contexto.
    const { category } = req.query
    const where = ['p.is_available = 1']
    const params = []
    if (category) {
      const cats = String(category).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (cats.length) {
        where.push(`LOWER(c.name) IN (${cats.map(() => '?').join(',')})`)
        params.push(...cats)
      }
    }
    const whereClause = `WHERE ${where.join(' AND ')}`
    const join = 'FROM products p LEFT JOIN categories c ON p.category_id = c.id'

    const categories = db
      .prepare(
        `SELECT c.id, c.name, COUNT(p.id) as count
         FROM categories c LEFT JOIN products p
           ON p.category_id = c.id AND p.is_available = 1
         GROUP BY c.id ORDER BY c.display_order ASC`
      )
      .all()

    const subcategories = db
      .prepare(
        `SELECT p.subcategory as name, COUNT(*) as count
         ${join} ${whereClause} AND p.subcategory IS NOT NULL AND p.subcategory != ''
         GROUP BY p.subcategory ORDER BY count DESC`
      )
      .all(...params)

    const brands = db
      .prepare(
        `SELECT p.brand as name, COUNT(*) as count
         ${join} ${whereClause} AND p.brand IS NOT NULL AND p.brand != ''
         GROUP BY p.brand ORDER BY count DESC`
      )
      .all(...params)

    const priceRow = db
      .prepare(
        `SELECT MIN(p.price) as min_price, MAX(p.price) as max_price
         ${join} ${whereClause}`
      )
      .get(...params)

    res.json({
      categories,
      subcategories,
      brands,
      price_range: {
        min: priceRow?.min_price || 0,
        max: priceRow?.max_price || 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// Featured
router.get('/featured', (_req, res, next) => {
  try {
    const products = db
      .prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_featured = 1 AND p.is_available = 1
         ORDER BY p.created_at DESC LIMIT 8`
      )
      .all()
      .map(hydrateProduct)
    res.json(products)
  } catch (error) {
    next(error)
  }
})

// On sale
router.get('/on-sale', (_req, res, next) => {
  try {
    const products = db
      .prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_on_sale = 1 AND p.is_available = 1
         ORDER BY p.created_at DESC LIMIT 8`
      )
      .all()
      .map(hydrateProduct)
    res.json(products)
  } catch (error) {
    next(error)
  }
})

// Producto por slug amigable
router.get('/by-slug/:slug', (req, res, next) => {
  try {
    const product = db
      .prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?`
      )
      .get(req.params.slug)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(hydrateProduct(product))
  } catch (error) {
    next(error)
  }
})

// Productos relacionados (misma categoría; mayor score si comparten subcategoría, marca o tags).
router.get('/:id/related', (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 8))
    const current = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!current) return res.status(404).json({ error: 'Producto no encontrado' })

    const currentTags = parseTags(current.tags)
    const rows = db
      .prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id != ? AND p.is_available = 1
           AND (p.category_id = ? OR p.subcategory = ? OR p.brand = ?)
         LIMIT 40`
      )
      .all(current.id, current.category_id, current.subcategory, current.brand)
      .map(hydrateProduct)

    // Score manual para ordenar por cercanía semántica
    const scored = rows.map((r) => {
      let score = 0
      if (r.category_id && r.category_id === current.category_id) score += 3
      if (r.subcategory && r.subcategory === current.subcategory) score += 2
      if (r.brand && r.brand === current.brand) score += 1
      const shared = (r.tags || []).filter((t) => currentTags.includes(t)).length
      score += shared
      return { r, score }
    })
    scored.sort((a, b) => b.score - a.score)
    res.json(scored.slice(0, limit).map((s) => s.r))
  } catch (error) {
    next(error)
  }
})

// Single por id
router.get('/:id', (req, res, next) => {
  try {
    const product = db
      .prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`
      )
      .get(req.params.id)

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    res.json(hydrateProduct(product))
  } catch (error) {
    next(error)
  }
})

// Create
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(productCreateSchema),
  (req, res, next) => {
    try {
      const {
        name,
        description,
        price,
        original_price,
        unit,
        sale_type,
        price_per_kg,
        brand,
        reference,
        packaging,
        cold_chain,
        ingredients,
        gallery_urls,
        category_id,
        is_available,
        is_featured,
        is_on_sale,
        image_url,
        subcategory,
        external_code,
        tags,
        video_url,
        slug: providedSlug
      } = req.body

      const effectivePrice = sale_type === 'by_weight' ? price_per_kg : price
      const slug = uniqueSlug(db, providedSlug || name)
      const searchText = buildSearchText({
        name, brand, subcategory, reference, description, tags
      })

      const result = db
        .prepare(
          `INSERT INTO products
            (name, description, price, original_price, unit, sale_type, price_per_kg,
             brand, reference, packaging, cold_chain, ingredients, gallery_urls,
             category_id, is_available, is_featured, is_on_sale, image_url,
             subcategory, external_code, tags, video_url, slug, search_text)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          name,
          description || null,
          effectivePrice,
          original_price || null,
          sale_type === 'by_weight' ? 'kg' : unit || 'kg',
          sale_type || 'fixed',
          sale_type === 'by_weight' ? price_per_kg : null,
          brand || null,
          reference || null,
          packaging || null,
          cold_chain || 'refrigerado',
          ingredients || null,
          gallery_urls ? JSON.stringify(gallery_urls) : null,
          category_id || null,
          is_available !== false ? 1 : 0,
          is_featured ? 1 : 0,
          is_on_sale ? 1 : 0,
          image_url || null,
          subcategory || null,
          external_code || null,
          tags ? JSON.stringify(tags) : null,
          video_url || null,
          slug,
          searchText
        )

      const product = db
        .prepare('SELECT * FROM products WHERE id = ?')
        .get(result.lastInsertRowid)
      res.status(201).json(product)
    } catch (error) {
      next(error)
    }
  }
)

// Update
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(productUpdateSchema),
  (req, res, next) => {
    try {
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
      if (!existing) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      const merged = { ...existing, ...req.body }
      const saleType = merged.sale_type || 'fixed'
      const ppk = saleType === 'by_weight' ? merged.price_per_kg : null
      const finalPrice = saleType === 'by_weight' ? ppk || merged.price : merged.price

      const galleryToStore = Array.isArray(merged.gallery_urls)
        ? JSON.stringify(merged.gallery_urls)
        : merged.gallery_urls ?? null

      const tagsArr = Array.isArray(merged.tags) ? merged.tags : parseTags(merged.tags)
      const tagsToStore = tagsArr.length ? JSON.stringify(tagsArr) : null
      // Mantener slug estable salvo que venga uno nuevo o que el nombre haya cambiado y no exista.
      let slug = existing.slug
      if (req.body.slug && req.body.slug !== existing.slug) {
        slug = uniqueSlug(db, req.body.slug, req.params.id)
      } else if (!slug) {
        slug = uniqueSlug(db, merged.name, req.params.id)
      }
      const searchText = buildSearchText({
        name: merged.name,
        brand: merged.brand,
        subcategory: merged.subcategory,
        reference: merged.reference,
        description: merged.description,
        tags: tagsArr
      })

      db.prepare(
        `UPDATE products SET
          name = ?, description = ?, price = ?, original_price = ?, unit = ?,
          sale_type = ?, price_per_kg = ?,
          brand = ?, reference = ?, packaging = ?, cold_chain = ?, ingredients = ?, gallery_urls = ?,
          category_id = ?, is_available = ?, is_featured = ?, is_on_sale = ?, image_url = ?,
          subcategory = ?, external_code = ?, tags = ?, video_url = ?, slug = ?, search_text = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        merged.name,
        merged.description ?? null,
        finalPrice,
        merged.original_price ?? null,
        saleType === 'by_weight' ? 'kg' : merged.unit || 'kg',
        saleType,
        ppk,
        merged.brand ?? null,
        merged.reference ?? null,
        merged.packaging ?? null,
        merged.cold_chain ?? 'refrigerado',
        merged.ingredients ?? null,
        galleryToStore,
        merged.category_id ?? null,
        merged.is_available !== false ? 1 : 0,
        merged.is_featured ? 1 : 0,
        merged.is_on_sale ? 1 : 0,
        merged.image_url ?? null,
        merged.subcategory ?? null,
        merged.external_code ?? null,
        tagsToStore,
        merged.video_url ?? null,
        slug,
        searchText,
        req.params.id
      )

      const product = db
        .prepare(
          `SELECT p.*, c.name as category_name
           FROM products p LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.id = ?`
        )
        .get(req.params.id)

      res.json(hydrateProduct(product))
    } catch (error) {
      next(error)
    }
  }
)

// Delete
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    res.json({ message: 'Producto eliminado' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
