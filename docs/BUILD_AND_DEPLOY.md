# WATS - Build and Deploy Guide

Complete guide for building the mobile app APK and deploying the admin dashboard.

---

## ✅ Deploy readiness – can we deploy?

| Part | Build works? | What deploy needs |
|------|----------------|---------------------|
| **Admin (Next.js)** | Yes – `npm run build` works | **Vercel:** set GitHub Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. **Netlify:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`. **GitHub Pages:** does not work with current config (standalone); if you want GH Pages, change `next.config.mjs` to `output: 'export'` and rebuild. |
| **Mobile (Expo)** | Yes – EAS / local build | **EAS (cloud):** set GitHub Secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_TOKEN`. **Local APK/AAB:** `cd apps/mobile` → `npx expo prebuild --platform android --clean` → Gradle build (see below). |
| **Supabase** | Migrations + Edge Functions | `supabase link` → `supabase db push` (migrations); `supabase functions deploy <name>` (functions). Set secrets in Dashboard. |

**Summary:** You can deploy once GitHub Secrets are set for your platform (Vercel/Netlify for admin, EAS for mobile) and Supabase is linked and deployed.

---

## 📱 Mobile App - APK Build

### Method 1: Using GitHub Actions (Automated)

#### Setup

1. **Set GitHub Secrets:**
   - Go to GitHub Repository → Settings → Secrets and variables → Actions
   - Add the following secrets:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   EXPO_TOKEN=your_expo_token_here (optional, for EAS Build)
   ```

2. **How to get Expo Token:**
   ```bash
   npm install -g eas-cli
   eas login
   eas whoami
   # Copy token from Expo dashboard or run:
   eas token:create
   ```

3. **Trigger Build:**
   - Go to GitHub → Actions → "Build Mobile APK"
   - Click "Run workflow"
   - Choose build type (apk, aab, or both)
   - Choose release type (development, preview, or production)
   - Click "Run workflow"

4. **Download APK:**
   - After the build completes, go to the workflow run
   - Download APK from the "Artifacts" section

---

### Method 2: Local Build (Manual)

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

#### Build AAB (for Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### Method 3: EAS Build (Expo Application Services)

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

### Method 1: Deploy to Vercel (Recommended)

#### Setup

1. **Set GitHub Secrets:**
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **How to get Vercel credentials:**
   - Go to https://vercel.com
   - Log in with your GitHub account
   - Go to Settings → Tokens
   - Create a new token
   - Link your project to Vercel
   - Copy Org ID and Project ID from project settings

3. **Automatic Deployment:**
   - Push changes to `main` branch
   - GitHub Actions will deploy automatically

4. **Manual Deployment:**
   - Go to GitHub → Actions → "Deploy Admin Dashboard"
   - Click "Run workflow"
   - Choose environment
   - Click "Run workflow"

---

### Method 2: Deploy to Netlify

#### Setup

1. **Set GitHub Secrets:**
   ```
   NETLIFY_AUTH_TOKEN=your_netlify_token
   NETLIFY_SITE_ID=your_site_id
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **How to get Netlify credentials:**
   - Go to https://app.netlify.com
   - Log in with your GitHub account
   - Go to User settings → Applications → New access token
   - Create a new token
   - Link your site
   - Copy Site ID from site settings

3. **Update Next.js config:**
   ```javascript
   // apps/admin/next.config.js
   module.exports = {
     output: 'export', // For static export
     // or
     // output: 'standalone', // For server-side
   }
   ```

---

### Method 3: Deploy to GitHub Pages

#### Setup

1. **Update Next.js config:**
   ```javascript
   // apps/admin/next.config.js
   module.exports = {
     output: 'export',
     basePath: '/WATS', // If repo name is WATS
     assetPrefix: '/WATS/',
   }
   ```

2. **Build and Deploy:**
   - GitHub Actions will deploy automatically as fallback
   - Or manually:
     ```bash
     cd apps/admin
     npm run build
     # Deploy out/ folder to GitHub Pages
     ```

---

### Method 4: Manual Deployment

#### Build locally

```bash
cd apps/admin
npm install
npm run build
```

#### Deploy to your server

1. **Copy files:**
   ```bash
   # For static export
   scp -r apps/admin/out/* user@server:/var/www/admin/
   
   # For server-side
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

### Before building APK:

- [ ] Environment variables are set
- [ ] app.json is updated (version, package name, etc.)
- [ ] All assets are present (icon.png, splash.png, etc.)
- [ ] All dependencies are installed
- [ ] App is tested locally with expo start

### Before deploying Admin:

- [ ] Environment variables are set
- [ ] Next.js config is updated
- [ ] Build succeeds locally (`npm run build`)
- [ ] GitHub Secrets are set
- [ ] Deployment platform is set up (Vercel/Netlify)

---

## 🐛 Troubleshooting

### APK Build Issues

**Problem: "Gradle build failed"**
- Solution: Ensure Java JDK 17 is installed
- Check: `java -version`

**Problem: "Android SDK not found"**
- Solution: Install Android Studio and set up Android SDK
- Set ANDROID_HOME environment variable

**Problem: "Expo prebuild failed"**
- Solution: Delete `android/` folder and try again
- Run: `npx expo prebuild --platform android --clean`

### Admin Deployment Issues

**Problem: "Build failed on Vercel"**
- Solution: Check build logs in Vercel dashboard
- Verify environment variables are set

**Problem: "404 errors on GitHub Pages"**
- Solution: Update `basePath` in next.config.js
- Verify `output: 'export'` is set

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

## 💡 Tips

1. **APK Size:** Use `--minify` flag to reduce APK size
2. **Build Time:** EAS Build is faster than local build
3. **Testing:** Test APK on a real device before release
4. **Versioning:** Update version in app.json before building
5. **Signing:** Set up keystore for production builds

---

**Summary:** Follow this guide carefully and the APK and admin dashboard will build and deploy successfully.
