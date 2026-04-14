#!/usr/bin/env node
// Backup del SQLite con rotación: conserva los últimos 7.
// Uso: `npm run backup` (cron diario recomendado: 0 3 * * *)

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { pipeline } = require('stream/promises')
const Database = require('better-sqlite3')

const KEEP = Number(process.env.BACKUP_KEEP) || 7
const DB_PATH = path.join(__dirname, '..', 'database.sqlite')
const BACKUP_DIR = path.join(__dirname, '..', 'backups')

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[backup] No existe ${DB_PATH}. Nada que respaldar.`)
    process.exit(1)
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
  const tmpBackup = path.join(BACKUP_DIR, `db-${ts}.sqlite`)
  const gzPath = `${tmpBackup}.gz`

  // Usar Better-SQLite3 backup() API (consistente incluso con escrituras en vuelo)
  const db = new Database(DB_PATH, { readonly: true })
  await db.backup(tmpBackup)
  db.close()

  await pipeline(fs.createReadStream(tmpBackup), zlib.createGzip(), fs.createWriteStream(gzPath))
  fs.unlinkSync(tmpBackup)

  // Rotación: conservar solo los últimos KEEP .gz
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('db-') && f.endsWith('.sqlite.gz'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  const toDelete = files.slice(KEEP)
  for (const { f } of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, f))
  }

  console.log(`[backup] Creado ${path.basename(gzPath)} (conservando ${Math.min(files.length, KEEP)} backups, borrados ${toDelete.length})`)
}

main().catch((err) => {
  console.error('[backup] Error:', err)
  process.exit(1)
})
