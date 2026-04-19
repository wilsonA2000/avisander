const express = require('express')
const rateLimit = require('express-rate-limit')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { orderCreateSchema, orderStatusSchema } = require('../schemas/order')
const { quoteDelivery } = require('../lib/delivery')
const bold = require('../lib/bold')
const inventory = require('../lib/inventory')
const stockReservation = require('../lib/stockReservation')
const { computeFirstPurchaseDiscount } = require('../lib/discount')
const loyalty = require('../lib/loyalty')
// Nota: el body del webhook /api/payments/bold/webhook se recibe como RAW Buffer
// (ver exclusión del express.json global en app.js) para poder verificar HMAC-SHA256.
const { sendMail, orderAdminEmail, orderCustomerEmail } = require('../lib/mailer')
const { whatsappAdminLink } = require('../lib/whatsapp')
const logger = require('../lib/logger')
const { clientIp } = require('../lib/client-ip')
const orderEvents = require('../lib/orderEvents')

const router = express.Router()

const publicOrderLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: 'Demasiadas consultas, intenta en un momento.' }
})

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

// Preview de descuento aplicable al cliente autenticado sobre un subtotal dado.
// El frontend lo usa en el carrito para mostrar el desglose antes de hacer checkout.
router.get('/discount-preview', optionalAuth, (req, res, next) => {
  try {
    const subtotal = Number(req.query.subtotal) || 0
    const discount = computeFirstPurchaseDiscount(req.user?.id || null, subtotal)
    res.json({
      authenticated: Boolean(req.user?.id),
      amount: discount.amount || 0,
      percent: discount.percent || 0,
      reason: discount.reason || null
    })
  } catch (error) {
    next(error)
  }
})

// Endpoint público para que el cliente pueda trackear su pedido sin login
// usando la payment_reference generada al crear la orden. Devuelve sólo
// campos no sensibles: estado, items, total, modo de entrega.
router.get('/public/:reference', publicOrderLimiter, (req, res, next) => {
  try {
    const order = db
      .prepare(
        `SELECT id, total, delivery_cost, delivery_method, status, payment_method,
                payment_status, payment_reference, payment_transaction_id,
                customer_name, discount_amount, discount_reason, created_at
         FROM orders WHERE payment_reference = ?`
      )
      .get(req.params.reference)
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
    order.items = db
      .prepare(
        `SELECT product_name, sale_type, quantity, weight_grams, unit_price, subtotal, notes
         FROM order_items WHERE order_id = ?`
      )
      .all(order.id)
    res.json(order)
  } catch (error) {
    next(error)
  }
})

// Cliente abandona voluntariamente un pago Bold sin completarlo.
// Evita que la orden quede "pending" en el admin hasta que expire el TTL.
router.post('/public/:reference/abandon', publicOrderLimiter, (req, res, next) => {
  try {
    const order = db
      .prepare(
        `SELECT id, status, payment_method, payment_status, stock_deducted
         FROM orders WHERE payment_reference = ?`
      )
      .get(req.params.reference)
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })

    // Solo abandonables: pending de Bold sin pago confirmado.
    // Si ya fue aprobado o está en otro estado terminal, no tocamos.
    if (order.payment_method !== 'bold') {
      return res.status(400).json({ error: 'Solo se pueden abandonar pagos Bold' })
    }
    if (order.status !== 'pending' || order.stock_deducted) {
      return res.json({ ok: true, already: true, status: order.status })
    }
    if (order.payment_status === 'approved') {
      return res.status(400).json({ error: 'El pago ya fue aprobado' })
    }

    try { stockReservation.releaseReservation(order.id) } catch (_e) { /* idempotente */ }
    db.prepare(
      "UPDATE orders SET status = 'abandoned', payment_status = 'cancelled' WHERE id = ?"
    ).run(order.id)
    try { loyalty.revertOrderLoyalty(order.id, 'Pago abandonado por el cliente') } catch (err) {
      logger.error({ err, orderId: order.id }, 'Fallo revirtiendo loyalty al abandonar')
    }
    orderEvents.log(order.id, 'abandoned_by_customer', {
      fromStatus: order.status,
      toStatus: 'abandoned',
      fromPaymentStatus: order.payment_status,
      toPaymentStatus: 'cancelled',
      actorType: 'customer',
      metadata: { reason: 'Cliente pulsó "Cancelar pago y elegir otro método"' }
    })
    logger.info({ orderId: order.id, reference: req.params.reference }, 'Pedido abandonado por cliente')

    res.json({ ok: true, status: 'abandoned' })
  } catch (error) {
    next(error)
  }
})

