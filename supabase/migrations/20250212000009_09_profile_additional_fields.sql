-- Add additional profile fields for verification
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT;

-- Index for national_id (unique if provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_national_id ON public.profile(national_id) WHERE national_id IS NOT NULL AND national_id <> '';

-- Function to check if profile is verified (all critical fields filled)
CREATE OR REPLACE FUNCTION public.is_profile_verified(profile_row public.profile)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    profile_row.display_name IS NOT NULL AND profile_row.display_name <> '' AND
    profile_row.phone IS NOT NULL AND profile_row.phone <> '' AND
    profile_row.email IS NOT NULL AND profile_row.email <> '' AND
    profile_row.date_of_birth IS NOT NULL AND
    profile_row.gender IS NOT NULL AND
    profile_row.national_id IS NOT NULL AND profile_row.national_id <> '' AND
    profile_row.region IS NOT NULL AND profile_row.region <> '' AND
    profile_row.district IS NOT NULL AND profile_row.district <> '' AND
    profile_row.street_address IS NOT NULL AND profile_row.street_address <> ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
