-- =============================================================================
-- WATS – Splash Images System
-- =============================================================================

-- Splash images table for mobile app onboarding carousel
CREATE TABLE IF NOT EXISTS public.splash_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title_sw TEXT,
  title_en TEXT,
  description_sw TEXT,
  description_en TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_splash_images_active ON public.splash_images(is_active, sort_order);

-- RLS Policies
ALTER TABLE public.splash_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view active splash images (for mobile app)
CREATE POLICY "Anyone can view active splash images"
  ON public.splash_images
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage splash images
CREATE POLICY "Admins can insert splash images"
  ON public.splash_images
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update splash images"
  ON public.splash_images
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete splash images"
  ON public.splash_images
  FOR DELETE
  USING (public.is_admin());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_splash_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_splash_images_updated_at
  BEFORE UPDATE ON public.splash_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_splash_images_updated_at();

-- Storage policies for splash images folder
-- Allow admins to upload/update/delete splash images
DROP POLICY IF EXISTS "media_splash_upload_admin" ON storage.objects;
CREATE POLICY "media_splash_upload_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'splash'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "media_splash_update_admin" ON storage.objects;
CREATE POLICY "media_splash_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'splash'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "media_splash_delete_admin" ON storage.objects;
CREATE POLICY "media_splash_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'splash'
  AND public.is_admin()
);

-- Allow public read access to splash images (for mobile app)
DROP POLICY IF EXISTS "media_splash_select_public" ON storage.objects;
CREATE POLICY "media_splash_select_public" ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'splash'
);
