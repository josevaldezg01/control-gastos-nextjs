-- ============================================
-- Agregar columna `email_acceso` a suscripciones
-- Para cuando el cliente NO usa el correo de la cuenta madre sino un login
-- "hija" distinto (ej. Netflix con pantallas repartidas en varios correos).
-- Útil para dar soporte: saber exactamente con qué correo entra ese cliente.
-- ============================================

ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS email_acceso TEXT;

-- Rellenar automáticamente los casos ya sembrados donde quedó anotado
-- como "login hija: correo@dominio.com" dentro de notas
UPDATE suscripciones
SET email_acceso = TRIM(substring(notas from 'login hija:\s*(\S+)'))
WHERE notas ILIKE '%login hija:%' AND email_acceso IS NULL;

COMMENT ON COLUMN suscripciones.email_acceso IS 'Correo/login específico con el que este cliente accede, si es distinto al de la cuenta madre (soporte)';

-- Verificación: suscripciones que mencionaban "login hija" pero no se pudieron completar
SELECT id, cliente_id, cuenta_id, notas
FROM suscripciones
WHERE notas ILIKE '%login hija:%' AND email_acceso IS NULL;
