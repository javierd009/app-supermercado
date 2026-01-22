-- =====================================================
-- Migración: Preparación para Facturación Electrónica
-- Fecha: 2026-01-21
-- Descripción: Agrega campos CABYS, datos del emisor y configuración FE
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPO CABYS A PRODUCTOS
-- =====================================================

-- Código CABYS (Catálogo de Bienes y Servicios) - 13 dígitos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cabys_code VARCHAR(13);

-- Unidad de medida para facturación (Unid, Kg, Lt, m, etc.)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit_measure VARCHAR(10) DEFAULT 'Unid';

-- Código comercial interno (SKU/Barcode ya existe, pero este es específico para FE)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commercial_code VARCHAR(20);

-- Índice para búsqueda por CABYS
CREATE INDEX IF NOT EXISTS idx_products_cabys_code ON products(cabys_code);

-- Comentarios
COMMENT ON COLUMN products.cabys_code IS 'Código CABYS de 13 dígitos del Banco Central de Costa Rica';
COMMENT ON COLUMN products.unit_measure IS 'Unidad de medida para factura electrónica (Unid, Kg, Lt, m, etc.)';
COMMENT ON COLUMN products.commercial_code IS 'Código comercial interno para factura electrónica';

-- =====================================================
-- 2. TABLA DE INFORMACIÓN DEL NEGOCIO (EMISOR)
-- =====================================================

CREATE TABLE IF NOT EXISTS business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información legal
  legal_name VARCHAR(100) NOT NULL,           -- Razón social
  trade_name VARCHAR(100),                     -- Nombre comercial
  id_type VARCHAR(2) NOT NULL DEFAULT '01',   -- 01=Física, 02=Jurídica, 03=DIMEX, 04=NITE
  id_number VARCHAR(12) NOT NULL,             -- Cédula o jurídica

  -- Actividad económica
  activity_code VARCHAR(6),                    -- Código CIIU (6 dígitos)
  activity_description VARCHAR(200),           -- Descripción de la actividad

  -- Ubicación
  province VARCHAR(50),
  canton VARCHAR(50),
  district VARCHAR(50),
  neighborhood VARCHAR(100),
  other_address TEXT,                          -- Dirección adicional

  -- Contacto
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(100),

  -- Configuración de Facturación Electrónica
  fe_enabled BOOLEAN DEFAULT false,            -- ¿FE habilitada?
  fe_environment VARCHAR(10) DEFAULT 'stag',   -- 'stag' (pruebas) o 'prod' (producción)
  fe_atv_user VARCHAR(100),                    -- Usuario ATV (portal Hacienda)
  fe_atv_password_encrypted TEXT,              -- Contraseña encriptada
  fe_certificate_path TEXT,                    -- Ruta al certificado .p12
  fe_certificate_pin_encrypted TEXT,           -- PIN del certificado encriptado

  -- Consecutivos de documentos (por tipo)
  consecutive_factura INTEGER DEFAULT 1,       -- Factura Electrónica (01)
  consecutive_tiquete INTEGER DEFAULT 1,       -- Tiquete Electrónico (04)
  consecutive_nc INTEGER DEFAULT 1,            -- Nota de Crédito (03)
  consecutive_nd INTEGER DEFAULT 1,            -- Nota de Débito (02)
  consecutive_fec INTEGER DEFAULT 1,           -- Factura Electrónica de Compra (08)
  consecutive_fee INTEGER DEFAULT 1,           -- Factura Electrónica de Exportación (09)

  -- Código de sucursal y terminal
  branch_code VARCHAR(3) DEFAULT '001',        -- Código de sucursal (001-999)
  terminal_code VARCHAR(5) DEFAULT '00001',    -- Código de terminal (00001-99999)

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solo puede haber un registro de business_info
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_info_single ON business_info((true));

-- Comentarios
COMMENT ON TABLE business_info IS 'Información del negocio para facturación electrónica';
COMMENT ON COLUMN business_info.fe_environment IS 'Ambiente de facturación: stag=pruebas, prod=producción';

-- =====================================================
-- 3. TABLA DE COMPROBANTES ELECTRÓNICOS
-- =====================================================

CREATE TABLE IF NOT EXISTS electronic_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia a venta
  sale_id UUID REFERENCES sales(id),

  -- Clave numérica (50 dígitos)
  numeric_key VARCHAR(50) NOT NULL UNIQUE,

  -- Tipo de documento
  document_type VARCHAR(2) NOT NULL,          -- 01=Factura, 02=ND, 03=NC, 04=Tiquete

  -- Consecutivo
  consecutive VARCHAR(20) NOT NULL,            -- 20 caracteres alfanuméricos

  -- Datos del receptor (si aplica)
  receptor_name VARCHAR(100),
  receptor_id_type VARCHAR(2),
  receptor_id_number VARCHAR(12),
  receptor_email VARCHAR(100),

  -- Estado de envío
  status VARCHAR(20) DEFAULT 'pending',        -- pending, sent, accepted, rejected

  -- XML generado
  xml_content TEXT,                            -- XML firmado y enviado
  xml_response TEXT,                           -- Respuesta de Hacienda

  -- Respuesta de Hacienda
  hacienda_status VARCHAR(20),                 -- 1=Aceptado, 2=Aceptado parcial, 3=Rechazado
  hacienda_message TEXT,                       -- Mensaje de Hacienda
  hacienda_detail TEXT,                        -- Detalle del error si fue rechazado

  -- Fechas
  emission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE,
  response_date TIMESTAMP WITH TIME ZONE,

  -- Modo de facturación usado
  invoice_mode VARCHAR(20) DEFAULT 'regular',  -- 'regular' o 'electronic'

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_electronic_documents_sale_id ON electronic_documents(sale_id);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_status ON electronic_documents(status);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_emission_date ON electronic_documents(emission_date DESC);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_document_type ON electronic_documents(document_type);

