-- Create profile on signup (phone from raw_user_meta_data or phone claim)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_phone TEXT;
BEGIN
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.phone
  );
  INSERT INTO public.profiles (id, phone, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(user_phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
