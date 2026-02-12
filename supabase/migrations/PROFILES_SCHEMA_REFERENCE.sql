-- =============================================================================
-- WATS – Profile schema reference (baada ya migration 01)
-- =============================================================================
-- Kumbukumbu tu. Schema halisi inatengenezwa na migration 01.
-- Usi-run file hii peke yake; tumia: supabase db reset au supabase migration up
-- =============================================================================

-- Watumiaji wa kawaida (mobile app, carts, orders): public.profile
-- role = 'customer' tu (mfumo wa vendor umeondolewa)
CREATE TABLE IF NOT EXISTS public.profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  phone_normalized TEXT GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '\D', '', 'g')) STORED,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'customer' CHECK (role = 'customer'),
  locale TEXT DEFAULT 'sw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wasimamizi (admin dashboard): public.admin_profile
CREATE TABLE IF NOT EXISTS public.admin_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: handle_new_user() – role = 'admin' → admin_profile; vinginevyo → profile
-- grant_admin_by_email('email') – weka mtumiaji kwenye admin_profile
-- See: supabase/migrations/20250212000001_01_complete_schema.sql
