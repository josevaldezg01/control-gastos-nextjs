-- ============================================
-- Complemento a supabase_add_auth_rls.sql: cubre 2 tablas que no estaban
-- en la lista original (bancos, cierres_mensuales) y que el código actual
-- no usa, pero que seguían con política abierta ("permitir_insertar_anon").
-- ============================================

DO $$
DECLARE
  tbl text;
  pol text;
  tablas text[] := ARRAY['bancos', 'cierres_mensuales'];
BEGIN
  FOREACH tbl IN ARRAY tablas
  LOOP
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

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
