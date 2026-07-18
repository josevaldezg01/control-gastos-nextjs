-- ============================================
-- Agregar campo `tarjeta_vinculada` a cuentas_streaming
-- Para las cuentas que NO son Netflix (Prime, Disney+, HBO, YouTube),
-- que se pagan con una tarjeta/cuenta vinculada en vez de pines.
-- Ej: "Daviplata Jose 9466"
-- ============================================

ALTER TABLE cuentas_streaming ADD COLUMN IF NOT EXISTS tarjeta_vinculada TEXT;

COMMENT ON COLUMN cuentas_streaming.tarjeta_vinculada IS 'Tarjeta/cuenta bancaria vinculada para el cobro automático (no aplica a Netflix, que usa pines)';
