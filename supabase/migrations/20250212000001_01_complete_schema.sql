-- =============================================================================
-- WATS – Schema kamili: profile/admin_profile, vendors (nullable), products, orders, RLS, storage, seed
-- Migration moja yenye kila kitu iliyokamilika
-- =============================================================================

-- ----- 1) Extensions -----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----- 2) Types -----
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('customer', 'vendor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'initiated', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('mpesa', 'airtel_money', 'mixx', 'halopesa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('pending', 'picked', 'packed', 'in_transit', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('requested', 'approved', 'received', 'refunded', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE bnpl_status AS ENUM ('pending', 'approved', 'active', 'completed', 'defaulted', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----- 3) Profile (watumiaji wa kawaida: customer tu) -----
CREATE TABLE IF NOT EXISTS public.profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  phone_normalized TEXT GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '\D', '', 'g')) STORED,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'customer' CHECK (role = 'customer'),
  locale TEXT DEFAULT 'sw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_phone_normalized ON public.profile(phone_normalized) WHERE phone_normalized <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_email ON public.profile(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_role ON public.profile(role);

-- ----- 4) Admin profile (wasimamizi) -----
CREATE TABLE IF NOT EXISTS public.admin_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_profile_email ON public.admin_profile(email) WHERE email IS NOT NULL;

-- ----- 5) Vendors (maduka – profile_id nullable, admin anaongeza) -----
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profile(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_reg_no TEXT,
  contact_phone TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendors_profile ON public.vendors(profile_id);
CREATE INDEX IF NOT EXISTS idx_vendors_approved ON public.vendors(is_approved);

-- ----- 6) Fulfillment centers -----
CREATE TABLE IF NOT EXISTS public.fulfillment_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----- 7) Categories -----
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_sw TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);

-- ----- 8) Products -----
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sku TEXT,
  name_sw TEXT NOT NULL,
  name_en TEXT,
  description_sw TEXT,
  description_en TEXT,
  price_tzs DECIMAL(12,2) NOT NULL CHECK (price_tzs >= 0),
  compare_at_price_tzs DECIMAL(12,2),
  cost_tzs DECIMAL(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ----- 9) Product images -----
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ----- 10) Inventory -----
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fulfillment_center_id UUID REFERENCES public.fulfillment_centers(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, fulfillment_center_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_center ON public.inventory(fulfillment_center_id);

-- ----- 11) Carts -----
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);

-- ----- 12) Orders -----
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal_tzs DECIMAL(12,2) NOT NULL,
  shipping_tzs DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_tzs DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_tzs DECIMAL(12,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_tzs DECIMAL(12,2) NOT NULL,
  total_tzs DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE OR REPLACE FUNCTION gen_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = 'WATS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION gen_order_number();
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON public.order_items(vendor_id);

-- ----- 13) Payments -----
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider payment_provider NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_tzs DECIMAL(12,2) NOT NULL,
  provider_reference TEXT,
  provider_callback JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_reference);

-- ----- 14) Shipments -----
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status shipment_status NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  carrier TEXT,
  fulfilled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);

-- ----- 15) Returns -----
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  status return_status NOT NULL DEFAULT 'requested',
  reason TEXT,
  refund_amount_tzs DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);

-- ----- 16) Wishlist -----
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist(product_id);

-- ----- 17) Loyalty points -----
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  source TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_user ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_created ON public.loyalty_points(created_at DESC);

-- ----- 18) BNPL orders -----
CREATE TABLE IF NOT EXISTS public.bnpl_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE RESTRICT,
  status bnpl_status NOT NULL DEFAULT 'pending',
  installments INT NOT NULL,
  installment_amount_tzs DECIMAL(12,2) NOT NULL,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bnpl_order ON public.bnpl_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_bnpl_user ON public.bnpl_orders(user_id);

-- ----- 19) Livestream sessions -----
CREATE TABLE IF NOT EXISTS public.livestream_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stream_url TEXT,
  thumbnail_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_livestream_vendor ON public.livestream_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_livestream_live ON public.livestream_sessions(is_live) WHERE is_live = true;

-- ----- 20) Notifications -----
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read_at) WHERE read_at IS NULL;

-- ----- 21) Audit logs -----
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ----- 22) Updated_at triggers -----
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profile;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profile FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.admin_profile;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.admin_profile FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.vendors;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.fulfillment_centers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.fulfillment_centers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.carts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.cart_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.shipments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.returns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.bnpl_orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bnpl_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.livestream_sessions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.livestream_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----- 23) Helper functions -----
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profile WHERE id = auth.uid()),
    (SELECT 'admin'::app_role FROM public.admin_profile WHERE id = auth.uid() LIMIT 1),
    'customer'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profile WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION public.my_vendor_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NULL::UUID;
$$;

