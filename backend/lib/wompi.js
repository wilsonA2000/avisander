// Helper de Wompi (pasarela colombiana).
// Solo implementamos lo necesario: firma de integridad para el Widget y
// verificación del HMAC del webhook.
//
// Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/

const crypto = require('crypto')

function config() {
  return {
    publicKey: process.env.WOMPI_PUBLIC_KEY || null,
    privateKey: process.env.WOMPI_PRIVATE_KEY || null,
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET || null,
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || null,
    baseUrl: process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1'
  }
}

function isEnabled() {
  const c = config()
  return !!(c.publicKey && c.integritySecret)
}

// Firma para el Widget: sha256(reference + amountInCents + currency + integritySecret)
function signIntegrity({ reference, amountInCents, currency = 'COP' }) {
  const { integritySecret } = config()
  if (!integritySecret) throw new Error('WOMPI_INTEGRITY_SECRET no configurado')
  return crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest('hex')
}

// Verifica firma HMAC-SHA256 del webhook de eventos de Wompi
function verifyWebhook(event, receivedChecksum) {
  const { eventsSecret } = config()
  if (!eventsSecret) throw new Error('WOMPI_EVENTS_SECRET no configurado')
  if (!event?.signature?.properties || !event?.timestamp) return false

  const values = event.signature.properties.map((propPath) =>
    propPath.split('.').reduce((obj, key) => obj?.[key], event.data)
  )
  const concat = values.join('') + event.timestamp + eventsSecret
  const expected = crypto.createHash('sha256').update(concat).digest('hex')
  const got = String(receivedChecksum || '')
  if (expected.length !== got.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))
}

function generateReference(orderId) {
  return `AVI-${orderId}-${Date.now()}`
}

function mapStatus(wompiStatus) {
  const map = { APPROVED: 'approved', DECLINED: 'declined', VOIDED: 'voided', PENDING: 'pending', ERROR: 'error' }
  return map[wompiStatus] || 'pending'
}

module.exports = { config, isEnabled, signIntegrity, verifyWebhook, generateReference, mapStatus }
