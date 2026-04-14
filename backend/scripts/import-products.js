#!/usr/bin/env node
/**
 * Importador de productos desde Excel (.xls/.xlsx) del ERP de Avisander.
 *
 * Uso:
 *   node scripts/import-products.js --file='/ruta/a/productos.xls' --dry-run
 *   node scripts/import-products.js --file='/ruta/a/productos.xls'
 *
 * Idempotente: usa `external_code` como clave. Si ya existe un producto con ese código,
 * lo actualiza; si no, lo crea.
 *
 * Mapeo de columnas (índice base 0 del sheet Sheet1 del archivo del usuario):
 *   3  -> name (Descripción)
 *   4  -> external_code (Código numérico)
 *   5  -> price
 *   6  -> stock (actualmente vacío en fuente → ignorado)
 *  10  -> categoría (crear si no existe)
 *  11  -> subcategoría
 *  12  -> unit (Kg | Pieza) → mapea a sale_type (Kg → by_weight, Pieza → fixed)
 *  15  -> brand
 *  34  -> estado ("Activo" → is_available=1)
 */

require('dotenv').config()
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

const { validateEnv } = require('../lib/env')
validateEnv()

const { db, initialize } = require('../db/database')
const { slugify, uniqueSlug, buildSearchText } = require('../lib/productUtils')

initialize()

// --- args ---
const args = process.argv.slice(2)
const getArg = (name, def = null) => {
  const pref = `--${name}=`
  const hit = args.find((a) => a.startsWith(pref))
  if (hit) return hit.slice(pref.length)
  if (args.includes(`--${name}`)) return true
  return def
}

const file = getArg('file')
const dryRun = !!getArg('dry-run', false)

if (!file) {
  console.error('Falta --file=/ruta/al/archivo.xls')
  process.exit(1)
}
if (!fs.existsSync(file)) {
  console.error(`No existe el archivo: ${file}`)
  process.exit(1)
}

// --- leer ---
const wb = XLSX.readFile(file)
const sheetName = wb.SheetNames[0]
const ws = wb.Sheets[sheetName]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

if (rows.length < 2) {
  console.error('El archivo no tiene filas de datos.')
  process.exit(1)
}

const HEADER_ROW_INDEX = 0
const DATA_START = 1

// --- iconos por categoría para la tabla categories ---
const CATEGORY_ICONS = {
  'CARNE DE RES': '🥩',
  CERDO: '🐷',
  'POLLO FRESCO': '🍗',
  'POLLO MARINADO': '🍗',
  'VISCERAS POLLO': '🍗',
  'CARNES FRIAS': '🥓',
  CONGELADO: '🧊',
  LACTEOS: '🧀',
  FRUVER: '🥬',
  VARIOS: '📦'
}

// --- helpers ---
function getCategory(name) {
  const clean = String(name || '').trim()
  if (!clean) return null
  let row = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(clean)
  if (row) return row.id
  if (dryRun) {
    stats.categoriesWouldCreate.add(clean)
    return -1 // placeholder
  }
  const icon = CATEGORY_ICONS[clean.toUpperCase()] || '📦'
  const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), 0) AS m FROM categories').get().m
  const r = db
    .prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)')
    .run(clean, icon, maxOrder + 1)
  stats.categoriesCreated++
  return r.lastInsertRowid
}

