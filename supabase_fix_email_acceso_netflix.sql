-- ============================================
-- Completar email_acceso para clientes en "pantalla hija" de Netflix
-- que quedaron sin ese dato en el seed inicial (Melissa Dominguez y otros 10)
-- ============================================

-- any Cifuentes (cuenta madre: multiservicios.user1@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user3.1@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'any Cifuentes - amiga de mabel Fernanda'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user1@gmail.com'
  AND s.email_acceso IS NULL;

-- Marianna Cartagena, pantalla 1 (cuenta madre: multiservicios.user2@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user16.2@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Marianna Cartagena'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user2@gmail.com'
  AND s.email_acceso IS NULL;

-- Manuel amigo de aileen (cuenta madre: multiservicios.user10.1@outlook.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user14.1@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Manuel amigo de aileen'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user10.1@outlook.com'
  AND s.email_acceso IS NULL;

-- Vanessa Villegas Pino (cuenta madre: multiservicios.user6@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user6.1@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Vanessa Villegas Pino'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user6@gmail.com'
  AND s.email_acceso IS NULL;

-- Tiana - Rosalba, suscripción de Netflix (cuenta madre: multiservicios.user10@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user7.2@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Tiana - Rosalba'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user10@gmail.com'
  AND s.email_acceso IS NULL;

-- Andres Inca, suscripción de Netflix (cuenta madre: multiservicios.user11@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user5.2@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Andres Inca'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user11@gmail.com'
  AND s.email_acceso IS NULL;

-- Marianna Cartagena, pantalla 2 (cuenta madre: multiservicios.user12@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user4.2@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Marianna Cartagena'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user12@gmail.com'
  AND s.email_acceso IS NULL;

-- Millan Maria Jose, "cuenta 2" de Netflix (cuenta madre: multiservicios.user14@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user4.1@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Millan Maria Jose'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user14@gmail.com'
  AND s.email_acceso IS NULL;

-- Millan Carlos Garcia, suscripción de Netflix (cuenta madre: multiservicios.user16@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user8.1@outlook.es'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Millan Carlos Garcia'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user16@gmail.com'
  AND s.email_acceso IS NULL;

-- Faisury - Froy (cuenta madre: multiservicios.user17.2@outlook.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user13@gmail.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Faisury - Froy'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user17.2@outlook.com'
  AND s.email_acceso IS NULL;

-- Melissa Dominguez (cuenta madre: multiservicios.user8@gmail.com)
UPDATE suscripciones s SET email_acceso = 'multiservicios.user7.1@outlook.com'
FROM clientes_streaming cl, cuentas_streaming cu
WHERE s.cliente_id = cl.id AND s.cuenta_id = cu.id
  AND cl.nombre = 'Melissa Dominguez'
  AND cu.servicio = 'Netflix' AND cu.email = 'multiservicios.user8@gmail.com'
  AND s.email_acceso IS NULL;

-- Verificación: deben quedar 11 filas actualizadas en total.
-- Este SELECT muestra todas las suscripciones de Netflix en cuentas de 2/4 pantallas
-- que AÚN no tienen email_acceso (deberían ser solo las que usan el mismo correo
-- que la cuenta madre, ej. Juan Carlos, Hernando Duque, Celita-Dorita/espe).
SELECT s.id, cl.nombre AS cliente, cu.email AS cuenta_madre, s.tipo_acceso, s.email_acceso
FROM suscripciones s
JOIN clientes_streaming cl ON cl.id = s.cliente_id
JOIN cuentas_streaming cu ON cu.id = s.cuenta_id
WHERE cu.servicio = 'Netflix'
  AND cu.tipo_cuenta != 'Netflix 1 pantalla'
  AND s.email_acceso IS NULL
ORDER BY cu.email, s.tipo_acceso;
