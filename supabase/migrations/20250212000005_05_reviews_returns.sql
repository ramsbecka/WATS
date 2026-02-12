-- =============================================================================
-- WATS – Product Reviews/Ratings & Returns with Comments/Images
-- =============================================================================

-- ----- 1) Product Reviews/Ratings -----
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON public.product_reviews(created_at DESC);

-- Review images
CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_images_review ON public.review_images(review_id);

-- ----- 2) Return Comments & Images -----
-- Update returns table to add comment field (if not exists)
DO $$ BEGIN
  ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS comment TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Return images
CREATE TABLE IF NOT EXISTS public.return_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_return_images_return ON public.return_images(return_id);

-- ----- 3) RLS: Product Reviews -----
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
DROP POLICY IF EXISTS "product_reviews_select_public" ON public.product_reviews;
CREATE POLICY "product_reviews_select_public" ON public.product_reviews FOR SELECT TO public 
USING (is_approved = true);

-- Users can read their own reviews
DROP POLICY IF EXISTS "product_reviews_select_own" ON public.product_reviews;
CREATE POLICY "product_reviews_select_own" ON public.product_reviews FOR SELECT 
USING (user_id = auth.uid());

-- Users can insert their own reviews
DROP POLICY IF EXISTS "product_reviews_insert_own" ON public.product_reviews;
CREATE POLICY "product_reviews_insert_own" ON public.product_reviews FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
DROP POLICY IF EXISTS "product_reviews_update_own" ON public.product_reviews;
CREATE POLICY "product_reviews_update_own" ON public.product_reviews FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can do everything
DROP POLICY IF EXISTS "product_reviews_admin_all" ON public.product_reviews;
CREATE POLICY "product_reviews_admin_all" ON public.product_reviews FOR ALL 
USING (public.is_admin());

-- ----- 4) RLS: Review Images -----
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Public can read images for approved reviews
DROP POLICY IF EXISTS "review_images_select_public" ON public.review_images;
CREATE POLICY "review_images_select_public" ON public.review_images FOR SELECT TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.product_reviews pr 
    WHERE pr.id = review_images.review_id 
    AND pr.is_approved = true
  )
);

-- Users can manage images for their own reviews
DROP POLICY IF EXISTS "review_images_own" ON public.review_images;
CREATE POLICY "review_images_own" ON public.review_images FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.product_reviews pr 
    WHERE pr.id = review_images.review_id 
    AND pr.user_id = auth.uid()
  )
);

-- Admin can do everything
DROP POLICY IF EXISTS "review_images_admin_all" ON public.review_images;
CREATE POLICY "review_images_admin_all" ON public.review_images FOR ALL 
USING (public.is_admin());

-- ----- 5) RLS: Return Images -----
ALTER TABLE public.return_images ENABLE ROW LEVEL SECURITY;

-- Users can read images for their own returns
DROP POLICY IF EXISTS "return_images_select_own" ON public.return_images;
CREATE POLICY "return_images_select_own" ON public.return_images FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.returns r
    JOIN public.orders o ON o.id = r.order_id
    WHERE r.id = return_images.return_id 
    AND o.user_id = auth.uid()
  )
);

-- Users can insert images for their own returns
DROP POLICY IF EXISTS "return_images_insert_own" ON public.return_images;
CREATE POLICY "return_images_insert_own" ON public.return_images FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.returns r
    JOIN public.orders o ON o.id = r.order_id
    WHERE r.id = return_images.return_id 
    AND o.user_id = auth.uid()
  )
);

-- Admin can do everything
DROP POLICY IF EXISTS "return_images_admin_all" ON public.return_images;
CREATE POLICY "return_images_admin_all" ON public.return_images FOR ALL 
USING (public.is_admin());

-- ----- 6) Function: Calculate average rating for product -----
CREATE OR REPLACE FUNCTION public.get_product_rating(product_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00)::DECIMAL(3,2) as average_rating,
    COUNT(*)::INT as total_reviews
  FROM public.product_reviews
  WHERE product_id = product_uuid
  AND is_approved = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- 7) Trigger: Update updated_at for reviews -----
DROP TRIGGER IF EXISTS set_review_updated_at ON public.product_reviews;
CREATE TRIGGER set_review_updated_at 
BEFORE UPDATE ON public.product_reviews 
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();
