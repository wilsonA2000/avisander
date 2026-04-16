// Helpers de formato compartidos.

// SQLite con datetime('now') guarda en UTC pero sin sufijo 'Z', así que
// el Date de JS lo interpreta como hora local por defecto (bug de -5h en CO).
// Esta función normaliza el string al formato ISO 8601 con Z para que
// toLocaleString lo convierta correctamente a America/Bogota.
function parseServerDate(s) {
  if (!s) return null
  // Si ya trae Z o ±HH:MM lo dejamos pasar.
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s)
  // SQLite devuelve "YYYY-MM-DD HH:MM:SS" → lo convertimos a ISO UTC.
  return new Date(String(s).replace(' ', 'T') + 'Z')
}

export function fmtCOP(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`
}

export function fmtDate(s, opts = {}) {
  const d = parseServerDate(s)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
    ...opts
  })
}

export function fmtDateTime(s) {
  const d = parseServerDate(s)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  })
}

export function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
