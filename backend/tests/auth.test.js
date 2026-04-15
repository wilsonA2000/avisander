import crypto from 'node:crypto'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'

const { db, initialize } = require('../db/database')
const { createApp } = require('../app')

const makeEmail = () => `u${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`

describe('Auth & hardening', () => {
  let app
  let appLimited

  beforeAll(() => {
    initialize()
    app = createApp({ enableRateLimit: false })
    appLimited = createApp({ enableRateLimit: true })
  })

  beforeEach(() => {
    db.prepare("DELETE FROM users WHERE email LIKE 'u%@example.com' OR email LIKE 'ratelimit%'").run()
    db.prepare('DELETE FROM password_resets').run()
    db.prepare('DELETE FROM refresh_tokens').run()
  })

  it('register: rechaza password débil con detalles Zod', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: makeEmail(), password: 'abc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Datos inválidos')
    expect(Array.isArray(res.body.details)).toBe(true)
    expect(res.body.details.some((d) => d.path === 'password')).toBe(true)
  })

  it('register: acepta password conforme a policy y entrega tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: makeEmail(), password: 'Abcdef12', name: 'Test' })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
    expect(res.body.user.password_hash).toBeUndefined()
  })

  it('login: credenciales inválidas → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: 'Zzzzzzz1' })
    expect(res.status).toBe(401)
  })

  it('rate limit: tras 5 intentos fallidos responde 429', async () => {
    const email = `ratelimit-${Date.now()}@example.com`
    for (let i = 0; i < 5; i++) {
      await request(appLimited)
        .post('/api/auth/login')
        .send({ email, password: 'Wrongwrong1' })
    }
    const res = await request(appLimited)
      .post('/api/auth/login')
      .send({ email, password: 'Wrongwrong1' })
    expect(res.status).toBe(429)
  })

  it('forgot-password: no filtra si el email existe o no', async () => {
    const resNo = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nunca-existio@example.com' })
    expect(resNo.status).toBe(200)

    const email = makeEmail()
    await request(app).post('/api/auth/register').send({ email, password: 'Abcdef12' })
    const resYes = await request(app).post('/api/auth/forgot-password').send({ email })
    expect(resYes.status).toBe(200)
    expect(resYes.body.message).toBe(resNo.body.message)
  })

  it('reset-password: token inválido rechazado', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'deadbeef'.repeat(8), password: 'Abcdef12' })
    expect(res.status).toBe(400)
  })

  it('refresh: access token nuevo a partir del refresh; refresh revocado rechaza', async () => {
    const email = makeEmail()
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'Abcdef12' })
    const refreshToken = reg.body.refreshToken

    const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(r1.status).toBe(200)
    expect(r1.body.token).toBeDefined()
    expect(r1.body.refreshToken).toBeDefined()

    const r2 = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(r2.status).toBe(401)
  })

  it('settings GET público: solo devuelve claves whitelisted', async () => {
    const res = await request(app).get('/api/settings')
    expect(res.status).toBe(200)
    const keys = Object.keys(res.body)
    const allowed = [
      'delivery_cost',
      'business_hours_weekday',
      'business_hours_saturday',
      'business_hours_weekend',
      'business_hours_holiday',
      'delivery_hours',
      'whatsapp_number',
      'store_name',
      'store_short_name',
      'store_address',
      'store_lat',
      'store_lng',
      'free_shipping_threshold',
      'tax_rate'
    ]
    expect(keys.every((k) => allowed.includes(k))).toBe(true)
  })

  it('helmet: headers de seguridad presentes', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['strict-transport-security']).toBeDefined()
  })
})
