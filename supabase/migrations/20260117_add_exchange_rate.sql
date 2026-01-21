-- Migración: Sistema de Pagos en Dólares con Tipo de Cambio
-- Fecha: 2026-01-17
-- Descripción: Agrega soporte para pagos en dólares con tipo de cambio personalizado

-- 1. Agregar tipo de cambio a cash_registers
ALTER TABLE cash_registers
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,2) DEFAULT 570.00 NOT NULL;

COMMENT ON COLUMN cash_registers.exchange_rate IS 'Tipo de cambio USD a CRC configurado al abrir la caja (ej: 570.00 significa $1 = ₡570)';

-- 2. Agregar campos de pago en dólares a sales
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3) DEFAULT 'CRC' NOT NULL,
  ADD COLUMN IF NOT EXISTS amount_received_usd DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used DECIMAL(10,2);

COMMENT ON COLUMN sales.payment_currency IS 'Moneda de pago: CRC (colones) o USD (dólares)';
COMMENT ON COLUMN sales.amount_received_usd IS 'Monto recibido en dólares (si payment_currency = USD)';
COMMENT ON COLUMN sales.exchange_rate_used IS 'Tipo de cambio usado en la transacción (si payment_currency = USD)';

-- 3. Crear índices para consultas de ventas en dólares
CREATE INDEX IF NOT EXISTS idx_sales_payment_currency ON sales(payment_currency);
CREATE INDEX IF NOT EXISTS idx_cash_registers_exchange_rate ON cash_registers(exchange_rate);

-- 4. Validar que si payment_currency = 'USD', entonces amount_received_usd debe estar presente
ALTER TABLE sales
  ADD CONSTRAINT check_usd_payment
  CHECK (
    (payment_currency = 'CRC') OR
    (payment_currency = 'USD' AND amount_received_usd IS NOT NULL AND exchange_rate_used IS NOT NULL)
  );
