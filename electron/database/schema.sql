-- ============================================
-- Sabrosita POS - Esquema de Base de Datos Local (SQLite)
-- Este esquema replica la estructura de Supabase
-- ============================================

-- Tabla: users (usuarios del sistema)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla: customers (clientes)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla: products (productos)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  cost REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  tax_rate REAL NOT NULL DEFAULT 13,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla: cash_registers (cajas registradoras)
CREATE TABLE IF NOT EXISTS cash_registers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  opening_balance REAL NOT NULL,
  closing_balance REAL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla: sales (ventas)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  cash_register_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  customer_id TEXT,
  subtotal REAL NOT NULL,
  total_tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  amount_received REAL NOT NULL,
  change_given REAL NOT NULL DEFAULT 0,
  payment_currency TEXT DEFAULT 'CRC',
  amount_received_usd REAL,
  exchange_rate_used REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Tabla: sale_items (items de venta)
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 13,
  tax_amount REAL NOT NULL DEFAULT 0,
  subtotal_before_tax REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla: config (configuración del sistema)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla: sync_queue (cola de sincronización)
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT, -- JSON serializado
  synced INTEGER NOT NULL DEFAULT 0, -- 0 = pendiente, 1 = sincronizado
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

-- ============================================
-- Índices para mejorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_cash_register ON sales(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);

-- ============================================
-- Datos iniciales
-- ============================================

-- Cliente genérico (igual que en Supabase)
INSERT OR IGNORE INTO customers (id, name, phone, email, address)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Cliente Genérico',
  '',
  '',
  ''
);

-- Configuración inicial
INSERT OR IGNORE INTO config (key, value, description)
VALUES
  ('exchange_rate', '540', 'Tipo de cambio del dólar (₡ por $1)'),
  ('inventory_control_enabled', 'true', 'Control de inventario habilitado/deshabilitado'),
  ('last_sync_at', '', 'Última sincronización exitosa con Supabase'),
  ('business_name', 'Sabrosita', 'Nombre del negocio'),
  ('business_phone', '', 'Teléfono del negocio'),
  ('business_address', '', 'Dirección del negocio');

-- ============================================
-- Triggers para updated_at automático
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_customers_timestamp
AFTER UPDATE ON customers
BEGIN
  UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_products_timestamp
AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_config_timestamp
AFTER UPDATE ON config
BEGIN
  UPDATE config SET updated_at = datetime('now') WHERE key = NEW.key;
END;

-- ============================================
-- Esquema creado exitosamente
-- ============================================
