# GitHub Actions

- **admin-deploy.yml** – Deploy admin on push to `main` (paths: `apps/admin/**`). Vercel; GH Pages fallback ikiwa `out/` ipo. Manual: Actions → "Deploy Admin Dashboard". **Usiongeze** "Deploy Next.js site to Pages" (nextjs.yml): admin iko kwenye `apps/admin` na `output: 'standalone'`, si static `out/`.
- **mobile-eas-build.yml** – Build mobile APK via EAS. On push to `main` (when `apps/mobile/**` changes) or manual: Actions → "Mobile EAS Build". Needs GitHub Secret `EXPO_TOKEN`. Build runs in Expo cloud; use profile `preview` (APK) or `production` (AAB).
- **ci.yml** – On push/PR to `main`/`develop`: build admin, run Edge Functions tests (Deno).

Secrets & setup: `docs/BUILD_AND_DEPLOY.md`.
