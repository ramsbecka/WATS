# Deploy Edge Functions

Use this guide when you see **404** on `/functions/v1/checkout-initiate` or **"requested function was not found"**. The cause is that Edge Functions are not deployed to Supabase.

## Prerequisites

- Supabase CLI: `npm install -g supabase`
- Run commands from **project root** (`D:\WATS\WATS`), not from `apps/mobile`

## Quick deploy (PowerShell)

```powershell
cd D:\WATS\WATS
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy checkout-initiate
supabase functions deploy payment-webhook
supabase functions deploy payment-retry
supabase functions deploy payment-verify
supabase functions list
```

Replace `YOUR_PROJECT_REF` with your Supabase project ID (from the project URL).

## Steps (first time)

1. **Login:** `supabase login` (opens browser to authorize).
2. **Link project:** `supabase link --project-ref <ref>` from repo root.
3. **Deploy:**  
   `supabase functions deploy checkout-initiate`  
   `supabase functions deploy payment-webhook`  
   `supabase functions deploy payment-retry`  
   `supabase functions deploy payment-verify`
4. **Secrets:** Set M-Pesa and other secrets in Supabase Dashboard → Settings → Edge Functions → Secrets.

## Verify

- Supabase Dashboard → Edge Functions: both functions should be listed.
- Test checkout from the mobile app; the request should no longer return 404.

## M-Pesa / payment errors

After deployment, if payments fail, check:

- Edge Function secrets (consumer key, secret, shortcode, passkey, env, callback URL).
- `docs/MPESA_SETUP.md` and `docs/MPESA_CREDENTIALS_SETUP.md` for credential setup.
