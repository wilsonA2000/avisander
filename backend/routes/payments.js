// Rutas de pagos con Bold Payments.
// Bold es más económico que Wompi (PSE ~$900 fijo) y es Colombia-native.

const express = require('express')
const rateLimit = require('express-rate-limit')
const { db } = require('../db/database')
const bold = require('../lib/bold')
const logger = require('../lib/logger')
const inventory = require('../lib/inventory')
const stockReservation = require('../lib/stockReservation')
const { clientIp } = require('../lib/client-ip')
const orderEvents = require('../lib/orderEvents')

const router = express.Router()

const reconcileLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: 'Demasiadas reconciliaciones. Esperá un minuto.' }
})

const transactionLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp
})

// Config pública: el frontend consulta esto para saber si mostrar el botón Bold
router.get('/config', (_req, res) => {
  const cfg = bold.config()
  res.json({
    bold_enabled: bold.isEnabled(),
    bold_identity_key: bold.isEnabled() ? cfg.identityKey : null,
    bold_widget_url: cfg.widgetUrl
  })
})

// Consulta estado de transacción por reference (la usa /pago/:reference del frontend)
router.get('/transaction/:reference', transactionLimiter, (req, res) => {
  const order = db
    .prepare('SELECT id, payment_status, payment_transaction_id, payment_paid_at, total FROM orders WHERE payment_reference = ?')
    .get(req.params.reference)
  if (!order) return res.status(404).json({ error: 'Referencia no encontrada' })
  res.json({
    reference: req.params.reference,
    order_id: order.id,
    status: order.payment_status,
    transaction_id: order.payment_transaction_id,
    paid_at: order.payment_paid_at,
    total: order.total
  })
})

// Reconciliación manual: consulta a Bold el estado real y actualiza nuestra BD.
// El frontend puede llamar este endpoint tras volver del checkout si el webhook
// aún no ha llegado (común en sandbox). Es idempotente.
router.post('/reconcile/:reference', reconcileLimiter, async (req, res) => {
  try {
    const reference = req.params.reference
    const order = db
      .prepare('SELECT id, payment_status, stock_deducted FROM orders WHERE payment_reference = ?')
      .get(reference)
    if (!order) return res.status(404).json({ error: 'Referencia no encontrada' })
    // Si ya está aprobada, no hace falta volver a consultar Bold.
    if (order.payment_status === 'approved') {
      return res.json({ ok: true, status: 'approved', order_id: order.id, source: 'cache' })
    }

    const boldStatus = await bold.fetchTransactionStatus(reference)
    if (!boldStatus) {
      return res.json({ ok: false, status: order.payment_status, message: 'Bold aún no tiene registro de esta transacción.' })
    }

    // Aplicar el mismo cambio que haría el webhook.
    const paidAt = boldStatus.status === 'approved' ? (boldStatus.paidAt || new Date().toISOString()) : null
    db.prepare(
      `UPDATE orders SET
         payment_status = ?,
         payment_transaction_id = COALESCE(?, payment_transaction_id),
         payment_paid_at = COALESCE(?, payment_paid_at)
       WHERE payment_reference = ?`
    ).run(boldStatus.status, boldStatus.transactionId, paidAt, reference)

    if (boldStatus.status === 'approved' && !order.stock_deducted) {
      try {
        stockReservation.releaseReservation(order.id)
        inventory.recordSaleFromOrder({ orderId: order.id, userId: null })
        db.prepare('UPDATE orders SET stock_deducted = 1 WHERE id = ?').run(order.id)
        logger.info({ orderId: order.id, via: 'reconcile' }, 'Stock descontado por reconciliación manual')
      } catch (err) {
        logger.error({ err, orderId: order.id }, 'Fallo al descontar stock en reconciliación')
      }
    }
    if (['declined', 'voided', 'error'].includes(boldStatus.status) && !order.stock_deducted) {
      try { stockReservation.releaseReservation(order.id) } catch (_e) {}
    }

    if (boldStatus.status !== order.payment_status) {
      orderEvents.log(order.id, 'bold_reconcile', {
        fromPaymentStatus: order.payment_status,
        toPaymentStatus: boldStatus.status,
        actorType: 'bold_reconcile',
        metadata: { transactionId: boldStatus.transactionId || null }
      })
    }

    res.json({ ok: true, status: boldStatus.status, order_id: order.id, source: 'bold-api' })
  } catch (error) {
    logger.error({ err: error }, 'Reconcile Bold error')
    res.status(500).json({ error: 'Error en reconciliación' })
  }
})

