-- ============================================
-- Agregar campos de "pin pendiente de aplicar" a cuentas_streaming
-- Para guardar el código de un pin ya comprado mientras lo aplicas a Netflix,
-- antes de registrar el pago definitivo.
-- ============================================

ALTER TABLE cuentas_streaming ADD COLUMN IF NOT EXISTS pin_pendiente_codigo TEXT;
ALTER TABLE cuentas_streaming ADD COLUMN IF NOT EXISTS pin_pendiente_valor NUMERIC;

COMMENT ON COLUMN cuentas_streaming.pin_pendiente_codigo IS 'Código del pin comprado pero aún no aplicado/pagado';
COMMENT ON COLUMN cuentas_streaming.pin_pendiente_valor IS 'Valor del pin guardado en pin_pendiente_codigo';
