-- =====================================================
-- Migración: Agregar campos de IVA
-- Fecha: 2026-01-17
-- Descripción: Implementa sistema de tasas impositivas según Ley N° 6826 de Costa Rica
-- =====================================================

-- 1. Agregar tasa de IVA a productos
-- ====================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 13.00 NOT NULL;

-- Índice para agrupar por tasa (útil para reportes fiscales)
CREATE INDEX IF NOT EXISTS idx_products_tax_rate ON products(tax_rate);

-- Comentario para documentar el campo
COMMENT ON COLUMN products.tax_rate IS 'Tasa de IVA aplicable: 0.00 (Exento/Canasta Básica), 4.00 (Reducido/Medicamentos), 13.00 (General)';

-- 2. Agregar campos de IVA a sale_items
-- ======================================
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 13.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS subtotal_before_tax DECIMAL(10,2);

-- Comentarios para documentar
COMMENT ON COLUMN sale_items.tax_rate IS 'Tasa de IVA aplicada a este item al momento de la venta';
COMMENT ON COLUMN sale_items.tax_amount IS 'Monto de IVA de este item (calculado)';
COMMENT ON COLUMN sale_items.subtotal_before_tax IS 'Subtotal sin IVA de este item';

-- 3. Agregar totales de IVA a sales
-- ==================================
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_tax DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Comentarios para documentar
COMMENT ON COLUMN sales.subtotal IS 'Subtotal de la venta sin IVA';
COMMENT ON COLUMN sales.total_tax IS 'Total de IVA de la venta (suma de tax_amount de todos los items)';

-- 4. Actualizar productos existentes según categoría estimada
-- ============================================================
-- Productos que probablemente son canasta básica (exentos de IVA)
UPDATE products
  SET tax_rate = 0.00
  WHERE LOWER(name) SIMILAR TO '%(arroz|frijol|aceite|azucar|azúcar|sal|huevo|leche|pan|maiz|maíz)%'
  AND tax_rate = 13.00; -- Solo actualizar si aún tiene la tasa por defecto

-- El resto de productos mantienen el 13% (tasa general por defecto)

-- 5. Crear vista para reportes de IVA
-- ====================================
CREATE OR REPLACE VIEW vw_tax_report AS
SELECT 
  s.id as sale_id,
  s.created_at,
  s.subtotal,
  s.total_tax,
  s.total,
  s.payment_method,
  u.username as cashier_name,
  si.tax_rate,
  SUM(si.subtotal_before_tax) as subtotal_by_rate,
  SUM(si.tax_amount) as tax_by_rate,
  COUNT(si.id) as items_count
FROM sales s
JOIN users u ON s.user_id = u.id
JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.created_at, s.subtotal, s.total_tax, s.total, s.payment_method, u.username, si.tax_rate
ORDER BY s.created_at DESC;

COMMENT ON VIEW vw_tax_report IS 'Vista para generar reportes de IVA agrupados por tasa';

-- 6. Índices adicionales para performance de reportes
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_tax_rate ON sale_items(tax_rate);

-- =====================================================
-- Fin de migración
-- =====================================================
