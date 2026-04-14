#!/usr/bin/env node
/**
 * Prueba rápida de SMTP: envía un email de prueba al destinatario que pases.
 *
 * Uso:
 *   npm run test:mail -- --to=destinatario@example.com
 *
 * Si SMTP no está configurado en .env, usa Ethereal (cuenta de prueba
 * que captura mensajes sin enviarlos a la inbox real; te da una URL para
 * ver el mensaje renderizado).
 */

require('dotenv').config()
const { validateEnv } = require('../lib/env')
validateEnv()

const { sendMail } = require('../lib/mailer')

const args = process.argv.slice(2)
const toArg = args.find((a) => a.startsWith('--to='))
const to = toArg ? toArg.slice('--to='.length) : process.env.ADMIN_NOTIFICATION_EMAIL

if (!to) {
  console.error('Falta destinatario. Usa: --to=email@dominio.com')
  console.error('O configura ADMIN_NOTIFICATION_EMAIL en .env')
  process.exit(1)
}

const now = new Date().toLocaleString('es-CO')

;(async () => {
  try {
    console.log(`\nEnviando email de prueba a: ${to}`)
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '(vacío → Ethereal)'}`)
    console.log(`SMTP_FROM: ${process.env.SMTP_FROM || '(default)'}\n`)

    const info = await sendMail({
      to,
      subject: '✅ SMTP de Avisander funciona',
      text: `Este es un email de prueba enviado el ${now}.

Si lo recibiste, tu SMTP está correctamente configurado.
— Avisander`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2 style="color:#b91c1c">✅ SMTP funciona</h2>
          <p>Este es un email de prueba enviado el <strong>${now}</strong>.</p>
          <p>Si lo recibiste, tu configuración SMTP está correcta y los siguientes eventos enviarán correos reales:</p>
          <ul>
            <li>Confirmación de pedido al cliente</li>
            <li>Notificación al admin cuando entre un pedido</li>
            <li>Recuperación de contraseña</li>
          </ul>
          <p style="color:#888;font-size:13px;margin-top:24px">— Avisander</p>
        </div>`
    })

    console.log('✓ Email enviado')
    console.log(`  messageId: ${info.messageId}`)
    if (info.previewUrl) {
      console.log(`  Preview (Ethereal): ${info.previewUrl}`)
    }
    process.exit(0)
  } catch (err) {
    console.error('\n✗ Error enviando email:')
    console.error(`  ${err.message}`)
    if (err.code === 'EAUTH') {
      console.error('  → Revisa SMTP_USER y SMTP_PASS. En SendGrid SMTP_USER debe ser literalmente "apikey".')
    }
    if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
      console.error('  → Revisa SMTP_HOST y SMTP_PORT. Verifica conectividad a internet.')
    }
    process.exit(1)
  }
})()
