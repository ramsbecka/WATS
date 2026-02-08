-- Wishlist: user saves products for later
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_product ON wishlist(product_id);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_own" ON wishlist FOR ALL USING (user_id = auth.uid());
