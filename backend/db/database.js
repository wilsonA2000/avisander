const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

// En Railway/Fly/VPS seteamos DB_PATH=/data/database.sqlite para que la BD
// viva en el volumen persistente y sobreviva redeploys.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite')
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

function initialize() {
  // Create tables
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'customer',
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    -- sale_type: 'fixed' (precio total por pieza/bandeja) o 'by_weight' (cliente pide gramos, precio = price_per_kg × kg)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      unit TEXT DEFAULT 'kg',
      sale_type TEXT NOT NULL DEFAULT 'fixed',
      price_per_kg REAL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_on_sale INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      total REAL NOT NULL,
      delivery_cost REAL,
      status TEXT DEFAULT 'pending',
      customer_name TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order items table
    -- weight_grams: solo aplica cuando sale_type = 'by_weight' (gramos solicitados por el cliente)
    -- notes: observaciones del cliente por ítem (sin piel, en pedazos, bolsas separadas, etc)
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      sale_type TEXT NOT NULL DEFAULT 'fixed',
      quantity REAL NOT NULL,
      weight_grams REAL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      notes TEXT
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME
    );

    -- Refresh tokens (solo hash, nunca el token en claro)
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_hash ON refresh_tokens(token_hash);

    -- Password resets
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_reset_hash ON password_resets(token_hash);

    -- Recetas (Sprint 3)
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      cover_image_url TEXT,
      video_url TEXT,
      body_markdown TEXT,
      duration_min INTEGER,
      difficulty TEXT,
      is_published INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published);

    -- Pivote receta-producto (una receta usa N productos; un producto aparece en N recetas)
    CREATE TABLE IF NOT EXISTS recipe_products (
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      PRIMARY KEY (recipe_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_rp_product ON recipe_products(product_id);

    -- Sprint 7A: PQRS tickets (Peticiones/Quejas/Reclamos/Sugerencias)
    CREATE TABLE IF NOT EXISTS pqrs_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      admin_notes TEXT,
      resolved_at DATETIME,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_pqrs_status ON pqrs_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_pqrs_created ON pqrs_tickets(created_at);

    -- Sprint 6 Fase A: inventario numérico + proveedores + compras + kardex
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nit TEXT,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id),
      reference TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      received_at DATETIME,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pi_purchase ON purchase_items(purchase_id);

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      balance_after REAL NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      notes TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_inv_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_inv_created ON inventory_movements(created_at);
  `)

  // Migraciones idempotentes para esquemas antiguos
  const addColumnIfMissing = (table, column, ddl) => {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all()
      if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
      }
    } catch (_e) {
      // noop
    }
  }

  addColumnIfMissing('users', 'must_change_password', 'must_change_password INTEGER DEFAULT 0')
  // Sprint 7A: avatar del usuario
  addColumnIfMissing('users', 'avatar_url', 'avatar_url TEXT')
  // Audit 2026-04-19: lockout de cuenta tras N logins fallidos.
  addColumnIfMissing('users', 'failed_login_count', 'failed_login_count INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing('users', 'locked_until', 'locked_until DATETIME')
  addColumnIfMissing('products', 'sale_type', "sale_type TEXT NOT NULL DEFAULT 'fixed'")
  addColumnIfMissing('products', 'price_per_kg', 'price_per_kg REAL')
  addColumnIfMissing('products', 'brand', 'brand TEXT')
  addColumnIfMissing('products', 'reference', 'reference TEXT')
  addColumnIfMissing('products', 'packaging', 'packaging TEXT')
  addColumnIfMissing('products', 'cold_chain', "cold_chain TEXT DEFAULT 'refrigerado'")
  addColumnIfMissing('products', 'ingredients', 'ingredients TEXT')
  // gallery_urls: JSON array de URLs adicionales para la galería del producto
  addColumnIfMissing('products', 'gallery_urls', 'gallery_urls TEXT')
  // Sprint 3: catálogo estilo eBay
  addColumnIfMissing('products', 'subcategory', 'subcategory TEXT')
  addColumnIfMissing('products', 'external_code', 'external_code TEXT')
  // tags: JSON array de strings (ej: ["premium","fresco-hoy"])
  addColumnIfMissing('products', 'tags', 'tags TEXT')
  addColumnIfMissing('products', 'video_url', 'video_url TEXT')
  addColumnIfMissing('products', 'slug', 'slug TEXT')
  // search_text: lowercased name+brand+subcategory+tags+description para LIKE
  addColumnIfMissing('products', 'search_text', 'search_text TEXT')

  // Índices útiles para el catálogo (idempotentes)
  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_extcode ON products(external_code) WHERE external_code IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
      CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(is_on_sale);
      CREATE INDEX IF NOT EXISTS idx_products_search ON products(search_text);
    `)
  } catch (_e) {
    // noop
  }
  // Pedidos: método de entrega y geocoding
  addColumnIfMissing('orders', 'delivery_method', "delivery_method TEXT NOT NULL DEFAULT 'delivery'")
  addColumnIfMissing('orders', 'delivery_lat', 'delivery_lat REAL')
  addColumnIfMissing('orders', 'delivery_lng', 'delivery_lng REAL')
  addColumnIfMissing('orders', 'delivery_city', 'delivery_city TEXT')
  addColumnIfMissing('orders', 'delivery_distance_km', 'delivery_distance_km REAL')
  // Sprint 4: pagos
  addColumnIfMissing('orders', 'payment_method', "payment_method TEXT DEFAULT 'whatsapp'")
  addColumnIfMissing('orders', 'payment_reference', 'payment_reference TEXT')
  addColumnIfMissing('orders', 'payment_status', "payment_status TEXT DEFAULT 'pending'")
  addColumnIfMissing('orders', 'payment_transaction_id', 'payment_transaction_id TEXT')
  addColumnIfMissing('orders', 'payment_paid_at', 'payment_paid_at DATETIME')
  addColumnIfMissing('order_items', 'sale_type', "sale_type TEXT NOT NULL DEFAULT 'fixed'")
  addColumnIfMissing('order_items', 'weight_grams', 'weight_grams REAL')
  addColumnIfMissing('order_items', 'notes', 'notes TEXT')

  // Sprint 6 Fase A: flag para evitar doble descuento de stock por pedido
  addColumnIfMissing('orders', 'stock_deducted', 'stock_deducted INTEGER NOT NULL DEFAULT 0')

  // Reserva temporal de stock: mientras la orden está pending, el stock queda
  // reservado pero no descontado. Se libera al expirar o cancelar; se descuenta
  // realmente al aprobar pago (Bold) o cuando admin marca completed (WhatsApp).
  addColumnIfMissing('orders', 'stock_reserved', 'stock_reserved INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing('orders', 'expires_at', 'expires_at DATETIME')
  addColumnIfMissing('products', 'reserved_stock', 'reserved_stock REAL NOT NULL DEFAULT 0')

  // Descuento aplicado a la orden (monto en COP). Al final del cálculo:
  //   total = subtotal - discount_amount + delivery_cost
  // discount_reason guarda la razón legible (ej "Descuento primera compra 10%").
  addColumnIfMissing('orders', 'discount_amount', 'discount_amount REAL NOT NULL DEFAULT 0')
  addColumnIfMissing('orders', 'discount_reason', 'discount_reason TEXT')
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at) WHERE expires_at IS NOT NULL')
  } catch (_e) { /* noop */ }

  // Sprint 6 Fase A: stock numérico en productos
  addColumnIfMissing('products', 'stock', 'stock REAL NOT NULL DEFAULT 0')
  addColumnIfMissing('products', 'stock_min', 'stock_min REAL NOT NULL DEFAULT 0')
  addColumnIfMissing('products', 'cost_price', 'cost_price REAL')
  addColumnIfMissing('products', 'barcode', 'barcode TEXT')
  // Sprint 7F: bondades nutricionales + usos culinarios (JSON array de slugs).
  addColumnIfMissing('products', 'benefits', 'benefits TEXT')
  addColumnIfMissing('products', 'culinary_uses', 'culinary_uses TEXT')
  try {
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL'
    )
  } catch (_e) {
    // noop
  }

  // Sprint 8C: programa de fidelización
  addColumnIfMissing('users', 'loyalty_balance', 'loyalty_balance INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing('orders', 'loyalty_points_earned', 'loyalty_points_earned INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing('orders', 'loyalty_points_redeemed', 'loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0')
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT,
      admin_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_transactions(user_id);

    -- Analytics: registro ligero de pageviews para panel admin.
    -- Nada de IPs completas (privacidad); el session_id viene del localStorage
    -- del cliente y es un UUID random. Los bots se marcan con is_bot=1 para
    -- filtrar las métricas del dashboard.
    CREATE TABLE IF NOT EXISTS page_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      is_bot INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);

    -- Auditoría de órdenes: cada cambio de estado o evento relevante queda
    -- registrado aquí para poder responder reclamos de clientes con timestamps
    -- precisos. actor_type: system | admin | customer | bold_webhook | bold_reconcile
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      from_payment_status TEXT,
      to_payment_status TEXT,
      actor_type TEXT NOT NULL DEFAULT 'system',
      actor_id INTEGER REFERENCES users(id),
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_events_created ON order_events(created_at);

    -- Audit 2026-04-19: dedupe de webhooks Bold. Si Bold reintenta el mismo
    -- evento (payment_id + type), evitamos reprocesar y duplicar logs.
    CREATE TABLE IF NOT EXISTS bold_webhook_events (
      event_key TEXT PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      event_type TEXT,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Reviews de productos con compra verificada. UNIQUE evita que un cliente
    -- reseñe dos veces el mismo producto dentro de la misma orden; pero puede
    -- reseñar el mismo producto en distintas órdenes.
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      approved INTEGER NOT NULL DEFAULT 1,
      email_sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, product_id, order_id)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

    -- Tracking de invitaciones a reseñar por orden (evita enviar 2 emails
    -- para la misma orden aunque el cron se ejecute varias veces).
    CREATE TABLE IF NOT EXISTS review_invites (
      order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed admin SOLO en entornos no-producción. En prod hay que crearlo manualmente.
  if (process.env.NODE_ENV !== 'production') {
    const adminEmail = 'admin@avisander.com'
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail)

    if (!existingAdmin) {
      const passwordHash = bcrypt.hashSync('admin123', 12)
      db.prepare(`
        INSERT INTO users (email, password_hash, name, role, must_change_password)
        VALUES (?, ?, ?, ?, 1)
      `).run(adminEmail, passwordHash, 'Administrador', 'admin')
      console.log('[dev] Admin creado: admin@avisander.com / admin123 (cambiar en primer login)')
    }
  }

  // Insert default categories if not exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  if (categoryCount.count === 0) {
    const defaultCategories = [
      { name: 'Res', icon: '🥩', display_order: 1 },
      { name: 'Cerdo', icon: '🐷', display_order: 2 },
      { name: 'Pollo', icon: '🍗', display_order: 3 },
      { name: 'Huevos', icon: '🥚', display_order: 4 },
      { name: 'Lacteos', icon: '🧀', display_order: 5 },
      { name: 'Otros', icon: '📦', display_order: 6 }
    ]

    const insert = db.prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)')
    for (const cat of defaultCategories) {
      insert.run(cat.name, cat.icon, cat.display_order)
    }
    console.log('Default categories created')
  }

  // Insert default settings if not exist
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get()
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'delivery_cost', value: '5000' },
      { key: 'business_hours_weekday', value: '7:00 AM - 7:00 PM' },
      { key: 'business_hours_weekend', value: '7:00 AM - 1:00 PM' },
      { key: 'delivery_hours', value: '8:00 AM - 6:00 PM' },
      { key: 'whatsapp_number', value: '3123005253' },
      { key: 'first_purchase_discount_enabled', value: '1' },
      { key: 'first_purchase_discount_percent', value: '10' },
      { key: 'reviews_auto_approve', value: '1' },
      { key: 'reviews_email_enabled', value: '1' },
      { key: 'reviews_email_delay_days', value: '3' }
    ]

    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    for (const setting of defaultSettings) {
      insert.run(setting.key, setting.value)
    }
    console.log('Default settings created')
  }

  console.log('Database initialized')
}

module.exports = {
  db,
  initialize
}
