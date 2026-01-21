-- ===========================================
-- Insertar valores por defecto en tabla config
-- Fecha: 2026-01-17
-- ===========================================

-- Insertar configuración del negocio (solo si no existe)
INSERT INTO config (key, value) VALUES
  ('business_name', 'Sabrosita POS')
ON CONFLICT (key) DO NOTHING;

INSERT INTO config (key, value) VALUES
  ('business_phone', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO config (key, value) VALUES
  ('business_address', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO config (key, value) VALUES
  ('receipt_footer', '¡Gracias por su compra!')
ON CONFLICT (key) DO NOTHING;

-- Comentarios
COMMENT ON TABLE config IS 'Configuración del sistema (clave-valor)';
COMMENT ON COLUMN config.key IS 'Clave única de configuración';
COMMENT ON COLUMN config.value IS 'Valor de la configuración';
