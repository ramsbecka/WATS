-- WATS - Allow customers to request a return (insert) for their own orders
CREATE POLICY "returns_insert_own" ON returns FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = returns.order_id AND o.user_id = auth.uid())
);
