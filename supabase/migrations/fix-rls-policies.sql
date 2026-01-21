-- =====================================================
-- Fix RLS Policies - Sabrosita POS
-- Problema: Recursión infinita en políticas
-- Solución MVP: Deshabilitar RLS (app desktop local)
-- =====================================================

-- NOTA: Esta es una solución temporal para MVP
-- En producción multi-tenant, implementar RLS correctamente
-- con Supabase Auth en lugar de auth custom

-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS products_select_policy ON products;
DROP POLICY IF EXISTS products_modify_policy ON products;
DROP POLICY IF EXISTS cash_registers_select_policy ON cash_registers;
DROP POLICY IF EXISTS sales_select_policy ON sales;
DROP POLICY IF EXISTS sale_items_select_policy ON sale_items;
DROP POLICY IF EXISTS sync_queue_policy ON sync_queue;
DROP POLICY IF EXISTS config_select_policy ON config;
DROP POLICY IF EXISTS config_modify_policy ON config;

-- 2. Deshabilitar RLS en todas las tablas
-- (Para app desktop local, la seguridad se maneja en el cliente)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;

-- 3. Verificación
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado: rowsecurity = false para todas las tablas
