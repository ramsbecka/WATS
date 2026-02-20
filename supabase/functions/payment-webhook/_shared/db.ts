import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

export function getAuthClient(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_ANON_KEY')!;
  const auth = req.headers.get('Authorization');
  return createClient(url, key, {
    global: { headers: auth ? { Authorization: auth } : {} },
  });
}
