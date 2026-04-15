const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { orderCreateSchema, orderStatusSchema } = require('../schemas/order')
const { quoteDelivery } = require('../lib/delivery')
const bold = require('../lib/bold')
const inventory = require('../lib/inventory')
// Nota: el body del webhook /api/payments/bold/webhook se recibe como RAW Buffer
// (ver exclusión del express.json global en app.js) para poder verificar HMAC-SHA256.
const { sendMail, orderAdminEmail, orderCustomerEmail } = require('../lib/mailer')
const { whatsappAdminLink } = require('../lib/whatsapp')
const logger = require('../lib/logger')

const router = express.Router()

router.get('/', authenticateToken, (req, res, next) => {
  try {
    let orders
    if (req.user.role === 'admin') {
      orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    } else {
      orders = db
        .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.user.id)
    }
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
    res.json(orders.map((o) => ({ ...o, items: getItems.all(o.id) })))
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    res.json(order)
  } catch (error) {
    next(error)
  }
})

router.post('/', optionalAuth, validate(orderCreateSchema), (req, res, next) => {
  try {
    const {
      items,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      delivery_method = 'delivery',
      delivery_lat,
      delivery_lng,
      delivery_city,
      payment_method = 'whatsapp'
    } = req.body

    // Defensa en profundidad: productos por peso solo se cobran por WhatsApp.
    // El frontend ya lo bloquea, pero un cliente con DevTools podría intentar saltárselo.
    const hasByWeight = items.some((it) => (it.sale_type || 'fixed') === 'by_weight')
    if (hasByWeight && payment_method !== 'whatsapp') {
      const e = new Error(
        'Los productos por peso solo se pueden coordinar por WhatsApp (el peso real puede variar). Cambia el método de pago a WhatsApp o quita los productos por peso.'
      )
      e.status = 400
      throw e
    }

    // Defensa en profundidad: validar stock antes de crear la orden.
    // Productos by_weight no aplican (stock se descuenta en kg al cortar).
    const stockErrors = []
    for (const it of items) {
      if (!it.product_id) continue
      if ((it.sale_type || 'fixed') === 'by_weight') continue
      const prod = db
        .prepare('SELECT id, name, stock, is_available FROM products WHERE id = ?')
        .get(it.product_id)
      if (!prod) {
        stockErrors.push(`Producto ${it.product_id} no existe`)
        continue
      }
      if (prod.is_available === 0) {
        stockErrors.push(`"${prod.name}" no está disponible`)
        continue
      }
      const stock = Number(prod.stock) || 0
      if (stock <= 0) {
        stockErrors.push(`"${prod.name}" sin stock`)
      } else if (it.quantity > stock) {
        stockErrors.push(`"${prod.name}" solo tiene ${stock} en stock (pediste ${it.quantity})`)
      }
    }
    if (stockErrors.length > 0) {
      const e = new Error(stockErrors.join(' · '))
      e.status = 400
      e.code = 'insufficient_stock'
      throw e
    }

    let subtotal = 0
    const orderItems = items.map((item) => {
      const saleType = item.sale_type || 'fixed'
      let unitPrice
      let qty
      let weightGrams = null
      let itemSubtotal

      if (saleType === 'by_weight') {
        // Para peso variable, el precio NO se confía al cliente.
        // Recalculamos a partir del price_per_kg actual del producto en BD.
        const product = item.product_id
          ? db.prepare('SELECT price_per_kg FROM products WHERE id = ?').get(item.product_id)
          : null
        const pricePerKg = product?.price_per_kg
        if (!pricePerKg) {
          const e = new Error(`Producto "${item.name}" no tiene price_per_kg configurado`)
          e.status = 400
          throw e
        }
        weightGrams = item.weight_grams
        qty = weightGrams / 1000 // en kg para registro
        unitPrice = pricePerKg
        itemSubtotal = (pricePerKg * weightGrams) / 1000
      } else {
        qty = item.quantity
        unitPrice = item.price
        itemSubtotal = unitPrice * qty
      }

      subtotal += itemSubtotal
      return {
        product_id: item.product_id || null,
        product_name: item.name,
        sale_type: saleType,
        quantity: qty,
        weight_grams: weightGrams,
        unit_price: unitPrice,
        subtotal: itemSubtotal,
        notes: item.notes || null
      }
    })

    // Calcular costo de domicilio en backend (autoridad).
    // - pickup: 0
    // - delivery: requiere lat/lng; usa quoteDelivery; bloquea si está fuera de cobertura
    let delivery_cost = 0
    let distance_km = null
    let resolved_city = delivery_city || null

    if (delivery_method === 'delivery') {
      if (typeof delivery_lat !== 'number' || typeof delivery_lng !== 'number') {
        const e = new Error('Para domicilio se requiere ubicación (lat/lng).')
        e.status = 400
        throw e
      }
      const quote = quoteDelivery({
        lat: delivery_lat,
        lng: delivery_lng,
        city: delivery_city,
        subtotal
      })
      if (!quote.in_coverage) {
        const e = new Error(quote.reason || 'Dirección fuera del área de cobertura.')
        e.status = 400
        throw e
      }
      delivery_cost = quote.cost
      distance_km = quote.distance_km
      resolved_city = quote.city
    }

    const total = subtotal + delivery_cost

    const result = db
      .prepare(
        `INSERT INTO orders
          (user_id, total, delivery_cost, customer_name, customer_phone, customer_address, notes,
           delivery_method, delivery_lat, delivery_lng, delivery_city, delivery_distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user?.id || null,
        total,
        delivery_cost,
        customer_name || req.user?.name || null,
        customer_phone || req.user?.phone || null,
        customer_address || req.user?.address || null,
        notes || null,
        delivery_method,
        delivery_method === 'delivery' ? delivery_lat : null,
        delivery_method === 'delivery' ? delivery_lng : null,
        resolved_city,
        distance_km
      )

    const orderId = result.lastInsertRowid
    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, sale_type, quantity, weight_grams, unit_price, subtotal, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const item of orderItems) {
      insertItem.run(
        orderId,
        item.product_id,
        item.product_name,
        item.sale_type,
        item.quantity,
        item.weight_grams,
        item.unit_price,
        item.subtotal,
        item.notes
      )
    }

    // payment_method + referencia para Bold (máx 60 chars, alfanum/guiones)
    const paymentReference = bold.generateOrderId(orderId)
    db.prepare(
      'UPDATE orders SET payment_method = ?, payment_reference = ? WHERE id = ?'
    ).run(payment_method, paymentReference, orderId)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)

    // Payload Bold si aplica. Bold requiere total en centavos.
    // La firma y la llave de identidad se pasan al botón del frontend.
    let boldPayload = null
    if (payment_method === 'bold' && bold.isEnabled()) {
      const amountInCents = Math.round(total * 100)
      boldPayload = {
        order_id: paymentReference,
        amount_in_cents: amountInCents,
        currency: 'COP',
        signature: bold.signIntegrity({ orderId: paymentReference, amountInCents, currency: 'COP' }),
        identity_key: bold.config().identityKey,
        widget_url: bold.config().widgetUrl,
        description: `Pedido Avisander #${orderId}`
      }
    }

    // Notificaciones fire-and-forget (no bloquean la respuesta)
    const adminEmail = db.prepare("SELECT value FROM settings WHERE key = 'admin_notification_email'").get()?.value
      || process.env.ADMIN_NOTIFICATION_EMAIL
    const waNumber = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get()?.value
    const adminWaLink = whatsappAdminLink(waNumber, order)

    setImmediate(async () => {
      try {
        if (adminEmail) {
          const mail = orderAdminEmail(order, adminWaLink)
          await sendMail({ to: adminEmail, ...mail })
        }
        // Confirmación al cliente si dio email (usuarios autenticados)
        if (req.user?.email) {
          const mail = orderCustomerEmail(order, req.user.name || '')
          await sendMail({ to: req.user.email, ...mail })
        }
      } catch (e) {
        logger.warn({ err: e.message }, 'Fallo enviando notificación de pedido')
      }
    })

    res.status(201).json({ ...order, bold: boldPayload, admin_whatsapp_link: adminWaLink })
  } catch (error) {
    next(error)
  }
})

