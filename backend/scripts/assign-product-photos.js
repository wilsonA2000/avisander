#!/usr/bin/env node
/**
 * Asigna image_url a productos que no la tienen, usando fotos reales de Unsplash
 * mapeadas por palabra clave en el nombre del producto + categoría.
 *
 * - Idempotente: NUNCA sobrescribe productos que ya tienen image_url (respeta las
 *   fotos reales que hayas subido tú por /admin/productos).
 * - Flag --force para re-asignar igual (útil si quieres refrescar todo).
 *
 * Uso:
 *   npm run photos:assign               # asigna solo a productos sin foto
 *   npm run photos:assign -- --dry-run  # reporta sin escribir
 *   npm run photos:assign -- --force    # sobrescribe todas
 */

require('dotenv').config()
const { validateEnv } = require('../lib/env')
validateEnv()

const { db, initialize } = require('../db/database')
initialize()

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')

// IDs de fotos Unsplash (buscados manualmente, curated por tópico).
// Cada keyword apunta a un array; escogemos de forma estable un índice por nombre de producto
// para que un mismo producto siempre reciba la misma foto entre corridas.
const PHOTO_POOLS = {
  // === Pollo ===
  'pollo-ala': ['photo-1567620832903-9fc6debc209f', 'photo-1562967916-eb82221dfb92'],
  'pollo-pechuga': ['photo-1604503468506-a8da13d82791', 'photo-1587593810167-a84920ea0781'],
  'pollo-pierna': ['photo-1610057099443-fde8c4d50f91', 'photo-1601050690597-df0568f70950'],
  'pollo-muslo': ['photo-1598515214211-89d3c73ae83b', 'photo-1610057099443-fde8c4d50f91'],
  'pollo-entero': ['photo-1587593810167-a84920ea0781', 'photo-1604503468506-a8da13d82791'],
  'pollo-menudencia': ['photo-1601050690597-df0568f70950', 'photo-1598515214211-89d3c73ae83b'],
  'pollo-generico': ['photo-1587593810167-a84920ea0781', 'photo-1604503468506-a8da13d82791', 'photo-1610057099443-fde8c4d50f91'],

  // === Res ===
  'res-lomo': ['photo-1588168333986-5078d3ae3976', 'photo-1558030006-450675393462'],
  'res-costilla': ['photo-1603048719539-9ecb4aa395e3', 'photo-1558030006-450675393462'],
  'res-punta': ['photo-1615937657715-bc7b4b7962fd', 'photo-1603048719539-9ecb4aa395e3'],
  'res-solomito': ['photo-1558030006-450675393462', 'photo-1588168333986-5078d3ae3976'],
  'res-molida': ['photo-1603048297172-c92544798d5a', 'photo-1607623814075-e51df1bdc82f'],
  'res-chatas': ['photo-1529692236671-f1f6cf9683ba', 'photo-1615937657715-bc7b4b7962fd'],
  'res-pecho': ['photo-1603048297172-c92544798d5a', 'photo-1529692236671-f1f6cf9683ba'],
  'res-higado': ['photo-1558030006-450675393462', 'photo-1603048297172-c92544798d5a'],
  'res-generico': ['photo-1607623814075-e51df1bdc82f', 'photo-1588168333986-5078d3ae3976', 'photo-1558030006-450675393462', 'photo-1603048297172-c92544798d5a'],

  // === Cerdo ===
  'cerdo-costilla': ['photo-1544025162-d76694265947', 'photo-1555939594-58d7cb561ad1'],
  'cerdo-chuleta': ['photo-1544025162-d76694265947', 'photo-1607623488577-2fc55f39c1cc'],
  'cerdo-lomo': ['photo-1607623488577-2fc55f39c1cc', 'photo-1544025162-d76694265947'],
  'cerdo-tocino': ['photo-1528607929212-2636ec44253e', 'photo-1607623488577-2fc55f39c1cc'],
  'cerdo-generico': ['photo-1555939594-58d7cb561ad1', 'photo-1544025162-d76694265947', 'photo-1528607929212-2636ec44253e'],

  // === Embutidos / carnes frías ===
  'chorizo': ['photo-1599487488170-d11ec9c172f0', 'photo-1621852004158-f3bc188ace2d'],
  'salchicha': ['photo-1544378730-8b5104b18790', 'photo-1599487488170-d11ec9c172f0'],
  'jamon': ['photo-1528607929212-2636ec44253e', 'photo-1621852004158-f3bc188ace2d'],
  'salchichon': ['photo-1599487488170-d11ec9c172f0', 'photo-1621852004158-f3bc188ace2d'],
  'morcilla': ['photo-1599487488170-d11ec9c172f0'],
  'embutido-generico': ['photo-1599487488170-d11ec9c172f0', 'photo-1621852004158-f3bc188ace2d'],

  // === Huevos ===
  'huevo': ['photo-1587486913049-53fc88980cfc', 'photo-1498654200943-1088dd4438ae'],

  // === Lácteos / queso ===
  'queso': ['photo-1486297678162-eb2a19b0a32d', 'photo-1452195100486-9cc805987862'],
  'leche': ['photo-1563636619-e9143da7973b', 'photo-1550583724-b2692b85b150'],
  'mantequilla': ['photo-1589985270826-4b7bb135bc9d'],
  'yogurt': ['photo-1571212515416-fca325b5c27d'],
  'lacteo-generico': ['photo-1486297678162-eb2a19b0a32d', 'photo-1563636619-e9143da7973b'],

  // === Pescado / mariscos ===
  'pescado': ['photo-1603073163308-9654c3fb70b5', 'photo-1544943910-4c1dc44aab44'],
  'bagre': ['photo-1544943910-4c1dc44aab44', 'photo-1603073163308-9654c3fb70b5'],
  'mojarra': ['photo-1544943910-4c1dc44aab44'],

  // === Fruver ===
  'aguacate': ['photo-1523049673857-eb18f1d7b578', 'photo-1588196749597-9ff075ee6b5b'],
  'tomate': ['photo-1592924357228-91a4daadcfea', 'photo-1546094096-0df4bcaaa337'],
  'fruver-generico': ['photo-1542838132-92c53300491e', 'photo-1610348725531-843dff563e2c'],

  // === Varios / condimentos ===
  'adobo': ['photo-1532336414038-cf19250c5757'],
  'aceite': ['photo-1604908177453-7462950a6a3b', 'photo-1474979266404-7eaacbcd87c5'],
  'salsa': ['photo-1472476443507-c7a5948772fc'],
  'arroz': ['photo-1536304993881-ff6e9eefa2a6'],
  'panela': ['photo-1490474418585-ba9bad8fd0ea'],
  'vinagre': ['photo-1474979266404-7eaacbcd87c5'],

  // Fallback por categoría
  'fallback-res': ['photo-1607623814075-e51df1bdc82f'],
  'fallback-pollo': ['photo-1587593810167-a84920ea0781'],
  'fallback-cerdo': ['photo-1555939594-58d7cb561ad1'],
  'fallback-carnes-frias': ['photo-1599487488170-d11ec9c172f0'],
  'fallback-congelado': ['photo-1556024289-c0b15c32ff97'],
  'fallback-lacteos': ['photo-1486297678162-eb2a19b0a32d'],
  'fallback-fruver': ['photo-1542838132-92c53300491e'],
  'fallback-varios': ['photo-1604908176997-125f25cc6f3d']
}

