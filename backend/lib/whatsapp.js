// Genera un link wa.me para que el admin abra WhatsApp con el resumen del pedido.
// Por ahora no enviamos mensajes programáticamente (requeriría WhatsApp Business API);
// solo devolvemos un link clickeable que el admin usa desde su panel.

function whatsappAdminLink(phoneNumber, order) {
  if (!phoneNumber) return null
  const clean = String(phoneNumber).replace(/\D/g, '')
  const intl = clean.startsWith('57') ? clean : `57${clean}`
  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`

  const itemLines = (order.items || []).map((it) => {
    if (it.sale_type === 'by_weight') return `• ${it.product_name}: ${it.weight_grams}g = ${fmt(it.subtotal)}`
    return `• ${it.product_name} x${it.quantity} = ${fmt(it.subtotal)}`
  })

  const parts = [
    `🚨 *NUEVO PEDIDO #${order.id}*`,
    '',
    `👤 ${order.customer_name || 'Sin nombre'}`,
    order.customer_phone ? `📱 ${order.customer_phone}` : null,
    order.customer_address ? `📍 ${order.customer_address}` : null,
    '',
    '*Items:*',
    ...itemLines,
    '',
    `Subtotal + domicilio: ${fmt(order.delivery_cost)}`,
    `*TOTAL: ${fmt(order.total)}*`,
    `Pago: ${order.payment_method}`
  ].filter(Boolean)

  const msg = encodeURIComponent(parts.join('\n'))
  return `https://wa.me/${intl}?text=${msg}`
}

module.exports = { whatsappAdminLink }
