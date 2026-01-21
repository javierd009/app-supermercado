-- ===========================================
-- Agregar sistema de clientes
-- Fecha: 2026-01-17
-- ===========================================

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,  -- Cédula o RUC
  is_generic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_is_generic ON customers(is_generic);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir todo (autenticación custom en app Electron)
CREATE POLICY customers_all_access ON customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insertar cliente genérico
INSERT INTO customers (id, name, is_generic) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cliente General', true)
ON CONFLICT (id) DO NOTHING;

-- Agregar customer_id a tabla sales
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000001';

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);

-- Agregar campo canceled_at para anular ventas
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Trigger para actualizar updated_at en customers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE customers IS 'Clientes del negocio';
COMMENT ON COLUMN customers.is_generic IS 'TRUE si es el cliente genérico por defecto';
COMMENT ON COLUMN sales.customer_id IS 'Cliente asociado a la venta (por defecto Cliente General)';
COMMENT ON COLUMN sales.canceled_at IS 'Fecha de anulación de la venta (NULL si está activa)';
COMMENT ON COLUMN sales.canceled_by IS 'Usuario que anuló la venta';
