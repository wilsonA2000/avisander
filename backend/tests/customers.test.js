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

describe('CRM /api/customers', () => {
  let app, token

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    token = login.body.token
  })

  it('GET /api/customers requiere admin', async () => {
    const noauth = await request(app).get('/api/customers')
    expect(noauth.status).toBe(401)
  })

  it('GET /api/customers devuelve {items, total} con conteos', async () => {
    const res = await request(app)
      .get('/api/customers?per_page=10')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    // Cada item debe tener los campos agregados
    if (res.body.items.length > 0) {
      const c = res.body.items[0]
      expect(c).toHaveProperty('orders_count')
      expect(c).toHaveProperty('total_spent')
      expect(c).toHaveProperty('last_order_at')
    }
  })

  it('GET /api/customers/:id 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/customers/999999')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
