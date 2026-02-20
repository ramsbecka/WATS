# GitHub Actions Workflows

This document describes all GitHub Actions workflows in this project.

## 📱 Mobile APK Build Workflow

**File:** `.github/workflows/mobile-apk-build.yml`

### How to use:

1. **Automatic (on push to main):**
   - Push code to `main` branch
   - Workflow runs automatically

2. **Manual trigger:**
   - Go to GitHub → Actions → "Build Mobile APK"
   - Click "Run workflow"
   - Choose options:
     - **Build type:** apk, aab, or both
     - **Release type:** development, preview, or production

### Requirements:

- GitHub Secrets:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_TOKEN` (optional, for EAS Build)

### Output:

- APK/AAB files are uploaded as artifacts
- For tags (v*), a release is created automatically

---

## 🖥️ Admin Dashboard Deployment Workflow

**File:** `.github/workflows/admin-deploy.yml`

### How to use:

1. **Automatic (on push to main):**
   - Push changes to `main` branch
   - Workflow deploys automatically

2. **Manual trigger:**
   - Go to GitHub → Actions → "Deploy Admin Dashboard"
   - Click "Run workflow"
   - Choose environment: production, preview, or staging

### Deployment Platforms:

1. **Vercel** (Priority 1)
   - Requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

2. **Netlify** (Priority 2)
   - Requires: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

3. **GitHub Pages** (Fallback)
   - Automatic if Vercel/Netlify are not configured

### Requirements:

- GitHub Secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Platform-specific secrets (Vercel/Netlify)

---

## 🔧 CI Workflow

**File:** `.github/workflows/ci.yml`

### How to use:

- Automatic on push/PR to `main` or `develop` branches
- Runs tests and builds for admin and mobile apps

---

## 📝 Setup Instructions

See `docs/BUILD_AND_DEPLOY.md` for full setup details.
