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

describe('PQRS tickets', () => {
  let app, token

  beforeAll(async () => {
    initialize()
    app = createApp({ enableRateLimit: false })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    token = login.body.token
  })

  it('POST /api/pqrs (público) crea ticket', async () => {
    const res = await request(app)
      .post('/api/pqrs')
      .send({
        type: 'queja',
        name: 'Tester PQRS',
        email: 'tester@example.com',
        phone: '3001112222',
        message: 'Este es un mensaje de prueba con más de diez caracteres.'
      })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeGreaterThan(0)
  })

  it('POST /api/pqrs rechaza mensaje corto', async () => {
    const res = await request(app)
      .post('/api/pqrs')
      .send({ type: 'peticion', name: 'T', email: 'x@y.com', message: 'corto' })
    expect(res.status).toBe(400)
  })

  it('POST /api/pqrs rechaza tipo inválido', async () => {
    const res = await request(app)
      .post('/api/pqrs')
      .send({
        type: 'hack',
        name: 'Tester',
        email: 'tester@example.com',
        message: 'Mensaje válido con más de diez caracteres.'
      })
    expect(res.status).toBe(400)
  })

  it('GET /api/pqrs requiere admin', async () => {
    const res = await request(app).get('/api/pqrs')
    expect(res.status).toBe(401)
  })

  it('GET /api/pqrs (admin) lista con filtro por tipo', async () => {
    const res = await request(app)
      .get('/api/pqrs?type=queja')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0].type).toBe('queja')
    }
  })

  it('PUT /api/pqrs/:id (admin) marca resuelto y setea resolved_at', async () => {
    const created = await request(app)
      .post('/api/pqrs')
      .send({
        type: 'reclamo',
        name: 'Tester',
        email: 'tester@example.com',
        message: 'Reclamo de prueba con más de diez caracteres.'
      })
    const id = created.body.id
    const res = await request(app)
      .put(`/api/pqrs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'resolved', admin_notes: 'Revisado y cerrado.' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('resolved')
    expect(res.body.resolved_at).toBeTruthy()
    expect(res.body.admin_notes).toBe('Revisado y cerrado.')
  })
})
