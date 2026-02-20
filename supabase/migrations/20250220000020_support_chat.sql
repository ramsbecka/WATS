-- =============================================================================
-- WATS – Support / Live chat (mobile ↔ admin)
-- =============================================================================

-- Thread: one per customer conversation
CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_threads_user ON public.support_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_support_threads_updated ON public.support_threads(updated_at DESC);

-- Messages in a thread
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread ON public.support_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at);

-- RLS
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so migration is idempotent (safe to re-run)
DROP POLICY IF EXISTS "Users can view own support threads" ON public.support_threads;
DROP POLICY IF EXISTS "Users can insert own support threads" ON public.support_threads;
DROP POLICY IF EXISTS "Users can update own support threads (e.g. close)" ON public.support_threads;
DROP POLICY IF EXISTS "Admins can manage all support threads" ON public.support_threads;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert messages in own threads (as user)" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can insert support messages (as admin)" ON public.support_messages;

-- Customer: own threads only
CREATE POLICY "Users can view own support threads"
  ON public.support_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support threads"
  ON public.support_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support threads (e.g. close)"
  ON public.support_threads FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin: all threads
CREATE POLICY "Admins can manage all support threads"
  ON public.support_threads FOR ALL
  USING (public.is_admin());

-- Customer: messages in own threads
CREATE POLICY "Users can view messages in own threads"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages in own threads (as user)"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'user'
    AND auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );

-- Admin: all messages
CREATE POLICY "Admins can view all support messages"
  ON public.support_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert support messages (as admin)"
  ON public.support_messages FOR INSERT
  WITH CHECK (public.is_admin() AND sender_type = 'admin');

-- Realtime for support_messages (admin and mobile can subscribe).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'support_messages' AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;
END $$;
