-- ============================================
-- Agregar campo `proxima_recarga` a cuentas_streaming
-- Fecha real del próximo pin a aplicar (calculada según el pin usado),
-- reemplaza el supuesto fijo de "día de pago" para cuentas Netflix.
-- ============================================

ALTER TABLE cuentas_streaming ADD COLUMN IF NOT EXISTS proxima_recarga DATE;

COMMENT ON COLUMN cuentas_streaming.proxima_recarga IS 'Fecha estimada del próximo pin a aplicar (Netflix), calculada a partir del último pago y el valor del pin';
