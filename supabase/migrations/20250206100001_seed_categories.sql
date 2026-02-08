-- Seed: sample categories for WATS (run after schema + RLS)
INSERT INTO categories (name_sw, name_en, slug, sort_order, is_active) VALUES
  ('Elektroniki', 'Electronics', 'elektroniki', 1, true),
  ('Mavazi', 'Fashion', 'mavazi', 2, true),
  ('Vyakula', 'Food & Beverages', 'vyakula', 3, true),
  ('Vitu za Nyumbani', 'Home & Living', 'vitu-za-nyumbani', 4, true),
  ('Afya na Uzuri', 'Health & Beauty', 'afya-uzuri', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- One fulfillment center for operations (idempotent: only if empty)
INSERT INTO fulfillment_centers (name, region, address, is_active)
SELECT 'Dar es Salaam Hub', 'Dar es Salaam', 'Plot 123, Industrial Area', true
WHERE NOT EXISTS (SELECT 1 FROM fulfillment_centers LIMIT 1);
