-- =============================================================================
-- WATS – Product Features (Maelezo ya bidhaa na picha/video)
-- =============================================================================

-- ----- 1) Product Features Table -----
CREATE TABLE IF NOT EXISTS public.product_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title_sw TEXT,
  title_en TEXT,
  description_sw TEXT,
  description_en TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON public.product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_sort ON public.product_features(product_id, sort_order);

-- ----- 2) RLS: Product Features -----
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;

-- Public can read all product features
DROP POLICY IF EXISTS "product_features_select_public" ON public.product_features;
CREATE POLICY "product_features_select_public" ON public.product_features FOR SELECT TO public 
USING (true);

-- Admin can do everything
DROP POLICY IF EXISTS "product_features_admin_all" ON public.product_features;
CREATE POLICY "product_features_admin_all" ON public.product_features FOR ALL 
USING (public.is_admin());

-- ----- 3) Trigger: Update updated_at -----
DROP TRIGGER IF EXISTS set_product_features_updated_at ON public.product_features;
CREATE TRIGGER set_product_features_updated_at 
BEFORE UPDATE ON public.product_features 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();
