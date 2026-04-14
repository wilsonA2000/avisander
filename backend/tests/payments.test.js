import crypto from 'node:crypto'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'
// Llaves Bold de prueba
process.env.BOLD_IDENTITY_KEY = 'identity_test_abc123'
process.env.BOLD_SECRET_KEY = 'secret_test_xyz789'
process.env.BOLD_WEBHOOK_SECRET = 'test_webhook_secret'

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

const { initialize, db } = require('../db/database')
const { createApp } = require('../app')
const bold = require('../lib/bold')

describe('Bold Payments (Sprint 5)', () => {
  let app

  beforeAll(() => {
    initialize()
    app = createApp({ enableRateLimit: false })
  })

  it('isEnabled true cuando identity + secret están configuradas', () => {
    expect(bold.isEnabled()).toBe(true)
  })

  it('signIntegrity produce SHA256(orderId+amount+currency+secret)', () => {
    const sig = bold.signIntegrity({ orderId: 'AVI-1', amountInCents: 39400, currency: 'COP' })
    const expected = crypto
      .createHash('sha256')
      .update('AVI-139400COPsecret_test_xyz789')
      .digest('hex')
    expect(sig).toBe(expected)
  })

  it('verifyWebhook valida HMAC-SHA256 del body base64', () => {
    const body = JSON.stringify({ type: 'SALE_APPROVED', data: { metadata: { reference: 'AVI-1' } } })
    const buf = Buffer.from(body)
    const base64 = buf.toString('base64')
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(base64).digest('hex')
    expect(bold.verifyWebhook(buf, sig)).toBe(true)
    expect(bold.verifyWebhook(buf, 'firma-falsa'.padEnd(64, '0'))).toBe(false)
  })

  it('mapEventToStatus mapea correctamente', () => {
    expect(bold.mapEventToStatus('SALE_APPROVED')).toBe('approved')
    expect(bold.mapEventToStatus('SALE_REJECTED')).toBe('declined')
    expect(bold.mapEventToStatus('VOID_APPROVED')).toBe('voided')
    expect(bold.mapEventToStatus('OTRO')).toBe('pending')
  })

  it('GET /api/payments/config devuelve bold_enabled + identity_key', async () => {
    const res = await request(app).get('/api/payments/config')
    expect(res.status).toBe(200)
    expect(res.body.bold_enabled).toBe(true)
    expect(res.body.bold_identity_key).toBe('identity_test_abc123')
    expect(res.body.bold_widget_url).toContain('checkout.bold.co')
  })

  it('webhook sin x-bold-signature responde 401', async () => {
    const res = await request(app)
      .post('/api/payments/bold/webhook')
      .set('Content-Type', 'application/json')
      .send({ type: 'SALE_APPROVED' })
    expect(res.status).toBe(401)
  })

  it('webhook con firma inválida responde 401', async () => {
    const res = await request(app)
      .post('/api/payments/bold/webhook')
      .set('Content-Type', 'application/json')
      .set('x-bold-signature', 'firma-invalida'.padEnd(64, '0'))
      .send({ type: 'SALE_APPROVED', data: { metadata: { reference: 'nope' } } })
    expect(res.status).toBe(401)
  })

  it('webhook válido actualiza el pedido a approved', async () => {
    // Buscar un pedido existente
    const orderRow = db.prepare('SELECT id FROM orders LIMIT 1').get()
    if (!orderRow) return

    const ref = `AVI-${orderRow.id}-bold-test`
    db.prepare('UPDATE orders SET payment_reference = ? WHERE id = ?').run(ref, orderRow.id)

    const payload = {
      id: 'evt-123',
      type: 'SALE_APPROVED',
      subject: 'tx-abc',
      data: {
        payment_id: 'pay-xyz',
        metadata: { reference: ref }
      }
    }
    // Supertest re-serializa JSON si le pasamos objeto o Buffer con content-type json.
    // La firma debe calcularse sobre EL MISMO body que llega al server.
    // Truco: enviar como text/plain y que el middleware express.raw con type
    // application/json lo procese igual porque el Content-Type coincide.
    const body = JSON.stringify(payload)
    const base64 = Buffer.from(body).toString('base64')
    const sig = crypto.createHmac('sha256', 'test_webhook_secret').update(base64).digest('hex')

    const res = await request(app)
      .post('/api/payments/bold/webhook')
      .set('Content-Type', 'application/json')
      .set('x-bold-signature', sig)
      .send(body) // string plain, supertest NO lo re-serializa si es string

    expect(res.status).toBe(200)

    const updated = db
      .prepare('SELECT payment_status, payment_transaction_id FROM orders WHERE id = ?')
      .get(orderRow.id)
    expect(updated.payment_status).toBe('approved')
    expect(updated.payment_transaction_id).toBe('pay-xyz')
  })
})
