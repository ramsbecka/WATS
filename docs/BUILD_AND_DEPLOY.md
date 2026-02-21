# WATS – Build & Deploy (Admin)

## Readiness

| Part | Deploy needs |
|------|----------------|
| **Admin** | GitHub Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` + Vercel/Netlify tokens (see below). |
| **Supabase** | `supabase link` → `supabase db push`; `supabase functions deploy <name>`; set secrets in Dashboard. |

---

## Admin: Vercel (recommended)

- **Root:** Vercel → Settings → General → Root Directory = `apps/admin` (fixes 404).
- **Secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Get token/IDs from vercel.com → project settings.
- Push to `main` auto-deploys; or Actions → "Deploy Admin Dashboard" → Run workflow.

---

## Admin: Netlify

- **Secrets:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `NEXT_PUBLIC_SUPABASE_*`. Get from app.netlify.com.
- For static: set `output: 'export'` in `apps/admin/next.config.mjs`.

---

## Admin: GitHub Pages

- In `next.config.mjs`: `output: 'export'`, `basePath: '/WATS'`, `assetPrefix: '/WATS/'`.
- admin-deploy workflow can use GH Pages as fallback. Or manual: build then push `apps/admin/out/` to `gh-pages`. See `docs/GITHUB_PAGES_SETUP.md`.

---

## Admin: Manual (own server)

```bash
cd apps/admin && npm install && npm run build
# Copy out/ (static) or .next/ to server. Nginx: root → out/ or .next/, try_files $uri $uri/ /index.html.
```

---

## Env

Admin: `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Checklist

- [ ] Env vars & GitHub Secrets set
- [ ] Local build OK: `cd apps/admin && npm run build`
- [ ] Vercel root = `apps/admin` if using Vercel

---

## Troubleshooting

- **404 on Vercel:** Set Root Directory to `apps/admin`, redeploy.
- **Build fail:** Check Vercel/Netlify logs; verify env vars.
- **GH Pages 404:** Set `basePath`/`assetPrefix` in next.config.
