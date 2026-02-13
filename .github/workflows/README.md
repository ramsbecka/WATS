# GitHub Actions Workflows

Hii ni maelezo ya workflows zote za GitHub Actions kwenye mradi huu.

## 📱 Mobile APK Build Workflow

**File:** `.github/workflows/mobile-apk-build.yml`

### Jinsi ya kutumia:

1. **Automatic (on push to main):**
   - Push code kwa `main` branch
   - Workflow ita-run automatically

2. **Manual trigger:**
   - Nenda GitHub → Actions → "Build Mobile APK"
   - Click "Run workflow"
   - Chagua options:
     - **Build type:** apk, aab, au both
     - **Release type:** development, preview, au production

### Requirements:

- GitHub Secrets:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_TOKEN` (optional, kwa EAS Build)

### Output:

- APK/AAB files zita-upload kama artifacts
- Kwa tags (v*), release ita-create automatically

---

## 🖥️ Admin Dashboard Deployment Workflow

**File:** `.github/workflows/admin-deploy.yml`

### Jinsi ya kutumia:

1. **Automatic (on push to main):**
   - Push changes kwa `main` branch
   - Workflow ita-deploy automatically

2. **Manual trigger:**
   - Nenda GitHub → Actions → "Deploy Admin Dashboard"
   - Click "Run workflow"
   - Chagua environment: production, preview, au staging

### Deployment Platforms:

1. **Vercel** (Priority 1)
   - Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

2. **Netlify** (Priority 2)
   - Requires: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

3. **GitHub Pages** (Fallback)
   - Automatic kama Vercel/Netlify hazipo

### Requirements:

- GitHub Secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Platform-specific secrets (Vercel/Netlify)

---

## 🔧 CI Workflow

**File:** `.github/workflows/ci.yml`

### Jinsi ya kutumia:

- Automatic on push/PR kwa `main` au `develop` branches
- Runs tests na builds kwa admin na mobile apps

---

## 📝 Setup Instructions

Tazama `docs/BUILD_AND_DEPLOY.md` kwa maelezo kamili ya setup.
