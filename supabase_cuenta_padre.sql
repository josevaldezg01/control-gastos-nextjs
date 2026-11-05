-- ============================================
-- Soporte para cuentas "add-on" de otra cuenta (ej: HBO Max contratado
-- como canal adicional dentro de una cuenta de Prime Video).
--
-- La cuenta add-on sigue siendo una fila normal de cuentas_streaming, con
-- su propio costo_mensual, dia_pago y clientes en suscripciones (ya
-- funciona todo eso sin cambios) — lo único nuevo es la referencia a la
-- cuenta de la que depende el cobro, para mostrarla agrupada en la UI.
-- ============================================

ALTER TABLE cuentas_streaming
  ADD COLUMN IF NOT EXISTS cuenta_padre_id INTEGER REFERENCES cuentas_streaming(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cuentas_streaming_padre ON cuentas_streaming(cuenta_padre_id);

COMMENT ON COLUMN cuentas_streaming.cuenta_padre_id IS 'Si no es NULL, esta cuenta se paga/factura a través de la cuenta referenciada (ej: HBO Max agregado como canal dentro de una cuenta Prime Video). No afecta costos, clientes ni cálculos de margen, es solo informativo.';
