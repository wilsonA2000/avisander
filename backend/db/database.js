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
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      unit TEXT DEFAULT 'kg',
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
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME
    );
  `)

  // Create admin user if not exists
  const adminEmail = 'admin@avisander.com'
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail)

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run(adminEmail, passwordHash, 'Administrador', 'admin')
    console.log('Admin user created: admin@avisander.com / admin123')
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
      { key: 'whatsapp_number', value: '3162530287' }
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
