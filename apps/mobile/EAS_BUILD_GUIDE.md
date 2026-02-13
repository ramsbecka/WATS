# Jinsi ya Ku-build APK kwa kutumia Expo.dev (EAS Build)

Mwongozo wa jinsi ya ku-push mradi kwenye Expo.dev na ku-build APK kwa kutumia EAS Build.

---

## 📋 Prerequisites

- ✅ Expo account (create kwa https://expo.dev/signup kama bado huna)
- ✅ Node.js 20+ installed
- ✅ Environment variables zimewekwa kwenye eas.json

---

## 🚀 Hatua kwa Hatua

### Step 1: Login kwa Expo

```bash
cd apps/mobile
npx eas-cli login
```

Ingiza email na password ya Expo account yako.

### Step 2: Configure EAS Build

```bash
npx eas-cli build:configure
```

Hii ita-create/update `eas.json` file na build profiles.

### Step 3: Build APK kwa Expo.dev

#### Option A: Preview Build (APK)

```bash
npx eas-cli build --platform android --profile preview
```

#### Option B: Development Build (APK)

```bash
npx eas-cli build --platform android --profile development
```

#### Option C: Production Build (AAB - kwa Play Store)

```bash
npx eas-cli build --platform android --profile production
```

---

## 📱 Build Process

1. **EAS ita-upload code yako** kwenye Expo servers
2. **Build ita-run** kwenye cloud (hakuna haja ya Android SDK local)
3. **Baada ya build kukamilika**, utapata notification
4. **Download APK** kutoka Expo dashboard au kwa command:

```bash
npx eas-cli build:list
npx eas-cli build:download [build-id]
```

---

## 🔐 Environment Variables

Environment variables zimewekwa kwenye `eas.json`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Zita-apply automatically wakati wa build.

---

## 📊 Monitor Build Status

Unaweza ku-monitor build status kwa:

1. **Expo Dashboard:**
   - Nenda https://expo.dev
   - Login na account yako
   - Nenda "Builds" section
   - Angalia build status

2. **Kwa command line:**
   ```bash
   npx eas-cli build:list
   ```

---

## ⚡ Quick Commands

```bash
# Login
npx eas-cli login

# Build APK (preview)
npx eas-cli build --platform android --profile preview

# List builds
npx eas-cli build:list

# Download latest build
npx eas-cli build:download --latest

# View build details
npx eas-cli build:view [build-id]
```

---

## 🎯 Build Profiles

### Preview Profile
- **Build Type:** APK
- **Distribution:** Internal
- **Use Case:** Testing na sharing kwa watu wachache

### Development Profile
- **Build Type:** APK
- **Distribution:** Internal
- **Use Case:** Development na debugging

### Production Profile
- **Build Type:** AAB
- **Distribution:** Play Store
- **Use Case:** Release kwa Google Play Store

---

## 💡 Tips

1. **First Build:** Inaweza kuchukua muda mrefu (15-30 dakika) kwa sababu ya dependencies
2. **Subsequent Builds:** Zita-kuwa faster kwa sababu ya caching
3. **Build Limits:** Free tier ina build limits - check Expo pricing
4. **Notifications:** Expo ita-notify wewe kwa email wakati build inakamilika

---

## 🐛 Troubleshooting

### Problem: "Not logged in"

**Solution:**
```bash
npx eas-cli login
```

### Problem: "Project not configured"

**Solution:**
```bash
npx eas-cli build:configure
```

### Problem: "Build failed"

**Solution:**
- Check build logs kwenye Expo dashboard
- Verify environment variables zimewekwa sawa
- Check kama dependencies zote zipo kwenye package.json

---

## 📚 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev)
- [EAS CLI Reference](https://docs.expo.dev/build/building-on-ci/)

---

**Hitimisho:** Fuata hatua hizi, na APK yako ita-build kwenye Expo.dev servers! 🚀
