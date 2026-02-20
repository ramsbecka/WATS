# Deploy Admin to Vercel

If you get **404 NOT_FOUND** after deploying, the cause is usually that the Next.js app lives in **`apps/admin`** (monorepo) but Vercel built from the repo root.

---

## Fix 404: Set Root Directory

1. Open [Vercel Dashboard](https://vercel.com) → your project.
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set to: **`apps/admin`**
5. Save and trigger a **Redeploy** (Deployments → ⋮ on latest → Redeploy).

Vercel will then run `npm install` and `next build` inside `apps/admin`, and the app will serve correctly.

---

## First-time setup

1. **Import project:** [vercel.com/new](https://vercel.com/new) → Import your Git repository (e.g. GitHub).
2. **Root Directory:** set to **`apps/admin`** (see above) before or right after the first deploy.
3. **Environment variables** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Deploy. Every push to `main` will auto-deploy if Git integration is enabled.

---

## Optional: Ignore ESLint `<img>` warnings in build

If the build fails due to `@next/next/no-img-element`, you can relax ESLint during build in `apps/admin/next.config.mjs`:

```js
eslint: { ignoreDuringBuilds: true },
```

Or keep it `false` and replace `<img>` with `next/image` where possible.
