-- =============================================================================
-- WATS – Helper functions: grant_admin_by_email
-- =============================================================================

-- grant_admin_by_email: weka mtumiaji kwenye admin_profile (ondoa kutoka profile)
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid UUID;
BEGIN
  IF admin_email IS NULL OR TRIM(admin_email) = '' THEN
    RETURN 'Error: Weka barua pepe halisi.';
  END IF;

  SELECT id INTO uid
  FROM auth.users
  WHERE email = TRIM(admin_email)
  LIMIT 1;

  IF uid IS NULL THEN
    RETURN 'Error: Hakuna mtumiaji mwenye email: ' || TRIM(admin_email);
  END IF;

  DELETE FROM public.profile WHERE id = uid;

  INSERT INTO public.admin_profile (id, first_name, last_name, email)
  VALUES (uid, NULL, NULL, TRIM(admin_email))
  ON CONFLICT (id) DO UPDATE SET email = TRIM(admin_email), updated_at = now();

  RETURN 'OK: Admin imewekwa kwa ' || TRIM(admin_email) || '. Ingia tena kwenye Admin.';
END;
$$;

COMMENT ON FUNCTION public.grant_admin_by_email(TEXT) IS
  'Weka mtumiaji kwenye admin_profile (ondoa kutoka profile). Tumia kwenye SQL Editor.';
