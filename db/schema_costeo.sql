-- DDL para módulo de costeo (SQLite/Postgres compatible simple)

CREATE TABLE IF NOT EXISTS components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_cost_usd REAL,
  unit_cost_ars REAL,
  supplier TEXT,
  lead_time_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  bom_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  component_id INTEGER NOT NULL REFERENCES components(id),
  quantity REAL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS labour_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  cost_per_hour_ars REAL,
  cost_per_hour_usd REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amortizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_name TEXT NOT NULL,
  cost REAL NOT NULL,
  life_hours REAL,
  life_units INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  bom_version INTEGER NOT NULL,
  cost_date DATE DEFAULT (DATE('now')),
  exchange_rate REAL,
  total_materials_usd REAL,
  total_materials_ars REAL,
  total_labour_usd REAL,
  total_labour_ars REAL,
  total_amortization_usd REAL,
  total_amortization_ars REAL,
  overhead_pct REAL,
  total_cost_unit_usd REAL,
  total_cost_unit_ars REAL,
  computed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_components_sku ON components(sku);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