// Webhook de Bold.
// IMPORTANTE: para verificar la firma HMAC necesitamos el body RAW, no parseado.
// Por eso esta ruta usa express.raw en vez del express.json global.
router.post(
  '/bold/webhook',
  express.raw({ type: 'application/json', limit: '100kb' }),
  (req, res) => {
    try {
      const signature = req.headers['x-bold-signature']
      if (!signature) {
        logger.warn('Bold webhook sin x-bold-signature')
        return res.status(401).json({ error: 'Firma requerida' })
      }

      const valid = bold.verifyWebhook(req.body, signature)
      if (!valid) {
        logger.warn({ sig: String(signature).slice(0, 12) }, 'Bold webhook con firma inválida')
        return res.status(401).json({ error: 'Firma inválida' })
      }

      const event = JSON.parse(req.body.toString('utf8'))
      const type = event.type
      const data = event.data || {}
      const reference = data?.metadata?.reference

      if (!reference) {
        logger.warn({ type }, 'Bold webhook sin metadata.reference — ignorado')
        return res.json({ ok: true, ignored: true })
      }

      const newStatus = bold.mapEventToStatus(type)
      const paidAt = newStatus === 'approved' ? new Date().toISOString() : null
      const txId = data.payment_id || event.subject || null

      const upd = db
        .prepare(
          `UPDATE orders SET
             payment_status = ?,
             payment_transaction_id = ?,
             payment_paid_at = COALESCE(?, payment_paid_at)
           WHERE payment_reference = ?`
        )
        .run(newStatus, txId, paidAt, reference)

      if (upd.changes === 0) {
        logger.warn({ reference }, 'Bold webhook para referencia no encontrada')
      } else {
        logger.info({ reference, newStatus, type }, 'Pedido actualizado por webhook Bold')

        const orderRow = db
          .prepare('SELECT id FROM orders WHERE payment_reference = ?')
          .get(reference)
        if (orderRow) {
          orderEvents.log(orderRow.id, 'bold_webhook', {
            toPaymentStatus: newStatus,
            actorType: 'bold_webhook',
            metadata: { bold_event_type: type, payment_id: txId }
          })
        }

        // Al aprobar el pago: descontar stock una sola vez (idempotente).
        if (newStatus === 'approved') {
          const order = db
            .prepare('SELECT id, stock_deducted FROM orders WHERE payment_reference = ?')
            .get(reference)
          if (order && !order.stock_deducted) {
            try {
              // Liberar reserva antes de descontar: evita doble bloqueo
              // (reserva + stock descontado) del mismo pedido.
              stockReservation.releaseReservation(order.id)
              inventory.recordSaleFromOrder({ orderId: order.id, userId: null })
              db.prepare('UPDATE orders SET stock_deducted = 1 WHERE id = ?').run(order.id)
              logger.info({ orderId: order.id }, 'Stock descontado por pago aprobado')
            } catch (err) {
              logger.error({ err, orderId: order.id }, 'Fallo al descontar stock; revisar manualmente')
            }
          }
        }

        // Pago rechazado / anulado / error: liberar la reserva para que el
        // stock vuelva al pool disponible.
        if (['declined', 'voided', 'error'].includes(newStatus)) {
          const order = db
            .prepare('SELECT id, stock_deducted FROM orders WHERE payment_reference = ?')
            .get(reference)
          if (order && !order.stock_deducted) {
            try { stockReservation.releaseReservation(order.id) } catch (_e) { /* noop */ }
          }
        }
      }

      // Bold requiere HTTP 200 en < 2s o reintenta
      res.json({ ok: true, updated: upd.changes })
    } catch (error) {
      logger.error({ err: error }, 'Webhook Bold error')
      res.status(500).json({ error: 'Error procesando webhook' })
    }
  }
)

module.exports = router
