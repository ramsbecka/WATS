-- =============================================================================
-- WATS – Ensure public read policies have TO public clause for anonymous users
-- =============================================================================
-- Tatizo: Baadhi ya policies hazina TO public, hivyo anonymous users hawawezi kusoma
-- Solution: Hakikisha policies zote za public read zina TO public

-- Categories: public read (ensure TO public)
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories 
  FOR SELECT 
  TO public 
  USING (true);

-- Products: public read active products (ensure TO public)
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products 
  FOR SELECT 
  TO public 
  USING (is_active = true);

-- Product images: public read (ensure TO public)
DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
CREATE POLICY "product_images_select" ON public.product_images 
  FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_images.product_id 
      AND (p.is_active = true OR public.is_admin())
    )
  );

-- Product variants: public read (ensure TO public)
DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
CREATE POLICY "product_variants_select_public" ON public.product_variants 
  FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_variants.product_id 
      AND (p.is_active = true OR public.is_admin())
    )
  );

-- Variant attributes: public read (ensure TO public)
DROP POLICY IF EXISTS "variant_attributes_select_public" ON public.product_variant_attributes;
CREATE POLICY "variant_attributes_select_public" ON public.product_variant_attributes 
  FOR SELECT 
  TO public 
  USING (true);

-- Variant options: public read (ensure TO public)
DROP POLICY IF EXISTS "variant_options_select_public" ON public.product_variant_options;
CREATE POLICY "variant_options_select_public" ON public.product_variant_options 
  FOR SELECT 
  TO public 
  USING (true);

-- Variant values: public read (ensure TO public)
DROP POLICY IF EXISTS "variant_values_select_public" ON public.product_variant_values;
CREATE POLICY "variant_values_select_public" ON public.product_variant_values 
  FOR SELECT 
  TO public 
  USING (true);

-- Variant images: public read (ensure TO public)
DROP POLICY IF EXISTS "variant_images_select_public" ON public.variant_images;
CREATE POLICY "variant_images_select_public" ON public.variant_images 
  FOR SELECT 
  TO public 
  USING (true);

-- Product features: public read (ensure TO public)
DROP POLICY IF EXISTS "product_features_select_public" ON public.product_features;
CREATE POLICY "product_features_select_public" ON public.product_features 
  FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_features.product_id 
      AND (p.is_active = true OR public.is_admin())
    )
  );

-- Product reviews: public read (ensure TO public)
DROP POLICY IF EXISTS "product_reviews_select_public" ON public.product_reviews;
CREATE POLICY "product_reviews_select_public" ON public.product_reviews 
  FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_reviews.product_id 
      AND (p.is_active = true OR public.is_admin())
    )
  );

-- Review images: public read (ensure TO public)
DROP POLICY IF EXISTS "review_images_select_public" ON public.review_images;
CREATE POLICY "review_images_select_public" ON public.review_images 
  FOR SELECT 
  TO public 
  USING (true);

-- Banners: public read (ensure TO public if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'banners') THEN
    DROP POLICY IF EXISTS "banners_select_public" ON public.banners;
    CREATE POLICY "banners_select_public" ON public.banners 
      FOR SELECT 
      TO public 
      USING (is_active = true);
  END IF;
END $$;

-- Storage: Ensure public read for all media folders
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;
CREATE POLICY "media_select_public" ON storage.objects 
  FOR SELECT 
  TO public 
  USING (
    bucket_id = 'media' 
    AND (
      (storage.foldername(name))[1] = 'products'
      OR (storage.foldername(name))[1] = 'categories'
      OR (storage.foldername(name))[1] = 'banners'
      OR (storage.foldername(name))[1] = 'splash'
    )
  );
