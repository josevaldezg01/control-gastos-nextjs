-- ============================================
-- Tabla de Tareas/Pendientes del módulo de Streaming
-- Para no olvidar cambios pendientes (ej. "cambiar a Marianna de 2 a 1 pantalla")
-- Se puede vincular opcionalmente a un cliente y/o una cuenta.
-- ============================================

CREATE TABLE IF NOT EXISTS tareas_streaming (
  id SERIAL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes_streaming(id) ON DELETE CASCADE,
  cuenta_id INTEGER REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
  completada BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_completada DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE tareas_streaming IS 'Pendientes/recordatorios del módulo de streaming, opcionalmente ligados a un cliente o cuenta';

CREATE INDEX IF NOT EXISTS idx_tareas_completada ON tareas_streaming(completada);
CREATE INDEX IF NOT EXISTS idx_tareas_cliente ON tareas_streaming(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_cuenta ON tareas_streaming(cuenta_id);

ALTER TABLE tareas_streaming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en tareas_streaming" ON tareas_streaming
  FOR ALL USING (true) WITH CHECK (true);