function toNumber(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const stats = {
  totalRead: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  categoriesCreated: 0,
  categoriesWouldCreate: new Set()
}

const existingByCode = new Map()
db.prepare('SELECT id, external_code FROM products WHERE external_code IS NOT NULL')
  .all()
  .forEach((r) => existingByCode.set(String(r.external_code), r.id))

const insertStmt = db.prepare(
  `INSERT INTO products (
     external_code, name, description, price, original_price, unit,
     sale_type, price_per_kg, brand, subcategory, category_id,
     is_available, image_url, slug, search_text, tags
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

const updateStmt = db.prepare(
  `UPDATE products SET
     name = ?, price = ?, unit = ?, sale_type = ?, price_per_kg = ?,
     brand = ?, subcategory = ?, category_id = ?, is_available = ?,
     search_text = ?, updated_at = CURRENT_TIMESTAMP
   WHERE id = ?`
)

// --- procesamiento ---
console.log(`\nArchivo: ${file}`)
console.log(`Sheet: "${sheetName}" (${rows.length} filas totales incluyendo cabecera)`)
console.log(`Modo: ${dryRun ? 'DRY-RUN (no escribe)' : 'ESCRITURA REAL'}\n`)

const processRow = (arr, lineNo) => {
  try {
    const name = String(arr[3] || '').trim()
    if (!name) {
      stats.skipped++
      return
    }
    const externalCode = String(arr[4] || '').trim() || null
    const price = toNumber(arr[5])
    if (price == null || price <= 0) {
      stats.skipped++
      return
    }
    const categoryName = String(arr[10] || '').trim()
    const subcategory = String(arr[11] || '').trim() || null
    const unitRaw = String(arr[12] || '').trim()
    const brand = String(arr[15] || '').trim() || null
    const estado = String(arr[34] || '').trim()

    const isKg = /^kg$/i.test(unitRaw)
    const sale_type = isKg ? 'by_weight' : 'fixed'
    const price_per_kg = isKg ? price : null
    const unit = isKg ? 'kg' : (unitRaw || 'unidad').toLowerCase()
    const category_id = categoryName ? getCategory(categoryName) : null
    const is_available = estado.toLowerCase() === 'activo' ? 1 : 1 // default 1 si no se indica

    const existingId = externalCode ? existingByCode.get(externalCode) : null

    const searchText = buildSearchText({
      name,
      brand,
      subcategory,
      category_name: categoryName,
      tags: []
    })

    if (dryRun) {
      if (existingId) stats.updated++
      else stats.created++
      return
    }

    if (existingId) {
      updateStmt.run(
        name,
        price,
        unit,
        sale_type,
        price_per_kg,
        brand,
        subcategory,
        category_id > 0 ? category_id : null,
        is_available,
        searchText,
        existingId
      )
      stats.updated++
    } else {
      const slug = uniqueSlug(db, name)
      insertStmt.run(
        externalCode,
        name,
        null, // description
        price,
        null, // original_price
        unit,
        sale_type,
        price_per_kg,
        brand,
        subcategory,
        category_id > 0 ? category_id : null,
        is_available,
        null, // image_url
        slug,
        searchText,
        null // tags
      )
      stats.created++
    }
  } catch (e) {
    stats.errors++
    console.error(`Fila ${lineNo}: ${e.message}`)
  }
}

const tx = db.transaction((items) => {
  for (let i = 0; i < items.length; i++) {
    processRow(items[i], i + DATA_START + 1)
  }
})

const data = rows.slice(DATA_START)
stats.totalRead = data.length

if (dryRun) {
  for (let i = 0; i < data.length; i++) processRow(data[i], i + DATA_START + 1)
} else {
  tx(data)
}

// --- reporte ---
console.log('\n======= Resultado =======')
console.log(`  Leídos:            ${stats.totalRead}`)
console.log(`  ${dryRun ? 'Se crearían' : 'Creados'}:        ${stats.created}`)
console.log(`  ${dryRun ? 'Se actualizarían' : 'Actualizados'}:   ${stats.updated}`)
console.log(`  Saltados:          ${stats.skipped}`)
console.log(`  Errores:           ${stats.errors}`)
if (dryRun) {
  console.log(`  Categorías nuevas: ${stats.categoriesWouldCreate.size} (${[...stats.categoriesWouldCreate].join(', ')})`)
} else {
  console.log(`  Categorías nuevas: ${stats.categoriesCreated}`)
}
console.log('=========================\n')
