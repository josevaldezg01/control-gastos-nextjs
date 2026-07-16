-- ============================================
-- Exigir sesión autenticada en TODAS las tablas de la app
-- Reemplaza cualquier política existente ("permitir todo") por una que
-- solo permite operar si hay una sesión de Supabase Auth válida
-- (auth.uid() IS NOT NULL). El bot de Telegram sigue funcionando porque
-- usa la service_role key (que ignora RLS por completo).
--
-- Es seguro correr esto varias veces: elimina dinámicamente cualquier
-- política existente en cada tabla antes de crear la nueva, sin importar
-- cómo se llamaran antes.
-- ============================================

DO $$
DECLARE
  tbl text;
  pol text;
  tablas text[] := ARRAY[
    'movimientos',
    'prestamos_familiares',
    'pagos_pendientes',
    'historial_mensual',
    'mes_activo_global',
    'sticky_notes',
    'tasks',
    'cuentas_streaming',
    'clientes_streaming',
    'suscripciones',
    'pagos_streaming',
    'costos_streaming',
    'consolidaciones_streaming',
    'tareas_streaming',
    'trip_etapas',
    'trip_tarjetas',
    'telegram_sessions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tablas
  LOOP
    -- Si la tabla no existe en este proyecto, se ignora sin error
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
      END LOOP;

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      EXECUTE format(
        'CREATE POLICY "Requiere sesion autenticada" ON public.%I FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Verificación: lista las políticas resultantes por tabla
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
