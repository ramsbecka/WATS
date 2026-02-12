-- =============================================================================
-- WATS – Rekebisha RLS policies: kuruhusu anonymous users kusoma products/categories/images
-- =============================================================================

-- Products: public read (anonymous users wanaweza kusoma products active)
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT TO public USING (is_active = true);

-- Categories: public read
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT TO public USING (true);

-- Product images: public read (anonymous users wanaweza kusoma images za products active)
DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
CREATE POLICY "product_images_select" ON public.product_images FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND (p.is_active = true OR public.is_admin()))
);

-- Storage: public read kwa products folder (anonymous users wanaweza kusoma picha za products)
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;
CREATE POLICY "media_select_public" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'products');

-- Storage: admin upload/update/delete kwa products folder
DROP POLICY IF EXISTS "media_upload_admin" ON storage.objects;
CREATE POLICY "media_upload_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'products'
  AND public.is_admin()
);
DROP POLICY IF EXISTS "media_update_admin" ON storage.objects;
CREATE POLICY "media_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'products'
  AND public.is_admin()
);
DROP POLICY IF EXISTS "media_delete_admin" ON storage.objects;
CREATE POLICY "media_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'products'
  AND public.is_admin()
);

-- Storage: Allow users to upload return images
DROP POLICY IF EXISTS "media_returns_upload" ON storage.objects;
CREATE POLICY "media_returns_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'returns'
);
DROP POLICY IF EXISTS "media_returns_select" ON storage.objects;
CREATE POLICY "media_returns_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'returns'
);
