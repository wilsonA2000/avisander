const { db } = require('../db/database')
const logger = require('./logger')
const { sendMail, reviewInviteEmail } = require('./mailer')

// Busca órdenes completed con más de N días, cuyo dueño tenga email, y que no
// hayan recibido aún el email de invitación a reseñar. Inserta en review_invites
// (PK=order_id) para marcarlas como procesadas — así el cron es idempotente
// incluso si se ejecuta varias veces al día.
async function runOnce() {
  try {
    const delayRow = db.prepare("SELECT value FROM settings WHERE key = 'reviews_email_delay_days'").get()
    const delayDays = Math.max(0, Number(delayRow?.value) || 3)
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'reviews_email_enabled'").get()
    if (enabledRow?.value !== '1') return

    const appUrl = process.env.APP_URL || 'https://distribuidoraavisander.com'

    const candidates = db
      .prepare(
        `SELECT o.id, o.user_id, o.created_at,
                u.name AS user_name, u.email AS user_email
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN review_invites ri ON ri.order_id = o.id
         WHERE o.status = 'completed'
           AND u.email IS NOT NULL
           AND ri.order_id IS NULL
           AND o.created_at <= datetime('now', ? || ' days')
         ORDER BY o.created_at DESC
         LIMIT 50`
      )
      .all(`-${delayDays}`)

    for (const order of candidates) {
      const products = db
        .prepare('SELECT DISTINCT product_id AS id, product_name AS name FROM order_items WHERE order_id = ?')
        .all(order.id)

      const reviewUrl = `${appUrl}/mi-cuenta?tab=reviews&order=${order.id}`
      const mail = reviewInviteEmail({
        customerName: order.user_name,
        orderId: order.id,
        products,
        reviewUrl
      })

      try {
        await sendMail({ to: order.user_email, ...mail })
        db.prepare('INSERT OR IGNORE INTO review_invites (order_id) VALUES (?)').run(order.id)
        logger.info({ orderId: order.id, to: order.user_email }, 'Review invite enviado')
      } catch (err) {
        logger.warn({ err: err.message, orderId: order.id }, 'Fallo enviando review invite — reintentará próxima pasada')
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error en reviewInviteCron.runOnce')
  }
}

let timer = null
function start(intervalMs = 60 * 60 * 1000) {
  // Primera ejecución tras 2 min para no pegarle al startup.
  setTimeout(runOnce, 2 * 60 * 1000)
  timer = setInterval(runOnce, intervalMs)
}
function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

module.exports = { start, stop, runOnce }
