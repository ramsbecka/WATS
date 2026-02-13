-- =============================================================================
-- WATS – Banners System
-- =============================================================================

-- Banners table for home page promotional banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title_sw TEXT,
  title_en TEXT,
  description_sw TEXT,
  description_en TEXT,
  button_text_sw TEXT DEFAULT 'Shop Now',
  button_text_en TEXT DEFAULT 'Shop Now',
  button_link TEXT, -- Can be category ID, product ID, or external URL
  link_type TEXT CHECK (link_type IN ('category', 'product', 'url', NULL)), -- Type of link
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, sort_order);

-- RLS Policies
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;

-- Anyone can view active banners (for mobile app)
CREATE POLICY "Anyone can view active banners"
  ON public.banners
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage banners
CREATE POLICY "Admins can insert banners"
  ON public.banners
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update banners"
  ON public.banners
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete banners"
  ON public.banners
  FOR DELETE
  USING (public.is_admin());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_banners_updated_at ON public.banners;

CREATE TRIGGER trigger_update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_banners_updated_at();

-- Storage policies for banners folder
-- Allow admins to upload/update/delete banner images
DROP POLICY IF EXISTS "media_banners_upload_admin" ON storage.objects;
CREATE POLICY "media_banners_upload_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'banners'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "media_banners_update_admin" ON storage.objects;
CREATE POLICY "media_banners_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'banners'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "media_banners_delete_admin" ON storage.objects;
CREATE POLICY "media_banners_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'banners'
  AND public.is_admin()
);

-- Allow public read access to banners (for mobile app)
DROP POLICY IF EXISTS "media_banners_select_public" ON storage.objects;
CREATE POLICY "media_banners_select_public" ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'banners'
);
