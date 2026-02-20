# WATS Mobile – Troubleshooting

## Checkout 404 / "Function not found"

Edge Functions are not deployed. See **docs/DEPLOY_EDGE_FUNCTIONS.md** and deploy `checkout-initiate` and `payment-webhook` from project root.

## Payments / M-Pesa failing

1. **Secrets:** Supabase Dashboard → Settings → Edge Functions → Secrets. Ensure `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV`, `MPESA_CALLBACK_URL` are set.
2. **Callback URL:** Must be `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook` and respond with 200.
3. **Sandbox vs production:** Use `MPESA_ENV=sandbox` for testing. See `docs/MPESA_SETUP.md`.

## Email verification / sign-up

To skip email verification during development:

- Supabase Dashboard → Authentication → Providers → Email: disable "Confirm email".
- App will redirect to the app after sign-up without a "Check your email" step.  
Email field remains required for account recovery.

## Twilio / SMS limits

If using Twilio for OTP and you hit rate limits or errors, check Twilio dashboard for quotas and errors. Reduce test OTP requests or adjust Twilio limits. SMS configuration is in Supabase Auth (or your SMS provider settings).

## Build failures

- **EAS:** Check build logs on expo.dev; ensure `EXPO_TOKEN` is valid in GitHub Secrets.
- **Local:** Ensure JDK 17 and Android SDK are installed; run from `apps/mobile` and use `npx expo prebuild --clean` if native files are out of sync.
