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
