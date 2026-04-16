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

const settingsUpdateSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .refine(
    (obj) => Object.keys(obj).every((k) => WRITABLE_KEYS.includes(k)),
    { message: `Solo estas claves son editables: ${WRITABLE_KEYS.join(', ')}` }
  )

module.exports = { settingsUpdateSchema, WRITABLE_KEYS, PUBLIC_KEYS }