-- ----- 24) RLS: Enable RLS -----
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bnpl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----- 25) RLS: Profile policies -----
DROP POLICY IF EXISTS "profile_select_own" ON public.profile;
CREATE POLICY "profile_select_own" ON public.profile FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "profile_update_own" ON public.profile;
CREATE POLICY "profile_update_own" ON public.profile FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "profile_insert_own" ON public.profile;
CREATE POLICY "profile_insert_own" ON public.profile FOR INSERT WITH CHECK (
  id = auth.uid()
  OR (session_user IS NOT NULL AND session_user NOT IN ('anon', 'authenticated'))
);
DROP POLICY IF EXISTS "profile_admin_all" ON public.profile;
CREATE POLICY "profile_admin_all" ON public.profile FOR ALL USING (public.is_admin());

-- ----- 26) RLS: Admin profile policies -----
DROP POLICY IF EXISTS "admin_profile_select_own_or_admin" ON public.admin_profile;
CREATE POLICY "admin_profile_select_own_or_admin" ON public.admin_profile FOR SELECT
  USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "admin_profile_update_own_or_admin" ON public.admin_profile;
CREATE POLICY "admin_profile_update_own_or_admin" ON public.admin_profile FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "admin_profile_insert_trigger" ON public.admin_profile;
CREATE POLICY "admin_profile_insert_trigger" ON public.admin_profile FOR INSERT
  WITH CHECK (
    id = auth.uid()
    OR (session_user IS NOT NULL AND session_user NOT IN ('anon', 'authenticated'))
  );

-- ----- 27) RLS: Vendors (admin only) -----
DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors FOR ALL USING (public.is_admin());

-- ----- 28) RLS: Fulfillment centers (admin only) -----
DROP POLICY IF EXISTS "fulfillment_select_admin" ON public.fulfillment_centers;
CREATE POLICY "fulfillment_select_admin" ON public.fulfillment_centers FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "fulfillment_all_admin" ON public.fulfillment_centers;
CREATE POLICY "fulfillment_all_admin" ON public.fulfillment_centers FOR ALL USING (public.is_admin());

-- ----- 29) RLS: Categories (public read, admin write) -----
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (public.is_admin());

-- ----- 30) RLS: Products (public read active, admin all) -----
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "products_select_admin" ON public.products;
CREATE POLICY "products_select_admin" ON public.products FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (public.is_admin());

-- ----- 31) RLS: Product images -----
DROP POLICY IF EXISTS "product_images_select" ON public.product_images;
CREATE POLICY "product_images_select" ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND (p.is_active = true OR public.is_admin()))
);
DROP POLICY IF EXISTS "product_images_admin" ON public.product_images;
CREATE POLICY "product_images_admin" ON public.product_images FOR ALL USING (public.is_admin());

-- ----- 32) RLS: Inventory (admin only) -----
DROP POLICY IF EXISTS "inventory_admin_all" ON public.inventory;
CREATE POLICY "inventory_admin_all" ON public.inventory FOR ALL USING (public.is_admin());

-- ----- 33) RLS: Carts -----
DROP POLICY IF EXISTS "carts_own" ON public.carts;
CREATE POLICY "carts_own" ON public.carts FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "cart_items_own" ON public.cart_items;
CREATE POLICY "cart_items_own" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
);

-- ----- 34) RLS: Orders -----
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "order_items_admin" ON public.order_items;
CREATE POLICY "order_items_admin" ON public.order_items FOR ALL USING (public.is_admin());

-- ----- 35) RLS: Payments -----
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (public.is_admin());

-- ----- 36) RLS: Shipments -----
DROP POLICY IF EXISTS "shipments_select_own" ON public.shipments;
CREATE POLICY "shipments_select_own" ON public.shipments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "shipments_admin_all" ON public.shipments;
CREATE POLICY "shipments_admin_all" ON public.shipments FOR ALL USING (public.is_admin());

-- ----- 37) RLS: Returns -----
DROP POLICY IF EXISTS "returns_select_own" ON public.returns;
CREATE POLICY "returns_select_own" ON public.returns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = returns.order_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "returns_insert_own" ON public.returns;
CREATE POLICY "returns_insert_own" ON public.returns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = returns.order_id AND o.user_id = auth.uid())
);
DROP POLICY IF EXISTS "returns_admin_all" ON public.returns;
CREATE POLICY "returns_admin_all" ON public.returns FOR ALL USING (public.is_admin());

-- ----- 38) RLS: Wishlist -----
DROP POLICY IF EXISTS "wishlist_own" ON public.wishlist;
CREATE POLICY "wishlist_own" ON public.wishlist FOR ALL USING (user_id = auth.uid());

-- ----- 39) RLS: Loyalty points -----
DROP POLICY IF EXISTS "loyalty_own" ON public.loyalty_points;
CREATE POLICY "loyalty_own" ON public.loyalty_points FOR ALL USING (user_id = auth.uid());

