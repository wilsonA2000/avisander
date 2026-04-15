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

describe('Validación payment_method en orders', () => {
  let app, byWeightProductId, fixedProductId

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    // Crea un producto by_weight con price_per_kg para que el cálculo no falle.
    const r1 = db
      .prepare(
        `INSERT INTO products (name, price, sale_type, price_per_kg, stock)
         VALUES (?, ?, 'by_weight', ?, 1000)`
      )
      .run(`Test Peso ${Date.now()}`, 30000, 30000)
    byWeightProductId = r1.lastInsertRowid

    const r2 = db
      .prepare(
        `INSERT INTO products (name, price, sale_type, stock) VALUES (?, ?, 'fixed', 1000)`
      )
      .run(`Test Pieza ${Date.now()}`, 12000)
    fixedProductId = r2.lastInsertRowid
  })

  it("rechaza payment_method='cash' (eliminado por política)", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: fixedProductId, name: 'X', sale_type: 'fixed', quantity: 1, price: 12000 }],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'cash'
      })
    expect(res.status).toBe(400)
  })

  it("rechaza by_weight + payment_method='bold'", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: byWeightProductId, name: 'Test Peso', sale_type: 'by_weight', weight_grams: 500 }],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'bold'
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/peso/i)
  })

  it("acepta by_weight + payment_method='whatsapp'", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: byWeightProductId, name: 'Test Peso', sale_type: 'by_weight', weight_grams: 500 }],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'whatsapp'
      })
    expect(res.status).toBe(201)
    expect(res.body.payment_method).toBe('whatsapp')
  })

  it("acepta carrito mixto (peso + pieza) con payment_method='whatsapp'", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: byWeightProductId, name: 'Test Peso', sale_type: 'by_weight', weight_grams: 300 },
          { product_id: fixedProductId, name: 'Test Pieza', sale_type: 'fixed', quantity: 2, price: 12000 }
        ],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'whatsapp'
      })
    expect(res.status).toBe(201)
  })

  it("rechaza carrito mixto con payment_method='bold'", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: byWeightProductId, name: 'Test Peso', sale_type: 'by_weight', weight_grams: 300 },
          { product_id: fixedProductId, name: 'Test Pieza', sale_type: 'fixed', quantity: 2, price: 12000 }
        ],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'bold'
      })
    expect(res.status).toBe(400)
  })

  it("acepta carrito solo-pieza con payment_method='bold'", async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: fixedProductId, name: 'Test Pieza', sale_type: 'fixed', quantity: 1, price: 12000 }],
        customer_name: 'Tester',
        customer_phone: '3001234567',
        delivery_method: 'pickup',
        payment_method: 'bold'
      })
    expect(res.status).toBe(201)
    expect(res.body.payment_method).toBe('bold')
  })
})
