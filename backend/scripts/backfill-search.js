#!/usr/bin/env node
// Backfill de slug y search_text para productos existentes sin estos campos.
// Idempotente: solo actualiza los que están vacíos o inconsistentes.

require('dotenv').config()
const { validateEnv } = require('../lib/env')
validateEnv()

const { db, initialize } = require('../db/database')
const { slugify, uniqueSlug, buildSearchText, parseTags } = require('../lib/productUtils')

initialize()

const rows = db.prepare('SELECT * FROM products').all()
console.log(`Procesando ${rows.length} productos…`)

let updated = 0
const tx = db.transaction(() => {
  for (const p of rows) {
    const tags = parseTags(p.tags)
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(p.category_id || 0)
    const category_name = cat?.name || null
    const newSearch = buildSearchText({ ...p, tags, category_name })
    let newSlug = p.slug
    if (!newSlug) newSlug = uniqueSlug(db, p.name, p.id)

    if (newSearch !== p.search_text || newSlug !== p.slug) {
      db.prepare('UPDATE products SET search_text = ?, slug = ? WHERE id = ?').run(
        newSearch,
        newSlug,
        p.id
      )
      updated++
    }
  }
})
tx()
console.log(`Actualizados: ${updated}/${rows.length}`)
