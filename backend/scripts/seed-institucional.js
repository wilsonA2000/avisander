// Siembra/actualiza la configuración institucional de Avisander y el stock inicial.
// Ejecutar: node scripts/seed-institucional.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { db, initialize } = require('../db/database')

initialize()

console.log('── Actualizando settings institucionales ──')

const SETTINGS = {
  store_name: 'DISTRIBUIDORA AVICOLA DE SANTANDER · AVISANDER',
  store_short_name: 'Avisander',
  store_address: 'Cra 30 #20-70 Local 2, San Alonso, Bucaramanga',
  store_lat: '7.1314031',
  store_lng: '-73.1173831',
  // Horario real: L-V 6:30AM-1PM y 3PM-8PM · S 6:30AM-1PM y 3PM-7PM · D cerrado
  business_hours_weekday: '6:30 AM – 1:00 PM y 3:00 PM – 8:00 PM',
  business_hours_saturday: '6:30 AM – 1:00 PM y 3:00 PM – 7:00 PM',
  business_hours_weekend: 'Domingos cerrado',
  business_hours_holiday: 'Festivos media jornada',
  whatsapp_number: '3123005253',
  delivery_cost: '4000'
}

const upsert = db.prepare(
  `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
)

for (const [k, v] of Object.entries(SETTINGS)) {
  upsert.run(k, v)
  console.log(`  ✓ ${k} = ${v}`)
}

console.log('\n── Alimentando stock inicial en productos sin stock ──')

const products = db.prepare('SELECT id, name, sale_type, stock FROM products').all()
let countPieza = 0
let countPeso = 0

const update = db.prepare(
  'UPDATE products SET stock = ? WHERE id = ? AND (stock IS NULL OR stock <= 0)'
)

for (const p of products) {
  const stock = Number(p.stock) || 0
  if (stock > 0) continue
  // by_weight: 2 kg mínimo. fixed: 2 unidades mínimo.
  const seedStock = p.sale_type === 'by_weight' ? 2 : 2
  update.run(seedStock, p.id)
  if (p.sale_type === 'by_weight') countPeso++
  else countPieza++
}

console.log(`  ✓ Pieza: ${countPieza} productos seteados a 2 und`)
console.log(`  ✓ Peso:  ${countPeso} productos seteados a 2 kg`)

console.log('\n── Reseteando métricas de prueba ──')

// Cancela órdenes con stock_deducted=1 que sean claramente de prueba
// (clientes generados por Playwright tienen email @test.com o pw-*@test.com).
const testCustomers = db
  .prepare("SELECT id FROM users WHERE email LIKE '%@test.com' OR email LIKE 'pw-%'")
  .all()
const testUserIds = testCustomers.map((u) => u.id)

let cancelled = 0
if (testUserIds.length > 0) {
  const ph = testUserIds.map(() => '?').join(',')
  const r = db
    .prepare(
      `UPDATE orders SET status = 'cancelled' WHERE user_id IN (${ph}) AND status != 'cancelled'`
    )
    .run(...testUserIds)
  cancelled = r.changes
}

console.log(`  ✓ ${cancelled} órdenes de prueba canceladas`)
console.log(`  (No se borran para preservar historial, solo se marcan cancelled)`)

console.log('\n✅ Seed institucional completado')
