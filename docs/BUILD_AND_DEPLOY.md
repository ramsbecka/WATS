# WATS - Build na Deploy Guide

Mwongozo kamili wa jinsi ya kutengeneza APK kwa mobile app na kudeploy admin dashboard.

---

## ✅ Deploy readiness – tunaweza kudeploy?

| Sehemu | Build inakwenda? | Deploy inahitaji nini? |
|--------|-------------------|-------------------------|
| **Admin (Next.js)** | Ndiyo – `npm run build` inakwenda | **Vercel:** weka GitHub Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. **Netlify:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`. **GitHub Pages:** haifanyi kazi na config ya sasa (standalone); ikiwa unataka GH Pages, badilisha `next.config.mjs` kuwa `output: 'export'` na jenga tena. |
| **Mobile (Expo)** | Ndiyo – EAS / local build | **EAS (cloud):** weka GitHub Secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_TOKEN`. **Local APK/AAB:** `cd apps/mobile` → `npx expo prebuild --platform android --clean` → Gradle build (tazama chini). |
| **Supabase** | Migrations + Edge Functions | `supabase link` → `supabase db push` (migrations); `supabase functions deploy <name>` (functions). Weka secrets kwenye Dashboard. |

**Hitimisho:** Tunaweza kudeploy ikiwa umeweka GitHub Secrets kwa platform unayotumia (Vercel/Netlify kwa admin, EAS kwa mobile) na Supabase iko linked na deployed.

---

## 📱 Mobile App - APK Build

### Njia ya 1: Kwa kutumia GitHub Actions (Automated)

#### Setup

1. **Weka GitHub Secrets:**
   - Nenda GitHub Repository → Settings → Secrets and variables → Actions
   - Ongeza secrets zifuatazo:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   EXPO_TOKEN=your_expo_token_here (optional, kwa EAS Build)
   ```

2. **Jinsi ya kupata Expo Token:**
   ```bash
   npm install -g eas-cli
   eas login
   eas whoami
   # Copy token kutoka Expo dashboard au kwa command:
   eas token:create
   ```

3. **Trigger Build:**
   - Nenda GitHub → Actions → "Build Mobile APK"
   - Click "Run workflow"
   - Chagua build type (apk, aab, au both)
   - Chagua release type (development, preview, au production)
   - Click "Run workflow"

4. **Download APK:**
   - Baada ya build kukamilika, nenda kwenye workflow run
   - Download APK kutoka "Artifacts" section

---

### Njia ya 2: Local Build (Manual)

#### Requirements

- Node.js 20+
- Java JDK 17
- Android Studio (na Android SDK)
- Expo CLI

#### Steps

1. **Install dependencies:**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   # Create .env file
   echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env
   echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" >> .env
   ```

3. **Prebuild Android project:**
   ```bash
   npx expo prebuild --platform android --clean
   ```

4. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **Find APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

#### Build AAB (kwa Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB file itakuwa:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### Njia ya 3: EAS Build (Expo Application Services)

#### Setup EAS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

4. **Create eas.json (optional):**
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "aab"
         }
       }
     }
   }
   ```

5. **Build APK:**
   ```bash
   eas build --platform android --profile development
   ```

6. **Download build:**
   ```bash
   eas build:list
   eas build:download [build-id]
   ```

---

## 🖥️ Admin Dashboard - Deployment

### Njia ya 1: Deploy kwa Vercel (Recommended)

#### Setup

1. **Weka GitHub Secrets:**
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Jinsi ya kupata Vercel credentials:**
   - Nenda https://vercel.com
   - Login na GitHub account yako
   - Nenda Settings → Tokens
   - Create token mpya
   - Link project yako kwa Vercel
   - Copy Org ID na Project ID kutoka project settings

3. **Automatic Deployment:**
   - Push changes kwa `main` branch
   - GitHub Actions ita-deploy automatically

4. **Manual Deployment:**
   - Nenda GitHub → Actions → "Deploy Admin Dashboard"
   - Click "Run workflow"
   - Chagua environment
   - Click "Run workflow"

---

### Njia ya 2: Deploy kwa Netlify

#### Setup

1. **Weka GitHub Secrets:**
   ```
   NETLIFY_AUTH_TOKEN=your_netlify_token
   NETLIFY_SITE_ID=your_site_id
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Jinsi ya kupata Netlify credentials:**
   - Nenda https://app.netlify.com
   - Login na GitHub account yako
   - Nenda User settings → Applications → New access token
   - Create token mpya
   - Link site yako
   - Copy Site ID kutoka site settings

