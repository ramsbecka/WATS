-- =============================================================================
-- WATS – Storage policies for categories folder (admin upload/update/delete)
-- =============================================================================

-- Storage: public read kwa categories folder (anonymous users wanaweza kusoma picha za categories)
DROP POLICY IF EXISTS "media_categories_select_public" ON storage.objects;
CREATE POLICY "media_categories_select_public" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'categories');

-- Storage: admin upload kwa categories folder
DROP POLICY IF EXISTS "media_categories_upload_admin" ON storage.objects;
CREATE POLICY "media_categories_upload_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'categories'
  AND public.is_admin()
);

-- Storage: admin update kwa categories folder
DROP POLICY IF EXISTS "media_categories_update_admin" ON storage.objects;
CREATE POLICY "media_categories_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'categories'
  AND public.is_admin()
);

-- Storage: admin delete kwa categories folder
DROP POLICY IF EXISTS "media_categories_delete_admin" ON storage.objects;
CREATE POLICY "media_categories_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'categories'
  AND public.is_admin()
);
