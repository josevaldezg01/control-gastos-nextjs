-- Agregar campos de consolidación a pagos_streaming
ALTER TABLE pagos_streaming
ADD COLUMN IF NOT EXISTS consolidado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_consolidacion DATE,
ADD COLUMN IF NOT EXISTS consolidacion_id INTEGER;

-- Agregar campos de consolidación a costos_streaming
ALTER TABLE costos_streaming
ADD COLUMN IF NOT EXISTS consolidado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_consolidacion DATE,
ADD COLUMN IF NOT EXISTS consolidacion_id INTEGER;

-- Crear tabla de consolidaciones
CREATE TABLE IF NOT EXISTS consolidaciones_streaming (
  id SERIAL PRIMARY KEY,
  monto_cobros DECIMAL(10,2) NOT NULL,
  monto_costos DECIMAL(10,2) NOT NULL,
  ganancia_neta DECIMAL(10,2) NOT NULL,
  movimiento_id INTEGER REFERENCES movimientos(id),
  fecha_consolidacion DATE NOT NULL,
  mes_contable TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_consolidado ON pagos_streaming(consolidado);
CREATE INDEX IF NOT EXISTS idx_costos_consolidado ON costos_streaming(consolidado);
CREATE INDEX IF NOT EXISTS idx_consolidaciones_mes ON consolidaciones_streaming(mes_contable);

-- RLS
ALTER TABLE consolidaciones_streaming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en consolidaciones_streaming"
  ON consolidaciones_streaming
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE consolidaciones_streaming IS 'Registro de consolidaciones de ganancias de streaming';
COMMENT ON COLUMN pagos_streaming.consolidado IS 'Indica si este cobro ya fue consolidado como ganancia personal';
COMMENT ON COLUMN costos_streaming.consolidado IS 'Indica si este costo ya fue consolidado';
