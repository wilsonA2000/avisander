const { z } = require('zod')

// Claves permitidas para escritura vía API admin.
const WRITABLE_KEYS = [
  'delivery_cost',
  'business_hours_weekday',
  'business_hours_saturday',
  'business_hours_weekend',
  'business_hours_holiday',
  'delivery_hours',
  'whatsapp_number',
  'store_name',
  'store_short_name',
  'store_address',
  'store_lat',
  'store_lng',
  'admin_notification_email',
  'free_shipping_threshold',
  'tax_rate',
  'promo_modal_enabled',
  'promo_modal_mode',
  'promo_modal_title',
  'promo_modal_subtitle',
  'promo_modal_image',
  'promo_modal_cta_label',
  'promo_modal_cta_link',
  'promo_modal_product_id',
  // Descuento 10% primera compra (configurable).
  'first_purchase_discount_enabled',
  'first_purchase_discount_percent',
  // Programa de fidelización.
  'loyalty_enabled',
  'loyalty_points_per_1000',
  'loyalty_point_value'
]

// Claves expuestas públicamente (GET sin auth). admin_notification_email se queda
// FUERA para no revelar el email del admin en texto plano.
const PUBLIC_KEYS = [
  'delivery_cost',
  'business_hours_weekday',
  'business_hours_saturday',
  'business_hours_weekend',
  'business_hours_holiday',
  'delivery_hours',
  'whatsapp_number',
  'store_name',
  'store_short_name',
  'store_address',
  'store_lat',
  'store_lng',
  'free_shipping_threshold',
  'tax_rate',
  // Pop-up promocional de bienvenida.
  'promo_modal_enabled',
  'promo_modal_mode',
  'promo_modal_title',
  'promo_modal_subtitle',
  'promo_modal_image',
  'promo_modal_cta_label',
  'promo_modal_cta_link',
  'promo_modal_product_id',
  // Descuento primera compra (el cliente ve el % para mostrar el aviso).
  'first_purchase_discount_enabled',
  'first_purchase_discount_percent',
  // Fidelización: pública para que el cliente vea si hay puntos.
  'loyalty_enabled',
  'loyalty_points_per_1000',
  'loyalty_point_value'
]

// Validaciones por clave: evita valores sin sentido (tax negativo, coords
// fuera de rango, etc.). Aplica tras la conversión a número/boolean.
// Las claves no listadas aquí solo se validan como "pertenecen a WRITABLE_KEYS".
const VALUE_RULES = {
  delivery_cost: { num: true, min: 0, max: 200000 },
  free_shipping_threshold: { num: true, min: 0, max: 10000000 },
  tax_rate: { num: true, min: 0, max: 100 },
  store_lat: { num: true, min: -90, max: 90 },
  store_lng: { num: true, min: -180, max: 180 },
  first_purchase_discount_percent: { num: true, min: 0, max: 100 },
  loyalty_points_per_1000: { num: true, min: 0, max: 10000 },
  loyalty_point_value: { num: true, min: 0, max: 100000 }
}

function validateValue(key, value) {
  const rule = VALUE_RULES[key]
  if (!rule) return null
  if (rule.num) {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n)) return `${key} debe ser un número`
    if (n < rule.min || n > rule.max) return `${key} debe estar entre ${rule.min} y ${rule.max}`
  }
  return null
}

const settingsUpdateSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .superRefine((obj, ctx) => {
    for (const [k, v] of Object.entries(obj)) {
      if (!WRITABLE_KEYS.includes(k)) {
        ctx.addIssue({
          code: 'custom',
          path: [k],
          message: `Clave no permitida: "${k}"`
        })
        continue
      }
      const err = validateValue(k, v)
      if (err) ctx.addIssue({ code: 'custom', path: [k], message: err })
    }
  })

module.exports = { settingsUpdateSchema, WRITABLE_KEYS, PUBLIC_KEYS, VALUE_RULES }
