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

describe('Perfil: GET/PUT /api/auth/me', () => {
  let app, token

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    token = login.body.token
  })

  it('GET /api/auth/me requiere token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/auth/me devuelve campos de perfil incluyendo avatar_url', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user).toHaveProperty('avatar_url')
    expect(res.body.user).toHaveProperty('phone')
    expect(res.body.user).toHaveProperty('address')
    expect(res.body.user.email).toBe('admin@avisander.com')
  })

  it('PUT /api/auth/me actualiza name, phone, address, avatar_url', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        phone: '3101112222',
        address: 'Calle Test 123',
        avatar_url: '/uploads/avatar-test.jpg'
      })
    expect(res.status).toBe(200)
    expect(res.body.user.phone).toBe('3101112222')
    expect(res.body.user.address).toBe('Calle Test 123')
    expect(res.body.user.avatar_url).toBe('/uploads/avatar-test.jpg')
  })

  it('PUT /api/auth/me ignora intentos de cambiar role/email', async () => {
    // role y email NO están en el schema, se ignoran silenciosamente (stripping Zod).
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'customer', email: 'hacker@evil.com', name: 'Administrador' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('admin')
    expect(res.body.user.email).toBe('admin@avisander.com')
  })

  it('PUT /api/auth/me rechaza nombre vacío', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })
    expect(res.status).toBe(400)
  })
})
