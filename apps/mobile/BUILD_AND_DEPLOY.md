# WATS Mobile – Build & Deploy

## Prerequisites

- Node.js 20+
- Expo account (https://expo.dev)
- For local Android build: JDK 17, Android Studio/SDK  
- For EAS cloud build: no local SDK needed

## Environment

- Copy `.env.example` to `.env` in `apps/mobile`
- Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- For GitHub Actions: add same vars (and optional `EXPO_TOKEN`) in repo Secrets

## Build options

### 1. EAS Build (cloud, recommended)

```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

- **APK** (preview): for testing  
- **AAB** (production): for Play Store  
- Get `EXPO_TOKEN` with `eas token:create` and add to GitHub Secrets for automated builds

### 2. Local Android build

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease   # Windows: .\gradlew.bat assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

### 3. Web deploy

- Build: `npx expo export -p web` (output in `dist/`)
- Deploy `dist/` to Vercel, Netlify, or GitHub Pages
- GitHub Actions can auto-deploy on push to `main` when changes are in `apps/mobile/**`

## Automated builds (GitHub Actions)

- Push to `main` (with changes under `apps/mobile/**`) can trigger APK build
- Tag `v*` can trigger production AAB build
- Requires `EXPO_TOKEN` in repo Secrets for EAS builds

## Docs

- **Edge Functions (checkout/payments):** `docs/DEPLOY_EDGE_FUNCTIONS.md`
- **M-Pesa:** `docs/MPESA_SETUP.md`, `docs/MPESA_CREDENTIALS_SETUP.md`
- **GitHub Pages:** `docs/GITHUB_PAGES_SETUP.md`