3. **Update Next.js config:**
   ```javascript
   // apps/admin/next.config.js
   module.exports = {
     output: 'export', // Kwa static export
     // au
     // output: 'standalone', // Kwa server-side
   }
   ```

---

### Njia ya 3: Deploy kwa GitHub Pages

#### Setup

1. **Update Next.js config:**
   ```javascript
   // apps/admin/next.config.js
   module.exports = {
     output: 'export',
     basePath: '/WATS', // Kama repo name ni WATS
     assetPrefix: '/WATS/',
   }
   ```

2. **Build na Deploy:**
   - GitHub Actions ita-deploy automatically kama fallback
   - Au manually:
     ```bash
     cd apps/admin
     npm run build
     # Deploy out/ folder kwa GitHub Pages
     ```

---

### Njia ya 4: Manual Deployment

#### Build locally

```bash
cd apps/admin
npm install
npm run build
```

#### Deploy kwa server yako

1. **Copy files:**
   ```bash
   # Kwa static export
   scp -r apps/admin/out/* user@server:/var/www/admin/
   
   # Kwa server-side
   scp -r apps/admin/.next/* user@server:/var/www/admin/
   ```

2. **Setup Nginx:**
   ```nginx
   server {
       listen 80;
       server_name admin.wats.tz;
       
       root /var/www/admin;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## 🔐 Environment Variables

### Mobile App (.env)

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Admin Dashboard (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 📋 Checklist

### Kabla ya Build APK:

- [ ] Environment variables zimewekwa
- [ ] App.json imesasishwa (version, package name, etc.)
- [ ] Assets zote zipo (icon.png, splash.png, etc.)
- [ ] Dependencies zote zime-install
- [ ] App ina-test locally na expo start

### Kabla ya Deploy Admin:

- [ ] Environment variables zimewekwa
- [ ] Next.js config imesasishwa
- [ ] Build ina-success locally (`npm run build`)
- [ ] GitHub Secrets zimewekwa
- [ ] Deployment platform ime-setup (Vercel/Netlify)

---

## 🐛 Troubleshooting

### APK Build Issues

**Problem: "Gradle build failed"**
- Solution: Hakikisha Java JDK 17 ime-install
- Check: `java -version`

**Problem: "Android SDK not found"**
- Solution: Install Android Studio na setup Android SDK
- Set ANDROID_HOME environment variable

**Problem: "Expo prebuild failed"**
- Solution: Delete `android/` folder na try again
- Run: `npx expo prebuild --platform android --clean`

### Admin Deployment Issues

**Problem: "Build failed on Vercel"**
- Solution: Check build logs kwenye Vercel dashboard
- Verify environment variables zimewekwa

**Problem: "404 errors on GitHub Pages"**
- Solution: Update `basePath` kwenye next.config.js
- Verify `output: 'export'` imewekwa

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

## 💡 Tips

1. **APK Size:** Tumia `--minify` flag kwa kuboresha APK size
2. **Build Time:** EAS Build ni faster kuliko local build
3. **Testing:** Test APK kwenye device halisi kabla ya ku-release
4. **Versioning:** Update version kwenye app.json kabla ya build
5. **Signing:** Setup keystore kwa production builds

---

**Hitimisho:** Fuata mwongozo huu kwa makini, na APK na admin dashboard zita-build na deploy kwa mafanikio!
