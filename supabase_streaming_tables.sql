-- ============================================
-- Script de Creación de Tablas para Módulo de Streaming
-- Sistema de Control de Gastos - Jose Valdez
-- ============================================

-- Tabla 1: Cuentas de Streaming
-- Almacena las cuentas contratadas (Netflix, Prime, etc)
CREATE TABLE IF NOT EXISTS cuentas_streaming (
  id SERIAL PRIMARY KEY,
  servicio TEXT NOT NULL CHECK (servicio IN ('Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'YouTube Premium')),
  tipo_cuenta TEXT NOT NULL,
  extras JSONB DEFAULT '{}',
  costo_mensual DECIMAL(10,2) NOT NULL CHECK (costo_mensual >= 0),
  dia_pago INTEGER CHECK (dia_pago >= 1 AND dia_pago <= 31),
  activa BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cuentas_streaming IS 'Cuentas de servicios de streaming (Netflix, Prime, Disney+, HBO, YouTube)';
COMMENT ON COLUMN cuentas_streaming.servicio IS 'Nombre del servicio de streaming';
COMMENT ON COLUMN cuentas_streaming.tipo_cuenta IS 'Tipo de plan: Netflix 1/2/4 pantallas, 5 perfiles, Premium';
COMMENT ON COLUMN cuentas_streaming.extras IS 'Características adicionales (ej: juegos móviles Netflix)';
COMMENT ON COLUMN cuentas_streaming.costo_mensual IS 'Costo mensual que se paga al servicio';
COMMENT ON COLUMN cuentas_streaming.dia_pago IS 'Día del mes en que se paga (1-31)';

-- ============================================

-- Tabla 2: Clientes de Streaming
-- Almacena los clientes que rentan pantallas/perfiles
CREATE TABLE IF NOT EXISTS clientes_streaming (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE clientes_streaming IS 'Clientes que rentan pantallas/perfiles de streaming';
COMMENT ON COLUMN clientes_streaming.nombre IS 'Nombre completo del cliente';
COMMENT ON COLUMN clientes_streaming.activo IS 'Indica si el cliente está activo';

-- ============================================

-- Tabla 3: Suscripciones
-- Relaciona clientes con cuentas (asignación de pantallas/perfiles)
CREATE TABLE IF NOT EXISTS suscripciones (
  id SERIAL PRIMARY KEY,
  cuenta_id INTEGER NOT NULL REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes_streaming(id) ON DELETE CASCADE,
  tipo_acceso TEXT NOT NULL,
  costo_mensual DECIMAL(10,2) NOT NULL CHECK (costo_mensual >= 0),
  proximo_cobro DATE NOT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  activa BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_tipo_acceso_por_cuenta UNIQUE (cuenta_id, tipo_acceso, activa)
);

COMMENT ON TABLE suscripciones IS 'Asignación de pantallas/perfiles a clientes';
COMMENT ON COLUMN suscripciones.tipo_acceso IS 'Pantalla 1-4, Perfil 1-5, Cuenta principal, Cuenta vinculada 1-5';
COMMENT ON COLUMN suscripciones.costo_mensual IS 'Lo que paga el cliente por este acceso';
COMMENT ON COLUMN suscripciones.proximo_cobro IS 'Fecha del próximo cobro (se actualiza al cobrar)';
COMMENT ON COLUMN suscripciones.fecha_fin IS 'NULL si activa, fecha si fue cancelada';

-- ============================================

-- Tabla 4: Pagos de Streaming (Histórico)
-- Registra todos los pagos recibidos de clientes
CREATE TABLE IF NOT EXISTS pagos_streaming (
  id SERIAL PRIMARY KEY,
  suscripcion_id INTEGER NOT NULL REFERENCES suscripciones(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes_streaming(id),
  servicio TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  fecha_pago DATE NOT NULL,
  banco_destino TEXT NOT NULL,
  mes_contable TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE pagos_streaming IS 'Histórico de pagos recibidos de clientes';
COMMENT ON COLUMN pagos_streaming.cliente_id IS 'Desnormalizado para queries rápidas';
COMMENT ON COLUMN pagos_streaming.servicio IS 'Desnormalizado: Netflix, Prime, etc';
COMMENT ON COLUMN pagos_streaming.banco_destino IS 'Banco donde se recibió el pago';
COMMENT ON COLUMN pagos_streaming.mes_contable IS 'Formato YYYY-MM del mes contable';

-- ============================================

-- Tabla 5: Costos de Streaming (Histórico)
-- Registra todos los pagos realizados a servicios
CREATE TABLE IF NOT EXISTS costos_streaming (
  id SERIAL PRIMARY KEY,
  cuenta_id INTEGER NOT NULL REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
  servicio TEXT NOT NULL,
  tipo_cuenta TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  fecha_pago DATE NOT NULL,
  banco_origen TEXT NOT NULL,
  mes_contable TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE costos_streaming IS 'Histórico de pagos realizados a servicios de streaming';
COMMENT ON COLUMN costos_streaming.servicio IS 'Desnormalizado: Netflix, Prime, etc';
COMMENT ON COLUMN costos_streaming.tipo_cuenta IS 'Desnormalizado: Netflix 4 pantallas, etc';
COMMENT ON COLUMN costos_streaming.banco_origen IS 'Banco desde donde se pagó';
COMMENT ON COLUMN costos_streaming.mes_contable IS 'Formato YYYY-MM del mes contable';

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_suscripciones_cuenta
  ON suscripciones(cuenta_id) WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_suscripciones_cliente
  ON suscripciones(cliente_id) WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_suscripciones_proximo_cobro
  ON suscripciones(proximo_cobro) WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_suscripciones_activa
  ON suscripciones(activa);

-- Índices para pagos
CREATE INDEX IF NOT EXISTS idx_pagos_mes_contable
  ON pagos_streaming(mes_contable);

CREATE INDEX IF NOT EXISTS idx_pagos_cliente
  ON pagos_streaming(cliente_id);

CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion
  ON pagos_streaming(suscripcion_id);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha
  ON pagos_streaming(fecha_pago DESC);

-- Índices para costos
CREATE INDEX IF NOT EXISTS idx_costos_mes_contable
  ON costos_streaming(mes_contable);

CREATE INDEX IF NOT EXISTS idx_costos_cuenta
  ON costos_streaming(cuenta_id);

CREATE INDEX IF NOT EXISTS idx_costos_fecha
  ON costos_streaming(fecha_pago DESC);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE cuentas_streaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_streaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_streaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_streaming ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE ACCESO (Permitir todo para desarrollo)
-- NOTA: Ajustar según necesidades de producción
-- ============================================

-- Políticas para cuentas_streaming
CREATE POLICY "Permitir todo en cuentas_streaming" ON cuentas_streaming
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para clientes_streaming
CREATE POLICY "Permitir todo en clientes_streaming" ON clientes_streaming
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para suscripciones
CREATE POLICY "Permitir todo en suscripciones" ON suscripciones
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para pagos_streaming
CREATE POLICY "Permitir todo en pagos_streaming" ON pagos_streaming
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para costos_streaming
CREATE POLICY "Permitir todo en costos_streaming" ON costos_streaming
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%streaming%'
ORDER BY tablename;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
