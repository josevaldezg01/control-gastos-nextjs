-- ============================================
-- Módulo Rater (evaluador de resultados de búsqueda pagado por hora)
-- Tablas con prefijo rater_ para identificar claramente el módulo.
-- ============================================

-- Configuración actual (tarifa por hora en USD y tasa de cambio USD→COP)
-- Fila única, igual patrón que mes_activo_global
CREATE TABLE IF NOT EXISTS rater_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  tarifa_hora_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  tasa_cambio DECIMAL(10,2) NOT NULL DEFAULT 4000,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT rater_config_single_row CHECK (id = 1)
);

INSERT INTO rater_config (id, tarifa_hora_usd, tasa_cambio)
VALUES (1, 0, 4000)
ON CONFLICT (id) DO NOTHING;

-- Tareas registradas por jornada (día)
CREATE TABLE IF NOT EXISTS rater_tareas (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  titulo TEXT NOT NULL,
  minutos INTEGER NOT NULL CHECK (minutos > 0),
  -- Tarifa y tasa de cambio congeladas al momento de crear la tarea:
  -- si luego cambian, esta tarea no se recalcula.
  tarifa_hora_usd DECIMAL(10,2) NOT NULL,
  tasa_cambio DECIMAL(10,2) NOT NULL,
  ganancia_usd DECIMAL(10,2) GENERATED ALWAYS AS (ROUND((minutos / 60.0) * tarifa_hora_usd, 2)) STORED,
  ganancia_cop DECIMAL(12,2) GENERATED ALWAYS AS (ROUND((minutos / 60.0) * tarifa_hora_usd * tasa_cambio, 2)) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rater_tareas_fecha ON rater_tareas(fecha);

-- Histórico de años cerrados (se llena al usar "Cerrar Año")
CREATE TABLE IF NOT EXISTS rater_historico_anual (
  id SERIAL PRIMARY KEY,
  anio INTEGER NOT NULL UNIQUE,
  total_minutos INTEGER NOT NULL,
  total_tareas INTEGER NOT NULL,
  total_ganancia_usd DECIMAL(10,2) NOT NULL,
  total_ganancia_cop DECIMAL(12,2) NOT NULL,
  fecha_cierre DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: requiere sesión autenticada, igual que el resto de la app
ALTER TABLE rater_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rater_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rater_historico_anual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requiere sesion autenticada" ON rater_config
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Requiere sesion autenticada" ON rater_tareas
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Requiere sesion autenticada" ON rater_historico_anual
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
