import crypto from 'node:crypto'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

const { initialize, db } = require('../db/database')
const { createApp } = require('../app')
const inventory = require('../lib/inventory')

describe('Inventario Fase A', () => {
  let app, token, productId, supplierId

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    token = login.body.token

    // Crear producto fresco aislado con stock=0 para este test
    const r = db
      .prepare(
        `INSERT INTO products (name, price, sale_type, stock, stock_min)
         VALUES (?, ?, 'fixed', 0, 5)`
      )
      .run(`Test Inv ${Date.now()}`, 10000)
    productId = r.lastInsertRowid

    const sup = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proveedor Test Inv', nit: '123-1' })
    supplierId = sup.body.id
  })

  it('Ajuste manual crea movimiento y actualiza stock', async () => {
    const res = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 15, type: 'adjustment', notes: 'Inicial' })
    expect(res.status).toBe(201)
    expect(res.body.balance_after).toBe(15)

    const prod = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId)
    expect(prod.stock).toBe(15)
  })

  it('Compra marcada como recibida suma stock y calcula cost_price promedio', async () => {
    const create = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplier_id: supplierId,
        reference: 'FAC-TEST',
        items: [{ product_id: productId, quantity: 10, unit_cost: 6000 }]
      })
    expect(create.status).toBe(201)
    const purchaseId = create.body.id
    expect(create.body.status).toBe('draft')

    const receive = await request(app)
      .post(`/api/purchases/${purchaseId}/receive`)
      .set('Authorization', `Bearer ${token}`)
    expect(receive.status).toBe(200)
    expect(receive.body.status).toBe('received')

    const prod = db.prepare('SELECT stock, cost_price FROM products WHERE id = ?').get(productId)
    expect(prod.stock).toBe(25) // 15 + 10
    // Promedio ponderado: (15*0 + 10*6000) / 25 = 2400
    expect(prod.cost_price).toBeCloseTo(2400, 0)
  })

  it('Ajuste con stock insuficiente devuelve 400', async () => {
    const res = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: -9999, type: 'waste', notes: 'Merma imposible' })
    expect(res.status).toBe(400)
  })

  it('Kardex retorna movimientos en orden descendente y saldos coherentes', async () => {
    const res = await request(app)
      .get(`/api/inventory/kardex/${productId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.movements.length).toBeGreaterThanOrEqual(2)
    expect(res.body.movements[0].balance_after).toBe(25)

    // Saldo final = suma de cantidades firmadas
    const sum = res.body.movements.reduce((acc, m) => acc + m.quantity, 0)
    expect(sum).toBe(res.body.product.stock)
  })

  it('recordSaleFromOrder descuenta stock desde una orden', async () => {
    const ord = db
      .prepare(
        `INSERT INTO orders (total, delivery_cost, status, delivery_method)
         VALUES (20000, 0, 'pending', 'pickup')`
      )
      .run()
    const orderId = ord.lastInsertRowid
    db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, sale_type, quantity, unit_price, subtotal)
       VALUES (?, ?, 'x', 'fixed', 2, 10000, 20000)`
    ).run(orderId, productId)

    const before = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId).stock
    inventory.recordSaleFromOrder({ orderId, userId: 1 })
    const after = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId).stock
    expect(after).toBe(before - 2)

    const lastMov = db
      .prepare(
        `SELECT * FROM inventory_movements WHERE product_id = ? ORDER BY id DESC LIMIT 1`
      )
      .get(productId)
    expect(lastMov.type).toBe('sale')
    expect(lastMov.reference_type).toBe('order')
    expect(lastMov.reference_id).toBe(orderId)
  })

  it('Filtro low_stock=1 solo devuelve productos bajo mínimo', async () => {
    // Dejar producto con stock=3 < stock_min=5
    const cur = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId).stock
    if (cur > 3) {
      await request(app)
        .post('/api/inventory/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product_id: productId,
          quantity: -(cur - 3),
          type: 'waste',
          notes: 'forzar low stock'
        })
    }

    const res = await request(app)
      .get('/api/inventory?low_stock=1')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const found = res.body.find((p) => p.id === productId)
    expect(found).toBeTruthy()
    expect(found.stock).toBeLessThanOrEqual(found.stock_min)
  })
})
