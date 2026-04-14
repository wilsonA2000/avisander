const { z } = require('zod')

// Claves permitidas para escritura vía API admin.
const WRITABLE_KEYS = [
  'delivery_cost',
  'business_hours_weekday',
  'business_hours_weekend',
  'delivery_hours',
  'whatsapp_number',
  'store_name',
  'store_address',
  'store_lat',
  'store_lng',
  'admin_notification_email',
  'free_shipping_threshold',
  'tax_rate'
]

// Claves expuestas públicamente (GET sin auth). admin_notification_email se queda
// FUERA para no revelar el email del admin en texto plano.
const PUBLIC_KEYS = [
  'delivery_cost',
  'business_hours_weekday',
  'business_hours_weekend',
  'delivery_hours',
  'whatsapp_number',
  'store_name',
  'store_address',
  'free_shipping_threshold',
  'tax_rate'
]

const settingsUpdateSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .refine(
    (obj) => Object.keys(obj).every((k) => WRITABLE_KEYS.includes(k)),
    { message: `Solo estas claves son editables: ${WRITABLE_KEYS.join(', ')}` }
  )

module.exports = { settingsUpdateSchema, WRITABLE_KEYS, PUBLIC_KEYS }
