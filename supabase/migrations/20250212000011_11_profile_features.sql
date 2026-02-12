-- =============================================================================
-- WATS – Profile Features: Referral Codes, Addresses, Recently Viewed, Store Followed
-- =============================================================================

-- ----- 1) Referral Codes (Friend's Code / Invite Friend) -----
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  referral_bonus_points INT NOT NULL DEFAULT 100 CHECK (referral_bonus_points >= 0),
  referred_bonus_points INT NOT NULL DEFAULT 50 CHECK (referred_bonus_points >= 0),
  total_referrals INT NOT NULL DEFAULT 0 CHECK (total_referrals >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

-- Referrals tracking (who referred whom)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  referred_bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- A user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    v_code := UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE public.referral_codes.code = v_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for user (if doesn't exist)
CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check if user already has a referral code
  SELECT public.referral_codes.code INTO existing_code
  FROM public.referral_codes
  WHERE public.referral_codes.user_id = p_user_id AND public.referral_codes.is_active = true
  LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := public.generate_referral_code();
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, new_code)
  ON CONFLICT (code) DO NOTHING;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to increment referral count
CREATE OR REPLACE FUNCTION public.increment_referral_count(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.referral_codes
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql;

-- ----- 2) User Addresses (Address Management) -----
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g., "Home", "Work", "Office"
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  ward TEXT,
  street_address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON public.user_addresses(user_id, is_default) WHERE is_default = true;

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other default addresses for this user
    UPDATE public.user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON public.user_addresses;

CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- ----- 3) Recently Viewed Products -----
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON public.recently_viewed(product_id);

-- Function to update or insert recently viewed (upsert)
CREATE OR REPLACE FUNCTION public.upsert_recently_viewed(p_user_id UUID, p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.recently_viewed (user_id, product_id, viewed_at)
  VALUES (p_user_id, p_product_id, now())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET viewed_at = now();
END;
$$ LANGUAGE plpgsql;

-- ----- 4) Store Followed (Follow Vendors) -----
CREATE TABLE IF NOT EXISTS public.store_followed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_store_followed_user ON public.store_followed(user_id);
CREATE INDEX IF NOT EXISTS idx_store_followed_vendor ON public.store_followed(vendor_id);

-- ----- 5) RLS Policies -----

-- Referral Codes: Users can read their own codes, insert their own
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
  DROP POLICY IF EXISTS "Users can insert their own referral codes" ON public.referral_codes;
  DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;
  DROP POLICY IF EXISTS "Anyone can verify referral codes" ON public.referral_codes;
END $$;

CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own referral codes"
  ON public.referral_codes FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Anyone can verify referral codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

-- Referrals: Users can view referrals they made or were referred by
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
  DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
END $$;

CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true); -- Will be handled by backend/function

-- User Addresses: Users can manage their own addresses
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own addresses" ON public.user_addresses;
  DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.user_addresses;
  DROP POLICY IF EXISTS "Users can update their own addresses" ON public.user_addresses;
  DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.user_addresses;
END $$;

CREATE POLICY "Users can view their own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Recently Viewed: Users can manage their own viewing history
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own recently viewed" ON public.recently_viewed;
  DROP POLICY IF EXISTS "Users can insert their own recently viewed" ON public.recently_viewed;
  DROP POLICY IF EXISTS "Users can delete their own recently viewed" ON public.recently_viewed;
END $$;

CREATE POLICY "Users can view their own recently viewed"
  ON public.recently_viewed FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recently viewed"
  ON public.recently_viewed FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recently viewed"
  ON public.recently_viewed FOR DELETE
  USING (auth.uid() = user_id);

-- Store Followed: Users can manage their followed stores
ALTER TABLE public.store_followed ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own followed stores" ON public.store_followed;
  DROP POLICY IF EXISTS "Users can insert their own followed stores" ON public.store_followed;
  DROP POLICY IF EXISTS "Users can delete their own followed stores" ON public.store_followed;
END $$;

CREATE POLICY "Users can view their own followed stores"
  ON public.store_followed FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own followed stores"
  ON public.store_followed FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own followed stores"
  ON public.store_followed FOR DELETE
  USING (auth.uid() = user_id);