// Timeline de eventos de una orden (solo admin). Usa order_events, que
// acumula cada cambio de estado con actor y timestamp para dar trazabilidad
// cuando un cliente reclama.
router.get('/:id/events', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const exists = db.prepare('SELECT 1 FROM orders WHERE id = ?').get(id)
    if (!exists) return res.status(404).json({ error: 'Pedido no encontrado' })
    res.json(orderEvents.listByOrder(id))
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
        .prepare('SELECT id, name, stock, reserved_stock, is_available FROM products WHERE id = ?')
        .get(it.product_id)
      if (!prod) {
        stockErrors.push(`Producto ${it.product_id} no existe`)
        continue
      }
      if (prod.is_available === 0) {
        stockErrors.push(`"${prod.name}" no está disponible`)
        continue
      }
      // Stock disponible = stock físico - reservado por otros pedidos pendientes.
      const available = (Number(prod.stock) || 0) - (Number(prod.reserved_stock) || 0)
      if (available <= 0) {
        stockErrors.push(`"${prod.name}" sin stock`)
      } else if (it.quantity > available) {
        stockErrors.push(`"${prod.name}" solo tiene ${available} disponibles (pediste ${it.quantity})`)
      }
    }
    if (stockErrors.length > 0) {
      const e = new Error(stockErrors.join(' · '))
      e.status = 400
      e.code = 'insufficient_stock'
      throw e
    }

    // Anti-fraude: si el cliente envió precios distintos a los de BD para items
    // 'fixed', devolvemos 409 con los precios reales para que el frontend
    // actualice el carrito y el cliente confirme el nuevo total antes de pagar.
    const priceChanges = []
    for (const it of items) {
      const saleType = it.sale_type || 'fixed'
      if (saleType !== 'fixed') continue
      if (!it.product_id) {
        const e = new Error(`El item "${it.name}" no tiene product_id; productos off-catálogo no se permiten.`)
        e.status = 400
        e.code = 'off_catalog_item'
        throw e
      }
      const prod = db.prepare('SELECT price FROM products WHERE id = ?').get(it.product_id)
      if (!prod) continue
      const realPrice = Number(prod.price) || 0
      const sentPrice = Number(it.price) || 0
      if (Math.abs(realPrice - sentPrice) > 0.01) {
        priceChanges.push({
          product_id: it.product_id,
          name: it.name,
          sent_price: sentPrice,
          current_price: realPrice
        })
      }
    }
    if (priceChanges.length > 0) {
      return res.status(409).json({
        error: 'El precio de algunos productos cambió. Revisa tu carrito antes de pagar.',
        code: 'price_changed',
        items: priceChanges
      })
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
        qty = weightGrams / 1000
        unitPrice = pricePerKg
        itemSubtotal = (pricePerKg * weightGrams) / 1000
      } else {
        // Anti-fraude: siempre leer precio actual de BD, ignorar item.price.
        const prod = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id)
        qty = item.quantity
        unitPrice = Number(prod?.price) || 0
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

    // Descuento aplicable (solo clientes registrados en su primera compra).
    const discount = computeFirstPurchaseDiscount(req.user?.id || null, subtotal)
    const discountAmount = discount.amount || 0
    const discountReason = discount.reason || null

    // Canje de puntos de fidelización (opcional).
    const redeemPoints = req.body.redeem_points || 0
    let loyaltyDiscount = 0
    if (redeemPoints > 0 && req.user?.id && loyalty.isEnabled()) {
      const balance = loyalty.getBalance(req.user.id)
      const actual = Math.min(redeemPoints, balance)
      loyaltyDiscount = actual * loyalty.pointValue()
    }

    const total = Math.max(0, subtotal - discountAmount - loyaltyDiscount) + delivery_cost

    const result = db
      .prepare(
        `INSERT INTO orders
          (user_id, total, delivery_cost, customer_name, customer_phone, customer_address, notes,
           delivery_method, delivery_lat, delivery_lng, delivery_city, delivery_distance_km,
           discount_amount, discount_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        distance_km,
        discountAmount,
        discountReason
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

    orderEvents.log(orderId, 'created', {
      toStatus: 'pending',
      toPaymentStatus: 'pending',
      actorType: req.user ? 'customer' : 'guest',
      actorId: req.user?.id || null,
      metadata: { payment_method, delivery_method, total, items_count: orderItems.length }
    })

    // Canjear puntos reales si aplica.
    if (loyaltyDiscount > 0 && req.user?.id) {
      const actualRedeemed = loyalty.redeemPoints(req.user.id, orderId, redeemPoints)
      if (actualRedeemed > 0) {
        const currentReason = discountReason ? `${discountReason} + Puntos (${actualRedeemed}pts)` : `Canje ${actualRedeemed} puntos`
        db.prepare('UPDATE orders SET discount_amount = ?, discount_reason = ? WHERE id = ?')
          .run(discountAmount + loyaltyDiscount, currentReason, orderId)
      }
    }

    // Reservar stock temporalmente.
    try {
      stockReservation.reserveForOrder(orderId)
    } catch (err) {
      logger.error({ err, orderId }, 'Fallo reservando stock; orden queda sin reserva')
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)

    // Payload Bold si aplica. Bold en COP usa el monto en PESOS enteros (no centavos),
    // tanto en data-amount como en la firma de integridad. Ver docs:
    // https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-manual
    let boldPayload = null
    if (payment_method === 'bold' && bold.isEnabled()) {
      const amount = Math.round(total)
      boldPayload = {
        order_id: paymentReference,
        amount,
        currency: 'COP',
        signature: bold.signIntegrity({ orderId: paymentReference, amount, currency: 'COP' }),
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

router.get('/export/excel', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const XLSX = require('xlsx')
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
    const rows = orders.map((o) => {
      const items = getItems.all(o.id)
      return {
        '#': o.id,
        Fecha: o.created_at,
        Cliente: o.customer_name || '',
        Teléfono: o.customer_phone || '',
        Dirección: o.customer_address || '',
        Productos: items.map((it) =>
          it.sale_type === 'by_weight'
            ? `${it.product_name} ${it.weight_grams}g`
            : `${it.product_name} x${it.quantity}`
        ).join(', '),
        Subtotal: (o.total || 0) - (o.delivery_cost || 0) + (o.discount_amount || 0),
        Descuento: o.discount_amount || 0,
        Domicilio: o.delivery_cost || 0,
        Total: o.total || 0,
        'Método pago': o.payment_method || '',
        'Estado pago': o.payment_status || '',
        'Estado pedido': o.status,
        Referencia: o.payment_reference || '',
        Ciudad: o.delivery_city || ''
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
      { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 15 }
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fname = `avisander-ventas-${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    res.send(buf)
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
        .prepare('SELECT id, user_id, status, payment_method, payment_status, stock_deducted FROM orders WHERE id = ?')
        .get(req.params.id)
      if (!existing) return res.status(404).json({ error: 'Pedido no encontrado' })

      // 'abandoned' es estado terminal del sistema: ni admin ni cajera pueden
      // sacar una orden de ahí (y el schema impide entrar a ese estado).
      if (existing.status === 'abandoned') {
        return res.status(409).json({
          error: 'Este pedido fue abandonado por el sistema y no se puede modificar.'
        })
      }

      const newStatus = req.body.status
      const confirmStatuses = ['processing', 'shipped', 'completed']

      // Al confirmar pedido (whatsapp/efectivo) se descuenta stock.
      // Para pedidos Bold, el descuento ya ocurrió al aprobar el pago.
      if (
        confirmStatuses.includes(newStatus) &&
        !existing.stock_deducted &&
        existing.payment_method !== 'bold'
      ) {
        try {
          // Liberamos reserva antes de descontar: así el descuento real
          // no choca con la reserva propia de esta misma orden.
          stockReservation.releaseReservation(existing.id)
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

      // Al cancelar/abandonar: liberar reserva sin descontar stock.
      if ((newStatus === 'cancelled' || newStatus === 'abandoned') && !existing.stock_deducted) {
        try { stockReservation.releaseReservation(existing.id) } catch (_e) { /* noop */ }
      }

      // Reversar loyalty (devolver canje + quitar ganado si lo hubo).
      // Idempotente — revertOrderLoyalty verifica que no se haya aplicado ya.
      if (newStatus === 'cancelled' || newStatus === 'abandoned') {
        try {
          loyalty.revertOrderLoyalty(
            existing.id,
            newStatus === 'abandoned' ? 'Pedido abandonado' : 'Cancelado por admin'
          )
        } catch (err) {
          logger.error({ err, orderId: existing.id }, 'Fallo revirtiendo loyalty')
        }
      }

      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, req.params.id)

      let paymentStatusBefore = existing.payment_status
      let paymentStatusAfter = existing.payment_status

      // Si la orden queda cancelled y el pago estaba pending, cerramos también
      // el payment_status para que la columna PAGO no siga mostrando
      // "Pendiente" en una venta ya descartada.
      if (newStatus === 'cancelled' && existing.payment_status === 'pending') {
        db.prepare("UPDATE orders SET payment_status = 'cancelled' WHERE id = ?").run(req.params.id)
        paymentStatusAfter = 'cancelled'
      }

      // Al avanzar el estado a processing/shipped/completed en órdenes no-Bold
      // (manual o whatsapp), la cajera confirma implícitamente que ya recibió
      // el pago — el comprobante fue validado por ella antes de avanzar.
      // Bold queda fuera porque su payment_status lo gestiona el webhook.
      if (
        confirmStatuses.includes(newStatus) &&
        existing.payment_method !== 'bold' &&
        existing.payment_status !== 'approved'
      ) {
        db.prepare(
          "UPDATE orders SET payment_status = 'approved', payment_paid_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(req.params.id)
        paymentStatusAfter = 'approved'
      }

      orderEvents.log(Number(req.params.id), 'status_change', {
        fromStatus: existing.status,
        toStatus: newStatus,
        fromPaymentStatus: paymentStatusBefore,
        toPaymentStatus: paymentStatusAfter,
        actorType: 'admin',
        actorId: req.user.id
      })

      // Acumular puntos de fidelización al completar un pedido.
      if (newStatus === 'completed' && existing.user_id) {
        const order = db.prepare('SELECT total, loyalty_points_earned FROM orders WHERE id = ?').get(req.params.id)
        if (!order.loyalty_points_earned) {
          loyalty.earnPoints(existing.user_id, Number(req.params.id), order.total)
        }
      }

      res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id))
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
