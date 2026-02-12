-- =============================================================================
-- WATS – Product Variants System
-- =============================================================================
-- Product moja inaweza kuwa na variants (size, rangi, n.k.) na bei tofauti

-- Product variant attributes (e.g., Size, Color, Material)
CREATE TABLE IF NOT EXISTS public.product_variant_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_sw TEXT NOT NULL UNIQUE,
  name_en TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_variant_attributes_sort ON public.product_variant_attributes(sort_order);

-- Product variant attribute options (e.g., Small, Medium, Large for Size)
CREATE TABLE IF NOT EXISTS public.product_variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES public.product_variant_attributes(id) ON DELETE CASCADE,
  value_sw TEXT NOT NULL,
  value_en TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, value_sw)
);
CREATE INDEX IF NOT EXISTS idx_variant_options_attribute ON public.product_variant_options(attribute_id);
CREATE INDEX IF NOT EXISTS idx_variant_options_sort ON public.product_variant_options(sort_order);

-- Product variants (actual variants za product - e.g., Product X, Size: Large, Color: Red)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  price_tzs DECIMAL(12,2) NOT NULL CHECK (price_tzs >= 0),
  compare_at_price_tzs DECIMAL(12,2),
  cost_tzs DECIMAL(12,2),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);

-- Product variant values (link variant na option - e.g., Variant X has Size=Large, Color=Red)
CREATE TABLE IF NOT EXISTS public.product_variant_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.product_variant_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(variant_id, option_id)
);
CREATE INDEX IF NOT EXISTS idx_variant_values_variant ON public.product_variant_values(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_values_option ON public.product_variant_values(option_id);

-- Update cart_items to support variant_id
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_variant ON public.cart_items(variant_id);

-- Update order_items to support variant_id
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

-- RLS: Variant attributes (public read, admin all)
ALTER TABLE public.product_variant_attributes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variant_attributes_select_public" ON public.product_variant_attributes;
CREATE POLICY "variant_attributes_select_public" ON public.product_variant_attributes FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "variant_attributes_admin_all" ON public.product_variant_attributes;
CREATE POLICY "variant_attributes_admin_all" ON public.product_variant_attributes FOR ALL USING (public.is_admin());

-- RLS: Variant options (public read, admin all)
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variant_options_select_public" ON public.product_variant_options;
CREATE POLICY "variant_options_select_public" ON public.product_variant_options FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "variant_options_admin_all" ON public.product_variant_options;
CREATE POLICY "variant_options_admin_all" ON public.product_variant_options FOR ALL USING (public.is_admin());

-- RLS: Product variants (public read active, admin all)
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
CREATE POLICY "product_variants_select_public" ON public.product_variants FOR SELECT TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_variants.product_id 
    AND p.is_active = true
  )
  AND product_variants.is_active = true
);
DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all" ON public.product_variants FOR ALL USING (public.is_admin());

-- RLS: Variant values (public read, admin all)
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variant_values_select_public" ON public.product_variant_values;
CREATE POLICY "variant_values_select_public" ON public.product_variant_values FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "variant_values_admin_all" ON public.product_variant_values;
CREATE POLICY "variant_values_admin_all" ON public.product_variant_values FOR ALL USING (public.is_admin());

-- Seed: Common variant attributes
INSERT INTO public.product_variant_attributes (name_sw, name_en, sort_order) VALUES
  ('Ukubwa', 'Size', 1),
  ('Rangi', 'Color', 2)
ON CONFLICT DO NOTHING;

-- Seed: Common size options
INSERT INTO public.product_variant_options (attribute_id, value_sw, value_en, sort_order)
SELECT 
  (SELECT id FROM public.product_variant_attributes WHERE name_sw = 'Ukubwa'),
  value_sw,
  value_en,
  sort_order
FROM (VALUES
  ('S', 'S', 1),
  ('M', 'M', 2),
  ('L', 'L', 3),
  ('XL', 'XL', 4),
  ('XXL', 'XXL', 5)
) AS v(value_sw, value_en, sort_order)
ON CONFLICT DO NOTHING;

-- Seed: Common color options
INSERT INTO public.product_variant_options (attribute_id, value_sw, value_en, sort_order)
SELECT 
  (SELECT id FROM public.product_variant_attributes WHERE name_sw = 'Rangi'),
  value_sw,
  value_en,
  sort_order
FROM (VALUES
  ('Nyeupe', 'White', 1),
  ('Nyeusi', 'Black', 2),
  ('Nyekundu', 'Red', 3),
  ('Bluu', 'Blue', 4),
  ('Kijani', 'Green', 5),
  ('Njano', 'Yellow', 6),
  ('Zambarau', 'Purple', 7),
  ('Kahawia', 'Brown', 8)
) AS v(value_sw, value_en, sort_order)
ON CONFLICT DO NOTHING;
