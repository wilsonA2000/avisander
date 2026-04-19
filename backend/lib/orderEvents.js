const { db } = require('../db/database')
const logger = require('./logger')

function log(orderId, eventType, {
  fromStatus = null,
  toStatus = null,
  fromPaymentStatus = null,
  toPaymentStatus = null,
  actorType = 'system',
  actorId = null,
  metadata = null
} = {}) {
  try {
    db.prepare(
      `INSERT INTO order_events
         (order_id, event_type, from_status, to_status,
          from_payment_status, to_payment_status,
          actor_type, actor_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orderId,
      eventType,
      fromStatus,
      toStatus,
      fromPaymentStatus,
      toPaymentStatus,
      actorType,
      actorId,
      metadata ? JSON.stringify(metadata) : null
    )
  } catch (err) {
    logger.error({ err, orderId, eventType }, 'No se pudo registrar order_event')
  }
}

function listByOrder(orderId) {
  const rows = db
    .prepare(
      `SELECT e.id, e.event_type, e.from_status, e.to_status,
              e.from_payment_status, e.to_payment_status,
              e.actor_type, e.actor_id, u.name AS actor_name,
              e.metadata, e.created_at
       FROM order_events e
       LEFT JOIN users u ON u.id = e.actor_id
       WHERE e.order_id = ?
       ORDER BY e.id ASC`
    )
    .all(orderId)
  return rows.map((r) => ({
    ...r,
    metadata: r.metadata ? safeParse(r.metadata) : null
  }))
}

function safeParse(s) {
  try { return JSON.parse(s) } catch { return null }
}

module.exports = { log, listByOrder }
