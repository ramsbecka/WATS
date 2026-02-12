-- =============================================================================
-- WATS – AI & Analytics Support Tables
-- =============================================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_params JSONB DEFAULT '{}',
  user_id UUID REFERENCES public.profile(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- RLS Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics events
CREATE POLICY analytics_events_insert_own ON public.analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin can view all analytics events
CREATE POLICY analytics_events_admin_all ON public.analytics_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profile WHERE id = auth.uid()
    )
  );