// Reglas de mapeo: devuelve el pool key según el nombre del producto y la categoría.
function resolvePool(name, categoryName) {
  const n = String(name || '').toLowerCase()
  const c = String(categoryName || '').toLowerCase()

  // === POLLO ===
  if (c.includes('pollo') || c.includes('visceras pollo')) {
    if (n.includes('ala')) return 'pollo-ala'
    if (n.includes('pechuga')) return 'pollo-pechuga'
    if (n.includes('pierna') || n.includes('pernil')) return 'pollo-pierna'
    if (n.includes('muslo') || n.includes('contramuslo')) return 'pollo-muslo'
    if (n.includes('entero') || n.includes('campesino')) return 'pollo-entero'
    if (n.includes('menudencia') || n.includes('menud') || n.includes('hiel') || n.includes('corazon') || n.includes('molleja')) return 'pollo-menudencia'
    return 'pollo-generico'
  }

  // === RES ===
  if (c.includes('carne de res') || c.includes('res')) {
    if (n.includes('lomo')) return 'res-lomo'
    if (n.includes('costilla')) return 'res-costilla'
    if (n.includes('punta')) return 'res-punta'
    if (n.includes('solomito') || n.includes('solomo')) return 'res-solomito'
    if (n.includes('molida') || n.includes('molido')) return 'res-molida'
    if (n.includes('chata') || n.includes('bife')) return 'res-chatas'
    if (n.includes('pecho') || n.includes('falda')) return 'res-pecho'
    if (n.includes('higado') || n.includes('hígado')) return 'res-higado'
    return 'res-generico'
  }

  // === CERDO ===
  if (c.includes('cerdo') || n.includes('cerdo')) {
    if (n.includes('costilla')) return 'cerdo-costilla'
    if (n.includes('chuleta')) return 'cerdo-chuleta'
    if (n.includes('lomo')) return 'cerdo-lomo'
    if (n.includes('tocino') || n.includes('panceta')) return 'cerdo-tocino'
    return 'cerdo-generico'
  }

  // === CARNES FRÍAS / EMBUTIDOS ===
  if (c.includes('carnes frias') || c.includes('embutidos')) {
    if (n.includes('chorizo')) return 'chorizo'
    if (n.includes('salchicha')) return 'salchicha'
    if (n.includes('salchichon') || n.includes('salchichón')) return 'salchichon'
    if (n.includes('jamon') || n.includes('jamón')) return 'jamon'
    if (n.includes('morcilla')) return 'morcilla'
    if (n.includes('tocino')) return 'cerdo-tocino'
    return 'embutido-generico'
  }

  // === HUEVOS ===
  if (c.includes('huevo') || n.includes('huevo')) return 'huevo'

  // === LÁCTEOS ===
  if (c.includes('lacteos') || c.includes('lácteos')) {
    if (n.includes('queso')) return 'queso'
    if (n.includes('leche')) return 'leche'
    if (n.includes('mantequilla')) return 'mantequilla'
    if (n.includes('yogurt') || n.includes('yogur')) return 'yogurt'
    return 'lacteo-generico'
  }

  // === PESCADO ===
  if (n.includes('bagre')) return 'bagre'
  if (n.includes('mojarra')) return 'mojarra'
  if (n.includes('pescado') || n.includes('filete')) return 'pescado'

  // === FRUVER ===
  if (c.includes('fruver')) {
    if (n.includes('aguacate')) return 'aguacate'
    if (n.includes('tomate')) return 'tomate'
    return 'fruver-generico'
  }

  // === VARIOS ===
  if (n.includes('adobo') || n.includes('condimento')) return 'adobo'
  if (n.includes('aceite')) return 'aceite'
  if (n.includes('salsa')) return 'salsa'
  if (n.includes('arroz')) return 'arroz'
  if (n.includes('panela')) return 'panela'
  if (n.includes('vinagre')) return 'vinagre'

  // Fallback por categoría
  if (c.includes('res')) return 'fallback-res'
  if (c.includes('pollo')) return 'fallback-pollo'
  if (c.includes('cerdo')) return 'fallback-cerdo'
  if (c.includes('carnes frias') || c.includes('embutidos')) return 'fallback-carnes-frias'
  if (c.includes('congelado')) return 'fallback-congelado'
  if (c.includes('lacteos')) return 'fallback-lacteos'
  if (c.includes('fruver')) return 'fallback-fruver'
  return 'fallback-varios'
}

