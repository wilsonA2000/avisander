const Database = require('better-sqlite3')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, '..', 'database.sqlite')
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
      { key: 'whatsapp_number', value: '3123005253' }
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
