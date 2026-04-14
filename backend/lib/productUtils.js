// Utilidades puras compartidas entre rutas, scripts de import y backfills.

function slugify(text) {
  if (!text) return ''
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// Deriva un slug único consultando existentes en BD (ignora el id actual para updates).
function uniqueSlug(db, base, ignoreId = null) {
  const baseSlug = slugify(base) || 'producto'
  const stmt = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1')
  let candidate = baseSlug
  let n = 2
  while (stmt.get(candidate, ignoreId || 0)) {
    candidate = `${baseSlug}-${n++}`
    if (n > 999) break
  }
  return candidate
}

// Indexa el producto para búsqueda por texto.
function buildSearchText(p) {
  const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '')
  const parts = [
    p.name,
    p.brand,
    p.subcategory,
    p.category_name,
    p.reference,
    p.description,
    tags
  ].filter(Boolean)
  return parts
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Parsea tags almacenados como JSON o CSV.
function parseTags(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : []
  } catch {
    // CSV fallback
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

module.exports = { slugify, uniqueSlug, buildSearchText, parseTags }
