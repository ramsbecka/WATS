-- Enable Realtime for splash_images so mobile receives admin reorder/updates immediately.
-- If this fails with "already member of publication", the table is already enabled; ignore.
ALTER PUBLICATION supabase_realtime ADD TABLE public.splash_images;
