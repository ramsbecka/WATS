-- =============================================================================
-- WATS – Fix RLS policies: add WITH CHECK clause for INSERT operations
-- =============================================================================
-- Tatizo: Policies za FOR ALL zina USING tu, lakini INSERT inahitaji WITH CHECK
-- Solution: Ongeza WITH CHECK clause kwa policies zote za admin FOR ALL

-- Categories admin policy
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Vendors admin policy
DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Fulfillment centers admin policy
DROP POLICY IF EXISTS "fulfillment_all_admin" ON public.fulfillment_centers;
CREATE POLICY "fulfillment_all_admin" ON public.fulfillment_centers 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Products admin policy
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product images admin policy
DROP POLICY IF EXISTS "product_images_admin" ON public.product_images;
CREATE POLICY "product_images_admin" ON public.product_images 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Inventory admin policy
DROP POLICY IF EXISTS "inventory_admin_all" ON public.inventory;
CREATE POLICY "inventory_admin_all" ON public.inventory 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders admin policy
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Order items admin policy
DROP POLICY IF EXISTS "order_items_admin" ON public.order_items;
CREATE POLICY "order_items_admin" ON public.order_items 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payments admin policy
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Shipments admin policy
DROP POLICY IF EXISTS "shipments_admin_all" ON public.shipments;
CREATE POLICY "shipments_admin_all" ON public.shipments 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Returns admin policy
DROP POLICY IF EXISTS "returns_admin_all" ON public.returns;
CREATE POLICY "returns_admin_all" ON public.returns 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- BNPL orders admin policy
DROP POLICY IF EXISTS "bnpl_admin_all" ON public.bnpl_orders;
CREATE POLICY "bnpl_admin_all" ON public.bnpl_orders 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Livestream sessions admin policy
DROP POLICY IF EXISTS "livestream_admin" ON public.livestream_sessions;
CREATE POLICY "livestream_admin" ON public.livestream_sessions 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product variant attributes admin policy
DROP POLICY IF EXISTS "variant_attributes_admin_all" ON public.product_variant_attributes;
CREATE POLICY "variant_attributes_admin_all" ON public.product_variant_attributes 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product variant options admin policy
DROP POLICY IF EXISTS "variant_options_admin_all" ON public.product_variant_options;
CREATE POLICY "variant_options_admin_all" ON public.product_variant_options 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product variants admin policy
DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all" ON public.product_variants 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Variant values admin policy
DROP POLICY IF EXISTS "variant_values_admin_all" ON public.product_variant_values;
CREATE POLICY "variant_values_admin_all" ON public.product_variant_values 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Profile admin policy (if needed for admin operations)
DROP POLICY IF EXISTS "profile_admin_all" ON public.profile;
CREATE POLICY "profile_admin_all" ON public.profile 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
