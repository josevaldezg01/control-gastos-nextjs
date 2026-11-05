# Reglas de base de datos (Supabase/Postgres)

## No incluir columnas de estado (activa/activo/eliminado) dentro de un UNIQUE normal

Si una tabla tiene una columna booleana de estado (`activa`, `activo`, `eliminado`, etc.) y necesitas
una restricción de unicidad que solo debe aplicar mientras el registro está en ese estado (ej. "no
puede haber dos suscripciones activas con el mismo tipo_acceso por cuenta"), **no** metas esa columna
dentro de un `UNIQUE (col_a, col_b, estado)`. Eso rompe en cuanto exista más de un registro histórico
en el estado "false" (cancelado, inactivo, eliminado) con los mismos valores en las demás columnas,
porque Postgres también exige unicidad para esa combinación.

Usar en su lugar un índice único parcial:

```sql
CREATE UNIQUE INDEX nombre_indice
  ON tabla (col_a, col_b)
  WHERE estado = true;
```

Caso real: `suscripciones.unique_tipo_acceso_por_cuenta` era `UNIQUE (cuenta_id, tipo_acceso, activa)`.
Al cancelar una suscripción (activa=false) chocaba con otra suscripción ya cancelada antes con el
mismo `cuenta_id`+`tipo_acceso`, lanzando `duplicate key value violates unique constraint` (error
23505) aunque la operación era válida. Se corrigió reemplazándolo por un índice único parcial
(`WHERE activa = true`). Ver `supabase_fix_unique_tipo_acceso.sql`.

Antes de agregar un nuevo `UNIQUE` que incluya una columna de estado/bandera, revisar si la intención
real es "único entre los activos" en vez de "único siempre", y usar índice parcial en ese caso.

## Los archivos seed_streaming_*.sql NO son el estado actual de la base de datos

`seed_streaming_01_cuentas.sql`, `seed_streaming_02_clientes.sql` y `seed_streaming_03_suscripciones.sql`
son el script de **carga inicial** del módulo de streaming (julio 2026). Quedan en el repo como
referencia histórica, pero la base de datos real avanza todos los días: se cancelan suscripciones y
cuentas (quedan en la tabla con `activa=false`, nunca se borran), cambian tarifas, entran clientes
nuevos. Usar estos archivos para calcular costos, ingresos o márgenes da números viejos y puede llevar
a una conclusión de negocio equivocada (pasó: con el seed el margen daba 23.9%, con el dato real de la
base era 16.2% — una diferencia material para una decisión de "¿cierro este negocio o no?").

Para cualquier análisis de costos/ingresos/márgenes de streaming (o cualquier pregunta sobre el estado
actual de `cuentas_streaming`, `suscripciones`, `clientes_streaming`), consultar la base de datos en
vivo, no los seeds. El anon key de `.env.local` no sirve para esto (RLS bloquea la lectura sin sesión).
`telegram-bot/.env` tiene `SUPABASE_SERVICE_ROLE_KEY` (bypasea RLS) — usarla solo para lecturas, nunca
para escribir, y filtrar siempre por `activa=true` al sumar costos/ingresos vigentes, porque las filas
canceladas se quedan en la tabla.

## El "miembro extra" de Netflix que cuenta la app como cupo libre NO es gratis

`hooks/useStreaming.ts` (función `getEspaciosDisponibles`) y `components/streaming/modals/DetalleCuentaModal.tsx`
calculan la capacidad de una cuenta Netflix como pantallas del plan **más** miembros extra: "2 pantallas"
cuenta como 3 cupos (2 + 1 miembro extra), "4 pantallas" como 6 cupos (4 + 2 miembros extra). Esos
miembros extra son una función real de Netflix, pero Netflix cobra un costo mensual adicional por cada
uno activado — costo que no se registra en `cuentas_streaming.costo_mensual` ni en ninguna otra tabla.

Esto significa que cualquier cálculo de "cupos disponibles", capacidad libre o plan de consolidación de
cuentas que use ese número de 3/6 cupos por cuenta está asumiendo capacidad gratis que en realidad tiene
costo. Si se vende/usa un cupo de miembro extra, su costo real debe sumarse a mano a `costo_mensual` de
esa cuenta (o registrarse como un costo aparte) antes de dar por buena cualquier cifra de margen que lo
incluya. Para cálculos de margen o de "cuántas cuentas necesito/puedo cancelar", usar solo la capacidad
base del plan (1/2/4 pantallas, 5 perfiles) hasta que el costo del miembro extra quede trackeado en el
esquema.

## RLS con "auth.uid() IS NOT NULL" da acceso a CUALQUIER usuario del proyecto, no solo a los tuyos

`supabase_add_auth_rls.sql` protege `movimientos`, `prestamos_familiares`, `cuentas_streaming`,
`suscripciones`, etc. con la política `auth.uid() IS NOT NULL` — es decir, "cualquier usuario autenticado
en este proyecto de Supabase puede leer y escribir aquí". Eso no es "solo tú": es cualquier cuenta que
exista en el Auth de ese proyecto, de cualquier app que lo use, presente o futura.

Pasó en la práctica: al querer agregar login a una app Android de aprendizaje reusando este mismo
proyecto de Supabase (FinanceFlow, `kefmaroetfwunrvytujw`), cualquier usuario de prueba creado ahí
(hasta uno con clave "1234") habría quedado con acceso completo a los datos financieros reales, porque
comparte el mismo Auth y la misma política. Se corrigió restringiendo esas tablas a un `auth.uid()`
específico (el id del único usuario real) en vez de "cualquiera que esté logueado" — ver
`supabase_appx_login_rls.sql`.

Antes de reusar este proyecto de Supabase para otra app (de aprendizaje, un prototipo, lo que sea):
nunca asumir que "cualquier usuario logueado" es un límite de seguridad razonable si el proyecto se
comparte entre apps. Opciones seguras: (a) proyecto de Supabase separado para la app nueva, o (b) si se
reusa el proyecto, restringir las tablas sensibles a los `auth.uid()` específicos autorizados y dar a la
app nueva sus propias tablas con sus propias políticas, nunca dejar la política general en
"IS NOT NULL" cuando hay más de una app o más de un tipo de usuario en juego.

## Las tablas nuevas no heredan RLS solas — hay que acordarse de agregarlas a la lista

Los scripts que bloquean RLS (`supabase_add_auth_rls.sql`, `_extra.sql`, `supabase_appx_login_rls.sql`)
funcionan con un `ARRAY` de nombres de tabla escrito a mano. Cuando se corrió el primero, `bancos` y
`cierres_mensuales` no estaban en la lista y quedaron abiertas a "cualquier usuario logueado" — se
necesitó un script `_extra` después para cerrarlas. Lo mismo volvió a pasar con todo el módulo `rater_*`
(`rater_config`, `rater_tareas`, `rater_historico_anual`): se creó en `supabase_rater_tables.sql` sin
RLS propio y nadie lo agregó a la lista hasta que se encontró por accidente revisando el resultado de
`supabase_appx_login_rls.sql`.

Cada vez que se cree una tabla nueva en este proyecto: ponerle RLS en el mismo script que la crea (no
depender de que alguien la agregue después a un script separado de "cerrar todo"). Y de vez en cuando,
correr esta consulta para encontrar tablas sin RLS o con política abierta:

```sql
SELECT t.tablename, p.policyname, p.cmd
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
```

Una fila con `policyname` en NULL es una tabla sin ninguna política (o sin RLS habilitado) — hay que
revisarla.