-- Comentarios
COMMENT ON TABLE electronic_documents IS 'Registro de comprobantes electrónicos enviados a Hacienda';
COMMENT ON COLUMN electronic_documents.numeric_key IS 'Clave numérica de 50 dígitos única del documento';

-- =====================================================
-- 4. AGREGAR CAMPOS A VENTAS PARA FACTURACIÓN
-- =====================================================

-- Modo de facturación
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS invoice_mode VARCHAR(20) DEFAULT 'regular';

-- Datos del cliente para factura electrónica
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS customer_id_type VARCHAR(2);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS customer_id_number VARCHAR(12);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100);

-- Comentarios
COMMENT ON COLUMN sales.invoice_mode IS 'Modo de facturación: regular (ticket normal) o electronic (factura electrónica)';
COMMENT ON COLUMN sales.customer_id_type IS 'Tipo de identificación del cliente para FE: 01=Física, 02=Jurídica, 03=DIMEX';
COMMENT ON COLUMN sales.customer_id_number IS 'Número de identificación del cliente para FE';

-- =====================================================
-- 5. ACTUALIZAR TABLA SALE_ITEMS PARA CABYS
-- =====================================================

-- Código CABYS del producto al momento de la venta
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS cabys_code VARCHAR(13);

-- Unidad de medida al momento de la venta
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS unit_measure VARCHAR(10) DEFAULT 'Unid';

-- Comentarios
COMMENT ON COLUMN sale_items.cabys_code IS 'Código CABYS del producto al momento de la venta';
COMMENT ON COLUMN sale_items.unit_measure IS 'Unidad de medida del producto al momento de la venta';

-- =====================================================
-- 6. CONFIGURACIÓN GLOBAL DE FACTURACIÓN
-- =====================================================

-- Agregar configuraciones a system_config si no existen
INSERT INTO system_config (key, value, description)
VALUES
  ('fe_default_mode', 'regular', 'Modo de facturación por defecto: regular o electronic'),
  ('fe_auto_send', 'false', '¿Enviar automáticamente a Hacienda al completar venta?'),
  ('fe_print_on_accept', 'true', '¿Imprimir ticket cuando Hacienda acepte?'),
  ('fe_contingency_enabled', 'true', '¿Permitir modo contingencia sin conexión?')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 7. TRIGGER PARA ACTUALIZAR CONSECUTIVOS
-- =====================================================

CREATE OR REPLACE FUNCTION increment_document_consecutive()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar el consecutivo correspondiente según el tipo de documento
  UPDATE business_info
  SET
    consecutive_factura = CASE WHEN NEW.document_type = '01' THEN consecutive_factura + 1 ELSE consecutive_factura END,
    consecutive_tiquete = CASE WHEN NEW.document_type = '04' THEN consecutive_tiquete + 1 ELSE consecutive_tiquete END,
    consecutive_nc = CASE WHEN NEW.document_type = '03' THEN consecutive_nc + 1 ELSE consecutive_nc END,
    consecutive_nd = CASE WHEN NEW.document_type = '02' THEN consecutive_nd + 1 ELSE consecutive_nd END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger al insertar documento
DROP TRIGGER IF EXISTS trg_increment_consecutive ON electronic_documents;
CREATE TRIGGER trg_increment_consecutive
  AFTER INSERT ON electronic_documents
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_consecutive();

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- business_info - Solo admins pueden modificar
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_info_read_all" ON business_info;
CREATE POLICY "business_info_read_all" ON business_info
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "business_info_write_admin" ON business_info;
CREATE POLICY "business_info_write_admin" ON business_info
  FOR ALL USING (true); -- En producción, restringir a admin

-- electronic_documents - Lectura para todos, escritura para usuarios autenticados
ALTER TABLE electronic_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "electronic_documents_read_all" ON electronic_documents;
CREATE POLICY "electronic_documents_read_all" ON electronic_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "electronic_documents_write_auth" ON electronic_documents;
CREATE POLICY "electronic_documents_write_auth" ON electronic_documents
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "electronic_documents_update_auth" ON electronic_documents;
CREATE POLICY "electronic_documents_update_auth" ON electronic_documents
  FOR UPDATE USING (true);

-- =====================================================
-- 9. INSERTAR REGISTRO INICIAL DE BUSINESS_INFO
-- =====================================================

INSERT INTO business_info (
  legal_name,
  trade_name,
  id_type,
  id_number,
  province,
  canton,
  district,
  phone,
  email,
  fe_enabled
) VALUES (
  'Mi Negocio S.A.',
  'Sabrosita',
  '02',
  '3101234567',
  'San José',
  'Central',
  'Carmen',
  '2222-2222',
  'facturacion@minegocio.com',
  false
) ON CONFLICT DO NOTHING;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
