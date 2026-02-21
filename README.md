# WATS

Multi-vendor e-commerce platform for Tanzania: customer mobile app, admin dashboard, Supabase backend, mobile-money first (M-Pesa, Airtel Money, Mixx, HaloPesa).

**Logo:** `logo.png` (WATS – bluu na maandishi meupe). **Rangi ya mradi:** bluu ya logo `#0078D4` (primary/accent).

**Kanuni:** Documents kwanza, halafu ujenzi. Maelezo na mjadala yako kwenye `docs/` – soma na kubali spec kabla ya ujenzi.

---

## Documentation (soma kwanza)

Orodha kamili na order ya kusoma: **[docs/00_INDEX.md](docs/00_INDEX.md)**.

- **01_PROJECT_BRIEF.md** – lengo, modeli ya biashara, mahitaji, features  
- **02_ARCHITECTURE.md** – mfumo, auth, payment flow, usalama  
- **03_DATABASE_SPEC.md** – schema design, RLS (kubuni)  
- **04_API_CONTRACT.md** – endpoints, payloads, roles  
- **05_DESIGN_SYSTEM_AND_FIGMA.md** – UI/UX, Figma prompt, tokens  
- **06_DELIVERABLES_AND_ORDER.md** – matoleo na mpangilio wa ujenzi (A→I)  
- **PAYMENT_FLOW.md** – flow kamili ya malipo: Mobile → M-Pesa → payment-webhook → Admin  
- **DATA_FLOW_AND_SECURITY.md** – data flow admin ↔ mobile, usalama, admin leads mobile  
- **DEPLOY_EDGE_FUNCTIONS.md** – deploy checkout-initiate, payment-webhook, payment-retry

---

## Repo structure

```
WATS/
├── supabase/
│   ├── migrations/          # SQL schema + RLS
│   ├── functions/           # Edge Functions (checkout-initiate, payment-webhook, payment-retry, payment-verify)
│   └── config.toml
├── apps/
│   ├── mobile/              # React Native (Expo) – customer app
│   └── admin/               # React + Next.js + Tailwind – admin dashboard
├── docs/
│   ├── API_SPEC.md
│   └── FIGMA_DESIGN_PROMPT.md
└── README.md
```

---

## Local setup

### 1. Supabase

- Install [Supabase CLI](https://supabase.com/docs/guides/cli).
- Login: `supabase login`.
- Link or init: `supabase init` (already done).
- Start local: `supabase start`.
- Run migrations: `supabase db reset` or `supabase migration up`.
- Create a project on [supabase.com](https://supabase.com) and link: `supabase link --project-ref <ref>`.

### 2. Environment variables

**Mobile app** (`apps/mobile/.env` or Expo env):

- `EXPO_PUBLIC_SUPABASE_URL` – Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` – anon/public key

**Admin dashboard** (`apps/admin/.env.local` or `.env`):

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public key  
  Admin uses **Next.js** and **email/password** sign-in (Supabase Auth). Create an admin user in Dashboard and set `profiles.role = 'admin'` for that user.

**Supabase Edge Functions** (set in Dashboard → Settings → Edge Functions or `supabase secrets set`):

- `SUPABASE_URL` – project URL (auto in deployed env)
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (server-only)
- `SUPABASE_ANON_KEY` – anon key
- `MPESA_CONSUMER_KEY` – M-Pesa API consumer key
- `MPESA_CONSUMER_SECRET` – M-Pesa API consumer secret
- `MPESA_SHORTCODE` – paybill / till
- `MPESA_PASSKEY` – STK push passkey
- `MPESA_ENV` – `sandbox` or `production`
- `MPESA_CALLBACK_URL` – URL for payment webhook (e.g. `https://<project>.supabase.co/functions/v1/payment-webhook`)
- `PAYMENT_WEBHOOK_SECRET` – optional; for verifying webhook signature

Never commit service role key or M-Pesa secrets. Use `.env.example` (without values) and document variable names.

### 3. Mobile app (Expo)

**Requirements:**

- **Node.js:** 20.19.x LTS (inayotumika na Expo SDK 54). Kompyuta yako: `node -v` inapaswa kuonyesha v20.19.x. Orodha: `.nvmrc` ina `20.19`.
- **Expo SDK:** 54 (Expo Go 54.x). Use `npx expo start` (CLI from project).
- **Android:** Java 17 (e.g. OpenJDK 17), Android SDK (Android Studio or standalone). Set `ANDROID_HOME` if needed.
- **iOS (mac only):** Xcode, CocoaPods. Simulator or device.

**Windows – "Cannot find module 'crypt'" fix:**  
Expo CLI uses `md5` → `crypt`, and the original `crypt` package is not available on Windows. This repo includes a **crypt shim** so `expo start` works:

- After `npm install`, the `postinstall` script copies a pure-JS shim to `node_modules/md5/node_modules/crypt/`. If you see the error before running install, run once: `node scripts/install-crypt-shim.js` from `apps/mobile`, then `npm start`.

```bash
cd apps/mobile
npm install
npx expo start
```

- Use Expo Go on device or simulator.
- Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (e.g. in `.env` and load with `expo-env` or similar).

### 4. Admin dashboard

```bash
cd apps/admin
npm install
npm run dev
```

- Open http://localhost:3001. Sign in with email/password (create user in Supabase Dashboard; set role to admin in `profiles` table).

### 5. Auth

- **Mobile (customers):** Phone OTP. In Supabase Dashboard → Authentication → Providers → Phone: enable and configure Twilio (or provider). App uses `signInWithOtp({ phone })` and `verifyOtp({ phone, token, type: 'sms' })`.
- **Admin:** Email/password. Create user in Dashboard; set `profiles.role = 'admin'` for that user so RLS allows full access.

---

## Deployment

### Supabase
- **Migrations:** `supabase link --project-ref <ref>` then `supabase db push` (or run SQL in Dashboard).
- **Edge Functions:**  
  `supabase functions deploy checkout-initiate`  
  `supabase functions deploy payment-webhook`  
  `supabase functions deploy payment-retry`  
  `supabase functions deploy payment-verify`  
  `supabase functions deploy vendor-products-bulk-upload`  
  Set secrets in Dashboard or `supabase secrets set KEY value`.  
  Full payment flow: **[docs/PAYMENT_FLOW.md](docs/PAYMENT_FLOW.md)**.

### Admin (Vercel / Netlify)
- **Root Directory:** Set to **`apps/admin`** in Vercel (Settings → General). Otherwise you get 404 NOT_FOUND. See [docs/BUILD_AND_DEPLOY.md](docs/BUILD_AND_DEPLOY.md).
- **Build:** Vercel auto-detects Next.js when root is `apps/admin`; no custom build command needed.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### CI (GitHub Actions)
- `.github/workflows/ci.yml` runs on push/PR to `main` or `develop`: builds admin (Next.js), runs Edge Functions unit tests (Deno).
- **Run Edge Function tests locally:**  
  `deno test --allow-read supabase/functions/_shared/checkout_validation.test.ts`  
  `deno test --allow-read supabase/functions/payment-webhook/parse_webhook.test.ts`

---

## Design & API

- **Figma / design system:** See `docs/FIGMA_DESIGN_PROMPT.md` (tokens, components, mobile + admin screens).
- **API contract:** See `docs/API_SPEC.md` (checkout, webhook, orders, bulk upload, auth, pagination).

---

## Security

- HTTPS only.
- Secrets in env; no card data stored.
- Webhook signature verification for payment callbacks.
- RLS on all tables; least-privilege keys; mask phone in UI; audit logs for payments and payouts.

---

## License

Proprietary – WATS.
