-- app_settings is read and written only by the server-side Postgres connection.
-- Keep Supabase's PostgREST roles out: public branding is served through
-- /api/settings, not through the Data API.
ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;

-- Supabase creates the anon/authenticated roles, but local and CI databases
-- may not have them. Revoke only when present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE "public"."app_settings" FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE "public"."app_settings" FROM authenticated';
  END IF;
END
$$;

REVOKE ALL ON TABLE "public"."app_settings" FROM PUBLIC;
