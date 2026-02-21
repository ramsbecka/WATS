# GitHub Actions

**Deploy admin:** tumia **Deploy Admin Dashboard** tu (Actions → "Deploy Admin Dashboard" → Run workflow).

- **admin-deploy.yml** – Deploy admin → Vercel (push `apps/admin/**` au Run workflow).
- **mobile-eas-build.yml** – Build mobile APK (EAS). Secret: `EXPO_TOKEN`.
- **ci.yml** – Build + tests.

**Settings → Pages inaonyesha "Deploy Next.js site to Pages"?** Weka Source = **Deploy from a branch** (si GitHub Actions); admin inadeploy kupitia Vercel na "Deploy Admin Dashboard" tu. Maelezo: `.github/DEPLOY.md`.
