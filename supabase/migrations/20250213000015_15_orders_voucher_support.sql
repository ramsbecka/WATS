-- =============================================================================
-- WATS – Add voucher support to orders
-- =============================================================================

-- Add voucher_id column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_voucher ON public.orders(voucher_id);

-- Function to mark voucher as used after successful payment
CREATE OR REPLACE FUNCTION public.mark_voucher_used()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to 'completed', mark associated voucher as used
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.vouchers
    SET 
      is_used = true,
      used_at = now(),
      usage_count = usage_count + 1,
      updated_at = now()
    WHERE id IN (
      SELECT voucher_id 
      FROM public.orders 
      WHERE id = NEW.order_id AND voucher_id IS NOT NULL
    )
    AND is_used = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to mark voucher as used when payment completes
DROP TRIGGER IF EXISTS trigger_mark_voucher_used ON public.payments;
CREATE TRIGGER trigger_mark_voucher_used
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.mark_voucher_used();
