-- =============================================================================
-- WATS – Shipment Tracking System
-- =============================================================================
-- Detailed tracking events kwa kila shipment

-- Shipment tracking events (timeline ya matukio)
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status shipment_status NOT NULL,
  location TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.admin_profile(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON public.shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON public.shipment_tracking_events(created_at DESC);

-- Update shipments table to add estimated_delivery_date
DO $$ BEGIN
  ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Function: Auto-create tracking event when shipment status changes
CREATE OR REPLACE FUNCTION public.handle_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Create tracking event when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.shipment_tracking_events (
      shipment_id,
      status,
      description,
      created_by
    ) VALUES (
      NEW.id,
      NEW.status,
      CASE NEW.status
        WHEN 'pending' THEN 'Order received, preparing for shipment'
        WHEN 'picked' THEN 'Package picked up from warehouse'
        WHEN 'packed' THEN 'Package packed and ready for dispatch'
        WHEN 'in_transit' THEN 'Package in transit to delivery location'
        WHEN 'delivered' THEN 'Package delivered successfully'
        WHEN 'failed' THEN 'Delivery attempt failed'
        ELSE 'Status updated'
      END,
      NULL -- System update
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS shipment_status_change_trigger ON public.shipments;
CREATE TRIGGER shipment_status_change_trigger
AFTER UPDATE OF status ON public.shipments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_shipment_status_change();

-- RLS: Tracking events (public read for their orders, admin all)
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Users can read tracking events for their own orders
DROP POLICY IF EXISTS "tracking_events_select_own" ON public.shipment_tracking_events;
CREATE POLICY "tracking_events_select_own" ON public.shipment_tracking_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_tracking_events.shipment_id
    AND o.user_id = auth.uid()
  )
);

-- Admin can do everything
DROP POLICY IF EXISTS "tracking_events_admin_all" ON public.shipment_tracking_events;
CREATE POLICY "tracking_events_admin_all" ON public.shipment_tracking_events FOR ALL 
USING (public.is_admin());
