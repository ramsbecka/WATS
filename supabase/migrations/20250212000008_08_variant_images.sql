-- =============================================================================
-- WATS – Product Variant Images
-- =============================================================================
-- Picha za kila variant (kwa mfano, rangi tofauti zina picha tofauti)

-- Variant images table
CREATE TABLE IF NOT EXISTS public.variant_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON public.variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_sort ON public.variant_images(variant_id, sort_order);

-- RLS: Variant Images
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;

-- Public can read all variant images
DROP POLICY IF EXISTS "variant_images_select_public" ON public.variant_images;
CREATE POLICY "variant_images_select_public" ON public.variant_images FOR SELECT TO public 
USING (true);

-- Admin can do everything
DROP POLICY IF EXISTS "variant_images_admin_all" ON public.variant_images;
CREATE POLICY "variant_images_admin_all" ON public.variant_images FOR ALL 
USING (public.is_admin());
