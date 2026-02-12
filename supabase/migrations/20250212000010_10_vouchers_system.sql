-- =============================================================================
-- WATS – Vouchers System
-- Auto-generate vouchers for each product purchased, admin-controlled
-- =============================================================================

-- Voucher settings (admin control)
CREATE TABLE IF NOT EXISTS public.voucher_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  min_order_amount_tzs DECIMAL(12,2) DEFAULT 0 CHECK (min_order_amount_tzs >= 0),
  voucher_validity_days INT NOT NULL DEFAULT 30 CHECK (voucher_validity_days > 0),
  max_usage_per_voucher INT DEFAULT 1 CHECK (max_usage_per_voucher > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings (disabled by default)
INSERT INTO public.voucher_settings (id, is_enabled, discount_percentage, min_order_amount_tzs, voucher_validity_days, max_usage_per_voucher)
VALUES (uuid_generate_v4(), false, 5.00, 0, 30, 1)
ON CONFLICT DO NOTHING;

-- Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount_tzs DECIMAL(12,2),
  min_order_amount_tzs DECIMAL(12,2) DEFAULT 0,
  max_discount_amount_tzs DECIMAL(12,2),
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  usage_count INT NOT NULL DEFAULT 0,
  max_usage INT NOT NULL DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_user ON public.vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_order ON public.vouchers(order_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_product ON public.vouchers(product_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_valid ON public.vouchers(valid_until, is_used) WHERE is_used = false;
CREATE INDEX IF NOT EXISTS idx_vouchers_user_valid ON public.vouchers(user_id, valid_until, is_used) WHERE is_used = false;

-- Function to generate unique voucher code
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.vouchers WHERE vouchers.code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate vouchers after order completion
CREATE OR REPLACE FUNCTION public.auto_generate_vouchers()
RETURNS TRIGGER AS $$
DECLARE
  voucher_setting RECORD;
  order_item RECORD;
  voucher_valid_until TIMESTAMPTZ;
  voucher_code TEXT;
BEGIN
  -- Check if voucher system is enabled
  SELECT * INTO voucher_setting FROM public.voucher_settings ORDER BY created_at DESC LIMIT 1;
  
  IF NOT FOUND OR NOT voucher_setting.is_enabled THEN
    RETURN NEW;
  END IF;

  -- Only generate vouchers for delivered orders
  IF NEW.status != 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Calculate validity date
  voucher_valid_until := now() + (voucher_setting.voucher_validity_days || ' days')::INTERVAL;

  -- Generate vouchers for each product in the order
  FOR order_item IN 
    SELECT DISTINCT oi.product_id, oi.order_id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
  LOOP
    -- Generate unique code
    voucher_code := public.generate_voucher_code();
    
    -- Insert voucher
    INSERT INTO public.vouchers (
      user_id,
      order_id,
      product_id,
      code,
      discount_percentage,
      min_order_amount_tzs,
      max_usage,
      valid_from,
      valid_until
    ) VALUES (
      NEW.user_id,
      order_item.order_id,
      order_item.product_id,
      voucher_code,
      voucher_setting.discount_percentage,
      voucher_setting.min_order_amount_tzs,
      voucher_setting.max_usage_per_voucher,
      now(),
      voucher_valid_until
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate vouchers when order status changes to delivered
DROP TRIGGER IF EXISTS trigger_auto_generate_vouchers ON public.orders;
CREATE TRIGGER trigger_auto_generate_vouchers
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered')
  EXECUTE FUNCTION public.auto_generate_vouchers();

-- RLS Policies
ALTER TABLE public.voucher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Admin can manage voucher settings
CREATE POLICY voucher_settings_admin_all ON public.voucher_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profile WHERE id = auth.uid()
    )
  );

-- Users can view their own vouchers
CREATE POLICY vouchers_select_own ON public.vouchers
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own vouchers (for usage tracking)
CREATE POLICY vouchers_update_own ON public.vouchers
  FOR UPDATE
  USING (user_id = auth.uid());

-- Public can verify voucher codes (for checkout)
CREATE POLICY vouchers_select_public ON public.vouchers
  FOR SELECT
  USING (true);

-- Admin can view all vouchers
CREATE POLICY vouchers_admin_all ON public.vouchers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profile WHERE id = auth.uid()
    )
  );
