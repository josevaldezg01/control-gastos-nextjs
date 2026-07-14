-- ============================================
-- Agregar columna `codigo_pin` a costos_streaming
-- Para guardar el código del pin de Netflix aplicado en cada recarga
-- ============================================

ALTER TABLE costos_streaming ADD COLUMN IF NOT EXISTS codigo_pin TEXT;

COMMENT ON COLUMN costos_streaming.codigo_pin IS 'Código del pin de recarga aplicado (solo aplica a Netflix)';
