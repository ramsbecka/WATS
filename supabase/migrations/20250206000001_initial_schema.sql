-- WATS - Initial Schema
-- Tanzania multi-vendor e-commerce | TZS | Swahili & English
-- Run order: 1

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE app_role AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'initiated', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_provider AS ENUM ('mpesa', 'airtel_money', 'mixx', 'halopesa');
CREATE TYPE shipment_status AS ENUM ('pending', 'picked', 'packed', 'in_transit', 'delivered', 'failed');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'received', 'refunded', 'rejected');
CREATE TYPE bnpl_status AS ENUM ('pending', 'approved', 'active', 'completed', 'defaulted', 'cancelled');

-- =============================================================================
-- PROFILES (extends Supabase auth.users)
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  phone_normalized TEXT GENERATED ALWAYS AS (regexp_replace(phone, '\D', '', 'g')) STORED,
  display_name TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'customer',
  locale TEXT DEFAULT 'sw', -- sw | en
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_phone_normalized ON profiles(phone_normalized);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =============================================================================
-- VENDORS
-- =============================================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_reg_no TEXT,
  contact_phone TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_profile ON vendors(profile_id);
CREATE INDEX idx_vendors_approved ON vendors(is_approved);

-- =============================================================================
-- FULFILLMENT CENTERS
-- =============================================================================
CREATE TABLE fulfillment_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CATEGORIES
-- =============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_sw TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- =============================================================================
-- PRODUCTS
-- =============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
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

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);

-- =============================================================================
-- PRODUCT IMAGES
-- =============================================================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- =============================================================================
-- INVENTORY
-- =============================================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  fulfillment_center_id UUID REFERENCES fulfillment_centers(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, fulfillment_center_id)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_center ON inventory(fulfillment_center_id);

-- =============================================================================
-- CARTS & CART ITEMS
-- =============================================================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- =============================================================================
-- ORDERS & ORDER ITEMS
-- =============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
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

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_tzs DECIMAL(12,2) NOT NULL,
  total_tzs DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order number sequence (e.g. WATS-20250206-00001)
CREATE SEQUENCE order_number_seq START 1;
CREATE OR REPLACE FUNCTION gen_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number = 'WATS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION gen_order_number();

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_id);

-- =============================================================================
-- PAYMENTS
-- =============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider payment_provider NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_tzs DECIMAL(12,2) NOT NULL,
  provider_reference TEXT,
  provider_callback JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_ref ON payments(provider_reference);

-- =============================================================================
-- SHIPMENTS
-- =============================================================================
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status shipment_status NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  carrier TEXT,
  fulfilled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- =============================================================================
-- RETURNS
-- =============================================================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  status return_status NOT NULL DEFAULT 'requested',
  reason TEXT,
  refund_amount_tzs DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_returns_order ON returns(order_id);

-- =============================================================================
-- LOYALTY POINTS
-- =============================================================================
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  source TEXT, -- order_id, referral, promo
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_created ON loyalty_points(created_at DESC);

-- =============================================================================
-- BNPL ORDERS
-- =============================================================================
CREATE TABLE bnpl_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status bnpl_status NOT NULL DEFAULT 'pending',
  installments INT NOT NULL,
  installment_amount_tzs DECIMAL(12,2) NOT NULL,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bnpl_order ON bnpl_orders(order_id);
CREATE INDEX idx_bnpl_user ON bnpl_orders(user_id);

-- =============================================================================
-- LIVESTREAM SESSIONS
-- =============================================================================
CREATE TABLE livestream_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stream_url TEXT,
  thumbnail_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_livestream_vendor ON livestream_sessions(vendor_id);
CREATE INDEX idx_livestream_live ON livestream_sessions(is_live) WHERE is_live = true;

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB, -- deep link, order_id, etc.
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at) WHERE read_at IS NULL;

-- =============================================================================
-- AUDIT LOG (payments, payouts)
-- =============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  payload JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =============================================================================
-- TRIGGERS: updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON vendors;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON fulfillment_centers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fulfillment_centers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON carts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON cart_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON shipments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON returns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON bnpl_orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bnpl_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON livestream_sessions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON livestream_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
