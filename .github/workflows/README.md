# GitHub Actions

- **admin-deploy.yml** – Deploy admin on push to `main` (paths: `apps/admin/**`). Vercel → Netlify → GitHub Pages. Manual: Actions → "Deploy Admin Dashboard".
- **ci.yml** – On push/PR to `main`/`develop`: build admin, run Edge Functions tests (Deno).

Secrets & setup: `docs/BUILD_AND_DEPLOY.md`.