-- ----- 40) RLS: BNPL orders -----
DROP POLICY IF EXISTS "bnpl_select_own" ON public.bnpl_orders;
CREATE POLICY "bnpl_select_own" ON public.bnpl_orders FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "bnpl_admin_all" ON public.bnpl_orders;
CREATE POLICY "bnpl_admin_all" ON public.bnpl_orders FOR ALL USING (public.is_admin());

-- ----- 41) RLS: Livestream (public live, admin all) -----
DROP POLICY IF EXISTS "livestream_select_public" ON public.livestream_sessions;
CREATE POLICY "livestream_select_public" ON public.livestream_sessions FOR SELECT USING (is_live = true OR public.is_admin());
DROP POLICY IF EXISTS "livestream_admin" ON public.livestream_sessions;
CREATE POLICY "livestream_admin" ON public.livestream_sessions FOR ALL USING (public.is_admin());

-- ----- 42) RLS: Notifications -----
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ----- 43) RLS: Audit logs (admin only) -----
DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_logs;
CREATE POLICY "audit_admin_select" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- ----- 44) Storage buckets -----
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('miamala', 'miamala', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ----- 45) Storage policies: avatars -----
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ----- 46) Storage policies: media -----
DROP POLICY IF EXISTS "media_upload_own" ON storage.objects;
CREATE POLICY "media_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] = 'products' OR (storage.foldername(name))[1] = 'returns')
);
DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] = 'products')
);
DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] = 'products')
);
DROP POLICY IF EXISTS "media_select_authenticated" ON storage.objects;
CREATE POLICY "media_select_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media');

-- ----- 47) Storage policies: miamala -----
DROP POLICY IF EXISTS "miamala_upload_own" ON storage.objects;
CREATE POLICY "miamala_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'miamala' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "miamala_update_own" ON storage.objects;
CREATE POLICY "miamala_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'miamala' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "miamala_delete_own" ON storage.objects;
CREATE POLICY "miamala_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'miamala' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "miamala_select_own" ON storage.objects;
CREATE POLICY "miamala_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'miamala' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ----- 48) handle_new_user trigger -----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_phone TEXT;
  user_email TEXT;
  user_display_name TEXT;
  meta_role TEXT;
BEGIN
  meta_role := NEW.raw_user_meta_data->>'role';
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.phone
  );
  user_email := NEW.email;
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'first_name' || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  IF meta_role = 'admin' THEN
    INSERT INTO public.admin_profile (id, first_name, last_name, email)
    VALUES (
      NEW.id,
      NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
      NULLIF(TRIM(COALESCE(user_email, '')), '')
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(NULLIF(TRIM(EXCLUDED.first_name), ''), admin_profile.first_name),
      last_name = COALESCE(NULLIF(TRIM(EXCLUDED.last_name), ''), admin_profile.last_name),
      email = COALESCE(NULLIF(TRIM(EXCLUDED.email), ''), admin_profile.email),
      updated_at = now();
  ELSE
    BEGIN
      INSERT INTO public.profile (id, phone, email, display_name, avatar_url, role)
      VALUES (
        NEW.id,
        NULLIF(TRIM(COALESCE(user_phone, '')), ''),
        NULLIF(TRIM(COALESCE(user_email, '')), ''),
        NULLIF(TRIM(COALESCE(user_display_name, '')), ''),
        NEW.raw_user_meta_data->>'avatar_url',
        'customer'::app_role
      )
      ON CONFLICT (id) DO UPDATE SET
        phone = COALESCE(NULLIF(TRIM(EXCLUDED.phone), ''), profile.phone),
        email = COALESCE(NULLIF(TRIM(EXCLUDED.email), ''), profile.email),
        display_name = COALESCE(NULLIF(TRIM(EXCLUDED.display_name), ''), profile.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profile.avatar_url),
        role = 'customer'::app_role,
        updated_at = now();
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----- 49) Seed data -----
INSERT INTO public.categories (name_sw, name_en, slug, sort_order, is_active) VALUES
  ('Elektroniki', 'Electronics', 'elektroniki', 1, true),
  ('Mavazi', 'Fashion', 'mavazi', 2, true),
  ('Vyakula', 'Food & Beverages', 'vyakula', 3, true),
  ('Vitu za Nyumbani', 'Home & Living', 'vitu-za-nyumbani', 4, true),
  ('Afya na Uzuri', 'Health & Beauty', 'afya-uzuri', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.fulfillment_centers (name, region, address, is_active)
SELECT 'Dar es Salaam Hub', 'Dar es Salaam', 'Plot 123, Industrial Area', true
WHERE NOT EXISTS (SELECT 1 FROM public.fulfillment_centers LIMIT 1);