// Hash estable (simple) del nombre del producto → índice en el pool.
function hashIndex(name, modulus) {
  let h = 0
  for (const ch of String(name || '')) {
    h = (h * 31 + ch.charCodeAt(0)) | 0
  }
  return Math.abs(h) % modulus
}

function buildUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?w=800&h=800&q=75&auto=format&fit=crop`
}

// --- ejecución ---
const products = db
  .prepare(
    `SELECT p.id, p.name, p.image_url, c.name AS category_name
     FROM products p LEFT JOIN categories c ON p.category_id = c.id`
  )
  .all()

const update = db.prepare('UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')

const stats = { total: products.length, assigned: 0, skipped: 0, poolsUsed: {} }

const tx = db.transaction(() => {
  for (const p of products) {
    const hasPhoto = p.image_url && !p.image_url.startsWith('https://images.unsplash.com/')
    if (hasPhoto && !force) {
      stats.skipped++
      continue
    }

    const pool = resolvePool(p.name, p.category_name)
    const options = PHOTO_POOLS[pool] || PHOTO_POOLS['fallback-varios']
    const photoId = options[hashIndex(p.name, options.length)]
    const url = buildUrl(photoId)

    stats.poolsUsed[pool] = (stats.poolsUsed[pool] || 0) + 1

    if (dryRun) {
      console.log(`  [dry] ${p.name.padEnd(40)} → ${pool} (${photoId})`)
    } else {
      update.run(url, p.id)
    }
    stats.assigned++
  }
})

console.log(`\nProductos total: ${stats.total}`)
console.log(`Modo: ${dryRun ? 'DRY-RUN' : force ? 'FORCE' : 'REAL'}\n`)

if (!dryRun) tx()
else {
  for (const p of products) {
    const hasPhoto = p.image_url && !p.image_url.startsWith('https://images.unsplash.com/')
    if (hasPhoto && !force) { stats.skipped++; continue }
    const pool = resolvePool(p.name, p.category_name)
    stats.poolsUsed[pool] = (stats.poolsUsed[pool] || 0) + 1
    stats.assigned++
  }
}

console.log('\n======= Resumen =======')
console.log(`  Con foto nueva:  ${stats.assigned}`)
console.log(`  Saltados:        ${stats.skipped}`)
console.log('\n  Distribución por pool:')
Object.entries(stats.poolsUsed)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pool, n]) => console.log(`    ${pool.padEnd(30)} ${n}`))
console.log('=======================\n')
