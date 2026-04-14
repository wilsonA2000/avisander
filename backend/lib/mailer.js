const nodemailer = require('nodemailer')
const logger = require('./logger')

let transporterPromise = null

async function getTransporter() {
  if (transporterPromise) return transporterPromise
  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      })
    }
    // Sin SMTP: en test usamos jsonTransport (no hay red); en dev, Ethereal.
    if (process.env.NODE_ENV === 'test') {
      return nodemailer.createTransport({ jsonTransport: true })
    }
    const test = await nodemailer.createTestAccount()
    logger.warn(
      { previewUser: test.user },
      'SMTP no configurado: usando cuenta Ethereal de prueba (solo desarrollo)'
    )
    return nodemailer.createTransport({
      host: test.smtp.host,
      port: test.smtp.port,
      secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass }
    })
  })()
  return transporterPromise
}

async function sendMail({ to, subject, html, text }) {
  const transporter = await getTransporter()
  const from = process.env.SMTP_FROM || 'Avisander <no-reply@avisander.com>'
  const info = await transporter.sendMail({ from, to, subject, html, text })
  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) logger.info({ previewUrl }, 'Preview de email disponible (Ethereal)')
  // Devolvemos info con previewUrl para que los callers puedan mostrarlo en dev
  return { ...info, previewUrl }
}

function passwordResetEmail({ name, resetUrl }) {
  const greet = name ? `Hola ${name},` : 'Hola,'
  const text = `${greet}

Recibimos una solicitud para restablecer tu contraseña en Avisander.
Abre este enlace (válido por 1 hora) para crear una nueva contraseña:

${resetUrl}

Si no fuiste tú, puedes ignorar este mensaje.

— Avisander, Carnicería Premium`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
      <h2 style="color:#b91c1c;margin:0 0 16px">Avisander</h2>
      <p>${greet}</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente botón para crear una nueva (válido 1 hora):</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#b91c1c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Restablecer contraseña</a></p>
      <p style="font-size:13px;color:#666">Si el botón no funciona, copia y pega este enlace:<br>${resetUrl}</p>
      <p style="font-size:13px;color:#666">Si no fuiste tú, ignora este mensaje.</p>
    </div>`
  return { subject: 'Restablece tu contraseña — Avisander', text, html }
}

// ===== Templates de pedidos (Sprint 4) =====

function fmtCOP(n) {
  return `$${Number(n || 0).toLocaleString('es-CO')}`
}
function itemsHtml(items) {
  return (items || []).map((it) => {
    const detail = it.sale_type === 'by_weight'
      ? `${it.weight_grams} g`
      : `${it.quantity} ${it.product_name.length ? 'x' : ''}`
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${it.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${detail}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmtCOP(it.subtotal)}</td>
    </tr>`
  }).join('')
}

function orderAdminEmail(order, waLink) {
  const subject = `🚨 Nuevo pedido #${order.id} — ${fmtCOP(order.total)}`
  const text = `Nuevo pedido #${order.id}
Cliente: ${order.customer_name || 'Sin nombre'}
Tel: ${order.customer_phone || '—'}
Dirección: ${order.customer_address || '—'}
Total: ${fmtCOP(order.total)}
Pago: ${order.payment_method}

Abrir WhatsApp: ${waLink || 'N/A'}`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px">
      <h2 style="color:#b91c1c;margin:0 0 6px">Nuevo pedido #${order.id}</h2>
      <p style="color:#666;margin:0 0 20px">Se recibió un nuevo pedido en Avisander.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:6px 0;color:#888">Cliente</td><td><strong>${order.customer_name || '—'}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">Teléfono</td><td>${order.customer_phone || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Dirección</td><td>${order.customer_address || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Entrega</td><td>${order.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Domicilio'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Pago</td><td>${order.payment_method}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f8f8f8">
          <th style="padding:8px 12px;text-align:left;font-size:13px">Producto</th>
          <th style="padding:8px 12px;text-align:left;font-size:13px">Cantidad</th>
          <th style="padding:8px 12px;text-align:right;font-size:13px">Subtotal</th>
        </tr></thead>
        <tbody>${itemsHtml(order.items)}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px 12px;text-align:right;color:#666">Domicilio</td><td style="padding:8px 12px;text-align:right">${fmtCOP(order.delivery_cost)}</td></tr>
          <tr><td colspan="2" style="padding:12px;text-align:right;font-weight:700">TOTAL</td><td style="padding:12px;text-align:right;font-weight:700;color:#b91c1c">${fmtCOP(order.total)}</td></tr>
        </tfoot>
      </table>
      ${waLink ? `<p style="margin-top:24px"><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Abrir WhatsApp con el cliente</a></p>` : ''}
    </div>`
  return { subject, text, html }
}

function orderCustomerEmail(order, customerName) {
  const subject = `✓ Pedido #${order.id} recibido — Avisander`
  const greet = customerName ? `Hola ${customerName},` : 'Hola,'
  const text = `${greet}

Recibimos tu pedido #${order.id} por ${fmtCOP(order.total)}.
Te contactaremos en breve por WhatsApp para coordinar la entrega.

¡Gracias por preferirnos!
— Avisander`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#222">
      <h2 style="color:#b91c1c;margin:0 0 8px">¡Pedido recibido! 🥩</h2>
      <p>${greet}</p>
      <p>Recibimos tu pedido <strong>#${order.id}</strong> por <strong>${fmtCOP(order.total)}</strong>.</p>
      <p style="color:#666">Te contactaremos por WhatsApp en minutos para confirmar detalles y coordinar la entrega.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead><tr style="background:#f8f8f8"><th style="padding:8px 12px;text-align:left;font-size:13px">Producto</th><th style="padding:8px 12px;text-align:right;font-size:13px">Subtotal</th></tr></thead>
        <tbody>${(order.items || []).map((it) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${it.product_name}${it.sale_type === 'by_weight' ? ` (${it.weight_grams}g)` : ` x${it.quantity}`}</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #eee">${fmtCOP(it.subtotal)}</td></tr>`).join('')}</tbody>
      </table>
      <p style="margin-top:20px;color:#888;font-size:13px">Gracias por elegir Avisander — Carnicería Premium en Bucaramanga.</p>
    </div>`
  return { subject, text, html }
}

module.exports = { sendMail, passwordResetEmail, orderAdminEmail, orderCustomerEmail }
