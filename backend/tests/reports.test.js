import crypto from 'node:crypto'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

const { initialize } = require('../db/database')
const { createApp } = require('../app')

describe('Reports admin', () => {
  let app, token

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    token = login.body.token
  })

  it('GET /api/reports/summary requiere admin', async () => {
    const res = await request(app).get('/api/reports/summary')
    expect(res.status).toBe(401)
  })

  it('GET /api/reports/summary devuelve estructura esperada', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('range')
    expect(res.body.range).toHaveProperty('from')
    expect(res.body.range).toHaveProperty('to')
    expect(res.body.totals).toHaveProperty('revenue_gross')
    expect(res.body.totals).toHaveProperty('revenue_products')
    expect(res.body.totals).toHaveProperty('revenue_delivery')
    expect(res.body.totals).toHaveProperty('commissions_estimated')
    expect(res.body).toHaveProperty('by_payment_method')
    expect(res.body).toHaveProperty('by_status')
    expect(Array.isArray(res.body.series)).toBe(true)
  })

  it('series es consistente: last-day matches revenue sum', async () => {
    const res = await request(app)
      .get('/api/reports/summary?from=2020-01-01&to=2030-01-01')
      .set('Authorization', `Bearer ${token}`)
    const sum = res.body.series.reduce((a, s) => a + (s.revenue || 0), 0)
    expect(sum).toBe(res.body.totals.revenue_gross)
  })

  it('GET /api/reports/top-products devuelve array con campos clave', async () => {
    const res = await request(app)
      .get('/api/reports/top-products?limit=3&from=2020-01-01&to=2030-01-01')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('product_id')
      expect(res.body[0]).toHaveProperty('qty')
      expect(res.body[0]).toHaveProperty('revenue')
    }
  })
})
