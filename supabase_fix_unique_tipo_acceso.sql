-- ============================================
-- Fix: la restricción unique_tipo_acceso_por_cuenta incluía la columna
-- "activa", por lo que al cancelar una suscripción (activa = false) se
-- podía chocar con otra suscripción ya cancelada antes con el mismo
-- cuenta_id + tipo_acceso, arrojando:
--   duplicate key value violates unique constraint "unique_tipo_acceso_por_cuenta"
--
-- La regla real es: no puede haber dos suscripciones ACTIVAS con el mismo
-- tipo_acceso en la misma cuenta. Las canceladas no deben contar.
-- Se reemplaza la restricción por un índice único parcial (solo activa = true).
-- ============================================

ALTER TABLE suscripciones
  DROP CONSTRAINT IF EXISTS unique_tipo_acceso_por_cuenta;

CREATE UNIQUE INDEX IF NOT EXISTS unique_tipo_acceso_activo_por_cuenta
  ON suscripciones (cuenta_id, tipo_acceso)
  WHERE activa = true;
