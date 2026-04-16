// Helper de Bold Payments (pasarela colombiana — alternativa económica a Wompi).
// Docs: https://developers.bold.co
//
// Bold usa un botón HTML con atributos data-bold-* y firma SHA256 de integridad.
// El webhook verifica con HMAC-SHA256 sobre el body raw en Base64.

const crypto = require('crypto')

function config() {
  return {
    // "Llave de identidad" (pública, se embebe en el frontend)
    identityKey: process.env.BOLD_IDENTITY_KEY || null,
    // "Llave secreta" (privada, jamás al frontend)
    secretKey: process.env.BOLD_SECRET_KEY || null,
    // En sandbox Bold usa secret vacío para el webhook; en prod es la secret key
    webhookSecret: process.env.BOLD_WEBHOOK_SECRET ?? '',
    // URL del script del widget (siempre la misma)
    widgetUrl: 'https://checkout.bold.co/library/boldPaymentButton.js'
  }
}

function isEnabled() {
  const c = config()
  return !!(c.identityKey && c.secretKey)
}

/**
 * Firma de integridad del botón de pagos.
 * Fórmula: SHA256(orderId + amount + currency + secretKey)
 *
 * IMPORTANTE: para COP, `amount` va en PESOS ENTEROS (no centavos). Bold interpreta
 * el data-amount tal cual, y la firma debe usar el mismo valor — si no coincide,
 * la pasarela responde BTN-001 o BTN-002.
 *
 * @example
 *   signIntegrity({orderId:'AVI-1', amount:39400, currency:'COP'})
 */
function signIntegrity({ orderId, amount, currency = 'COP' }) {
  const { secretKey } = config()
  if (!secretKey) throw new Error('BOLD_SECRET_KEY no configurado')
  const concat = `${orderId}${amount}${currency}${secretKey}`
  return crypto.createHash('sha256').update(concat).digest('hex')
}

/**
 * Verifica la firma del webhook.
 * Header: x-bold-signature = HMAC-SHA256(base64(rawBody), webhookSecret) en hex.
 *
 * En sandbox Bold envía HMAC con secret vacío; en producción usa la llave secreta
 * del panel. Devuelve boolean.
 */
function verifyWebhook(rawBody, receivedSignature) {
  const { webhookSecret } = config()
  const base64Body = Buffer.isBuffer(rawBody)
    ? rawBody.toString('base64')
    : Buffer.from(String(rawBody)).toString('base64')
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(base64Body)
    .digest('hex')

  const got = String(receivedSignature || '')
  if (expected.length !== got.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))
  } catch {
    return false
  }
}

/**
 * Genera un orderId estable para Bold (max 60 chars, alfanum + guiones + underscores).
 */
function generateOrderId(dbOrderId) {
  return `AVI-${dbOrderId}-${Date.now()}`.slice(0, 60)
}

/**
 * Mapea el tipo de evento de Bold a nuestro payment_status interno.
 * Eventos: SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED
 */
function mapEventToStatus(eventType) {
  const map = {
    SALE_APPROVED: 'approved',
    SALE_REJECTED: 'declined',
    VOID_APPROVED: 'voided',
    VOID_REJECTED: 'error'
  }
  return map[eventType] || 'pending'
}

module.exports = {
  config,
  isEnabled,
  signIntegrity,
  verifyWebhook,
  generateOrderId,
  mapEventToStatus
}
