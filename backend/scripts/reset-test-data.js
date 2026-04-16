// Script para limpiar datos de test/pruebas de la BD.
// NO borra: admin user, categorías, settings, productos reales, ni cualquier
// usuario o pedido que no matche patrones de test.
//
// Uso: node scripts/reset-test-data.js
//
// Antes de correr: se espera que haya un backup manual en backups/.

const { db } = require('../db/database')

function run() {
  const tx = db.transaction(() => {
    // 1. Identificar IDs de productos test (patrones: "Test Inv", "Test Peso", "Test Pieza", etc.)
    const testProductIds = db
      .prepare(
        `SELECT id FROM products
         WHERE name LIKE 'Test %' OR name LIKE 'test %'
            OR name LIKE '%Test Inv%' OR name LIKE '%Test Peso%' OR name LIKE '%Test Pieza%'`
      )
      .all()
      .map((r) => r.id)
    console.log(`Productos test a borrar: ${testProductIds.length}`)

    // 2. Identificar clientes test (email contiene patterns típicos)
    const testUserIds = db
      .prepare(
        `SELECT id FROM users
         WHERE role = 'customer'
           AND (email LIKE '%test%' OR email LIKE '%example.com' OR email LIKE '%@test.com'
                OR name LIKE 'Test %' OR name LIKE 'Cliente Test%' OR name LIKE 'Cliente Prueba%'
                OR name = 'Flow')`
      )
      .all()
      .map((r) => r.id)
    console.log(`Clientes test a borrar: ${testUserIds.length}`)

    // 3. Identificar proveedores test
    const testSupplierIds = db
      .prepare(
        `SELECT id FROM suppliers
         WHERE name LIKE '%Test%' OR name LIKE '%test%' OR name LIKE '%prueba%'`
      )
      .all()
      .map((r) => r.id)
    console.log(`Proveedores test a borrar: ${testSupplierIds.length}`)

    // 4. Borrar TODAS las órdenes (son todas de pruebas según reporte del usuario)
    // Borrar order_items primero por FK (aunque hay ON DELETE CASCADE, explícito para evitar pragma issues)
    const totalOrders = db.prepare('SELECT COUNT(*) as n FROM orders').get().n
    console.log(`Pedidos a borrar: ${totalOrders}`)
    db.prepare('DELETE FROM order_items').run()
    db.prepare('DELETE FROM orders').run()

    // 5. Borrar movements relacionados a test products o a todas las órdenes
    // (las órdenes ya no existen, así que referencias quedaron huérfanas)
    const movsBefore = db.prepare('SELECT COUNT(*) as n FROM inventory_movements').get().n
    db.prepare(
      `DELETE FROM inventory_movements WHERE reference_type = 'order'`
    ).run()
    if (testProductIds.length > 0) {
      const placeholders = testProductIds.map(() => '?').join(',')
      db.prepare(
        `DELETE FROM inventory_movements WHERE product_id IN (${placeholders})`
      ).run(...testProductIds)
    }
    if (testSupplierIds.length > 0) {
      // movements de compras test
      const sph = testSupplierIds.map(() => '?').join(',')
      db.prepare(
        `DELETE FROM inventory_movements WHERE reference_type = 'purchase'
           AND reference_id IN (SELECT id FROM purchases WHERE supplier_id IN (${sph}))`
      ).run(...testSupplierIds)
    }
    const movsAfter = db.prepare('SELECT COUNT(*) as n FROM inventory_movements').get().n
    console.log(`Inventory movements borrados: ${movsBefore - movsAfter}`)

    // 6. Borrar compras+items de proveedores test
    if (testSupplierIds.length > 0) {
      const sph = testSupplierIds.map(() => '?').join(',')
      db.prepare(
        `DELETE FROM purchase_items WHERE purchase_id IN
           (SELECT id FROM purchases WHERE supplier_id IN (${sph}))`
      ).run(...testSupplierIds)
      db.prepare(`DELETE FROM purchases WHERE supplier_id IN (${sph})`).run(...testSupplierIds)
    }

    // 7. Borrar productos test (ya no tienen movements ni order_items referenciando)
    if (testProductIds.length > 0) {
      const ph = testProductIds.map(() => '?').join(',')
      // recipe_products referenciando
      db.prepare(`DELETE FROM recipe_products WHERE product_id IN (${ph})`).run(...testProductIds)
      // purchase_items que puedan referenciar
      db.prepare(`DELETE FROM purchase_items WHERE product_id IN (${ph})`).run(...testProductIds)
      db.prepare(`DELETE FROM products WHERE id IN (${ph})`).run(...testProductIds)
    }

    // 8. Borrar proveedores test
    if (testSupplierIds.length > 0) {
      const sph = testSupplierIds.map(() => '?').join(',')
      db.prepare(`DELETE FROM suppliers WHERE id IN (${sph})`).run(...testSupplierIds)
    }

    // 9. Borrar clientes test (+ sus refresh tokens y password resets por FK CASCADE)
    if (testUserIds.length > 0) {
      const uph = testUserIds.map(() => '?').join(',')
      db.prepare(`DELETE FROM users WHERE id IN (${uph})`).run(...testUserIds)
    }

    // 10. Resetear reservas de stock en productos reales (por si quedaron colgadas)
    db.prepare('UPDATE products SET reserved_stock = 0').run()
  })

  tx()
  console.log('\n=== ESTADO FINAL ===')
  console.log('Productos:', db.prepare('SELECT COUNT(*) as n FROM products').get().n)
  console.log('Pedidos:', db.prepare('SELECT COUNT(*) as n FROM orders').get().n)
  console.log('Clientes:', db.prepare("SELECT COUNT(*) as n FROM users WHERE role='customer'").get().n)
  console.log('Proveedores:', db.prepare('SELECT COUNT(*) as n FROM suppliers').get().n)
  console.log('Compras:', db.prepare('SELECT COUNT(*) as n FROM purchases').get().n)
  console.log('Inventory movements:', db.prepare('SELECT COUNT(*) as n FROM inventory_movements').get().n)
}

try {
  run()
  console.log('\n✓ Reset completado.')
} catch (err) {
  console.error('FALLÓ:', err)
  process.exit(1)
}