router.put(
  '/:id/status',
  authenticateToken,
  requireAdmin,
  validate(orderStatusSchema),
  (req, res, next) => {
    try {
      const existing = db
        .prepare('SELECT id, status, payment_method, payment_status, stock_deducted FROM orders WHERE id = ?')
        .get(req.params.id)
      if (!existing) return res.status(404).json({ error: 'Pedido no encontrado' })

      const newStatus = req.body.status
      const confirmStatuses = ['processing', 'completed']

      // Al confirmar pedido (whatsapp/efectivo) se descuenta stock.
      // Para pedidos Bold, el descuento ya ocurrió al aprobar el pago.
      if (
        confirmStatuses.includes(newStatus) &&
        !existing.stock_deducted &&
        existing.payment_method !== 'bold'
      ) {
        try {
          inventory.recordSaleFromOrder({ orderId: existing.id, userId: req.user.id })
          db.prepare('UPDATE orders SET stock_deducted = 1 WHERE id = ?').run(existing.id)
        } catch (err) {
          if (err.code === 'insufficient_stock') {
            return res.status(400).json({
              error: err.message,
              code: 'insufficient_stock',
              product_id: err.product_id,
              product_name: err.product_name,
              stock: err.stock,
              requested: err.requested
            })
          }
          throw err
        }
      }

      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, req.params.id)
      res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id))
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
