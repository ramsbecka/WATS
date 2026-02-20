# WATS Mobile - Deployment Guide

Mwongozo wa jinsi ya ku-deploy mobile app.

---

## 📋 Prerequisites

1. **Node.js 20.19+** (check: `node -v`)
2. **Expo account** (create: https://expo.dev/signup)
3. **GitHub repository** na Actions enabled

---

## 🔐 Setup Environment Variables

### Local Development

1. **Copy .env.example to .env:**
   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### GitHub Actions (Automated Builds)

1. **Nenda GitHub Repository → Settings → Secrets and variables → Actions**

2. **Ongeza secrets zifuatazo:**
   - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `EXPO_TOKEN` (optional) - Expo access token kwa EAS Build

3. **Jinsi ya kupata EXPO_TOKEN:**
   ```bash
   npm install -g eas-cli
   eas login
   eas token:create
   # Copy token na uweke kwenye GitHub Secrets
   ```

---

## 🚀 Deployment Options

### Option 1: GitHub Actions (Recommended)

**Automated builds kwa push/tags:**

1. **Weka GitHub Secrets** (tazama hapo juu)

2. **Trigger build:**
   - Nenda GitHub → Actions → "Build Mobile APK"
   - Click "Run workflow"
   - Chagua build type (apk, aab, au both)
   - Chagua release type (development, preview, au production)

3. **Download build:**
   - Baada ya build kukamilika, nenda kwenye workflow run
   - Download kutoka "Artifacts" section

**Note:** Ikiwa `EXPO_TOKEN` haipo, workflow ita-build locally (Gradle) na upload APK/AAB kama artifact.

---

### Option 2: EAS Build (Cloud)

**Build kwenye Expo servers:**

1. **Login to Expo:**
   ```bash
   cd apps/mobile
   npm install -g eas-cli
   eas login
   ```

2. **Build APK (preview):**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Build AAB (production):**
   ```bash
   eas build --platform android --profile production
   ```

4. **Monitor build:**
   - Nenda https://expo.dev
   - Nenda kwenye project yako
   - Angalia build status

5. **Download build:**
   ```bash
   eas build:list
   eas build:download [build-id]
   ```

**Note:** Env variables ziko kwenye `eas.json` - zita-apply automatically wakati wa build.

---

### Option 3: Local Build (Manual)

**Build kwenye machine yako:**

1. **Install dependencies:**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Setup .env file** (tazama hapo juu)

3. **Prebuild Android project:**
   ```bash
   npx expo prebuild --platform android --clean
   ```

4. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   # APK: android/app/build/outputs/apk/release/app-release.apk
   ```

5. **Build AAB (kwa Play Store):**
   ```bash
   ./gradlew bundleRelease
   # AAB: android/app/build/outputs/bundle/release/app-release.aab
   ```

**Requirements:**
- Java JDK 17
- Android Studio (na Android SDK)
- Set `ANDROID_HOME` environment variable

---

## 🌐 Web Deployment

**Deploy kwenye web:**

1. **Build static web:**
   ```bash
   cd apps/mobile
   npx expo export --platform web
   ```

2. **Output:** `dist/` folder

3. **Deploy kwenye hosting yoyote:**
   - Vercel: `vercel deploy dist`
   - Netlify: Drag & drop `dist/` folder
   - GitHub Pages: Upload `dist/` contents
   - Static hosting yoyote

**Note:** Web app ina sidebar navigation (tofauti na mobile bottom tabs).

---

## ✅ Checklist Kabla ya Deploy

- [ ] `.env` file iko sawa (au GitHub Secrets zimewekwa)
- [ ] `eas.json` ina env variables sahihi (kwa EAS builds)
- [ ] `app.json` version imesasishwa
- [ ] Assets zote zipo (icon, splash screen)
- [ ] Dependencies zote zime-install (`npm install`)
- [ ] App ina-test locally (`npm start`)

---

## 🐛 Troubleshooting

### "Environment variables not found"
- Hakikisha `.env` file iko kwenye `apps/mobile/`
- Kwa GitHub Actions, weka secrets kwenye repository settings

### "EAS build failed"
- Check build logs kwenye Expo dashboard
- Hakikisha `EXPO_TOKEN` ni valid
- Verify `eas.json` env variables ziko sawa

### "Gradle build failed"
- Hakikisha Java JDK 17 ime-install
- Check Android SDK setup
- Run: `npx expo prebuild --platform android --clean`

### "APK not found after build"
- Check `android/app/build/outputs/apk/release/`
- Kwa GitHub Actions, check artifacts section

---

## 📚 Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Hitimisho:** Chagua njia unayopenda (GitHub Actions, EAS, au Local) na fuata mwongozo hapo juu! 🚀
