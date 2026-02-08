-- WATS - Row Level Security (RLS)
-- Users see only their data; vendors their products/reports; admins all.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE bnpl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: current user's profile id
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS app_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_vendor()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'vendor' OR EXISTS (SELECT 1 FROM vendors WHERE profile_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.my_vendor_id()
RETURNS UUID AS $$
  SELECT id FROM vendors WHERE profile_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- PROFILES: own row only (read/update)
-- =============================================================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (auth.is_admin());

-- =============================================================================
-- VENDORS: own row; admins all
-- =============================================================================
CREATE POLICY "vendors_select_own" ON vendors FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "vendors_update_own" ON vendors FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "vendors_insert_own" ON vendors FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "vendors_admin_all" ON vendors FOR ALL USING (auth.is_admin());

-- =============================================================================
-- FULFILLMENT_CENTERS: admins + vendors (read for operations)
-- =============================================================================
CREATE POLICY "fulfillment_select_admin" ON fulfillment_centers FOR SELECT USING (auth.is_admin());
CREATE POLICY "fulfillment_select_vendor" ON fulfillment_centers FOR SELECT USING (auth.is_vendor());
CREATE POLICY "fulfillment_all_admin" ON fulfillment_centers FOR ALL USING (auth.is_admin());

-- =============================================================================
-- CATEGORIES: public read; admin write
-- =============================================================================
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (auth.is_admin());

-- =============================================================================
-- PRODUCTS: vendor own; admin all; customers read active
-- =============================================================================
CREATE POLICY "products_select_public" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_select_vendor" ON products FOR SELECT USING (vendor_id = auth.my_vendor_id());
CREATE POLICY "products_select_admin" ON products FOR SELECT USING (auth.is_admin());
CREATE POLICY "products_insert_vendor" ON products FOR INSERT WITH CHECK (vendor_id = auth.my_vendor_id());
CREATE POLICY "products_update_vendor" ON products FOR UPDATE USING (vendor_id = auth.my_vendor_id());
CREATE POLICY "products_delete_vendor" ON products FOR DELETE USING (vendor_id = auth.my_vendor_id());
CREATE POLICY "products_admin_all" ON products FOR ALL USING (auth.is_admin());

-- =============================================================================
-- PRODUCT_IMAGES: same as products (via product ownership)
-- =============================================================================
CREATE POLICY "product_images_select" ON product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND (p.is_active = true OR p.vendor_id = auth.my_vendor_id() OR auth.is_admin()))
);
CREATE POLICY "product_images_vendor" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND p.vendor_id = auth.my_vendor_id())
);
CREATE POLICY "product_images_admin" ON product_images FOR ALL USING (auth.is_admin());

-- =============================================================================
-- INVENTORY: vendor read own products; admin all
-- =============================================================================
CREATE POLICY "inventory_select_vendor" ON inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM products p WHERE p.id = inventory.product_id AND p.vendor_id = auth.my_vendor_id())
);
CREATE POLICY "inventory_admin_all" ON inventory FOR ALL USING (auth.is_admin());

-- =============================================================================
-- CARTS: own cart only
-- =============================================================================
CREATE POLICY "carts_own" ON carts FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- CART_ITEMS: via cart ownership
-- =============================================================================
CREATE POLICY "cart_items_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
);

-- =============================================================================
-- ORDERS: owner or admin
-- =============================================================================
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (auth.is_admin());

-- =============================================================================
-- ORDER_ITEMS: via order visibility
-- =============================================================================
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR auth.is_admin()))
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR auth.is_admin()))
);
CREATE POLICY "order_items_admin" ON order_items FOR ALL USING (auth.is_admin());

-- =============================================================================
-- PAYMENTS: owner (via order) or admin only
-- =============================================================================
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (auth.is_admin());
-- Insert/Update from service role (Edge Functions) - no policy blocks service role

-- =============================================================================
-- SHIPMENTS: via order
-- =============================================================================
CREATE POLICY "shipments_select_own" ON shipments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "shipments_admin_all" ON shipments FOR ALL USING (auth.is_admin());

-- =============================================================================
-- RETURNS: via order
-- =============================================================================
CREATE POLICY "returns_select_own" ON returns FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = returns.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "returns_admin_all" ON returns FOR ALL USING (auth.is_admin());

-- =============================================================================
-- LOYALTY_POINTS: own only
-- =============================================================================
CREATE POLICY "loyalty_own" ON loyalty_points FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- BNPL_ORDERS: own or admin
-- =============================================================================
CREATE POLICY "bnpl_select_own" ON bnpl_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bnpl_admin_all" ON bnpl_orders FOR ALL USING (auth.is_admin());

-- =============================================================================
-- LIVESTREAM_SESSIONS: vendor own; public read when live
-- =============================================================================
CREATE POLICY "livestream_select_public" ON livestream_sessions FOR SELECT USING (is_live = true OR vendor_id = auth.my_vendor_id() OR auth.is_admin());
CREATE POLICY "livestream_vendor" ON livestream_sessions FOR ALL USING (vendor_id = auth.my_vendor_id());
CREATE POLICY "livestream_admin" ON livestream_sessions FOR ALL USING (auth.is_admin());

-- =============================================================================
-- NOTIFICATIONS: own only
-- =============================================================================
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- AUDIT_LOGS: admin read only (writes via service role)
-- =============================================================================
CREATE POLICY "audit_admin_select" ON audit_logs FOR SELECT USING (auth.is_admin());
