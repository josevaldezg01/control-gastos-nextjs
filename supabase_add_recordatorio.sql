-- Agregar campo fecha_recordatorio a la tabla suscripciones
ALTER TABLE suscripciones
ADD COLUMN IF NOT EXISTS fecha_recordatorio DATE;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_suscripciones_recordatorio
ON suscripciones(fecha_recordatorio)
WHERE activa = true;

-- Comentario explicativo
COMMENT ON COLUMN suscripciones.fecha_recordatorio IS 'Fecha del último recordatorio de cobro enviado al cliente';
