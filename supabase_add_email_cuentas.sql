-- ============================================
-- Agregar columna `email` a cuentas_streaming
-- Identificador único y visible del login/correo de cada cuenta,
-- para diferenciar cuentas del mismo servicio (ej. 25 cuentas "Netflix 2 pantallas")
-- ============================================

ALTER TABLE cuentas_streaming ADD COLUMN IF NOT EXISTS email TEXT;

-- Rellenar con lo que ya estaba guardado en notas (formato 'Login: correo@dominio.com')
-- de los datos sembrados anteriormente
UPDATE cuentas_streaming
SET email = TRIM(REPLACE(notas, 'Login: ', ''))
WHERE notas LIKE 'Login: %' AND email IS NULL;

COMMENT ON COLUMN cuentas_streaming.email IS 'Correo/login con el que se accede a esta cuenta de streaming';

-- Verificación: cuentas que quedaron sin email (deberían ser 0 si todas venían de "Login: ...")
SELECT id, servicio, tipo_cuenta, notas
FROM cuentas_streaming
WHERE email IS NULL;
