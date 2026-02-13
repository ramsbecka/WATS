# Jinsi ya Ku-setup EAS Build kwa WATS Mobile App

Mwongozo wa jinsi ya ku-setup na ku-build APK kwenye Expo.dev.

---

## 🚀 Quick Start

### Step 1: Login kwa Expo

```bash
cd apps/mobile
npx eas-cli login
```

Ingiza email na password ya Expo account yako (ramsbecka).

### Step 2: Initialize EAS Project

```bash
npx eas-cli init
```

Chagua:
- **Create a new project** (kama hujai-create)
- Au **Link to existing project** (kama tayari una project kwenye Expo.dev)

### Step 3: Build APK

```bash
npx eas-cli build --platform android --profile preview
```

---

## 📱 Build Commands

### Preview Build (APK - kwa testing)

```bash
npx eas-cli build --platform android --profile preview
```

### Development Build (APK - kwa development)

```bash
npx eas-cli build --platform android --profile development
```

### Production Build (AAB - kwa Play Store)

```bash
npx eas-cli build --platform android --profile production
```

---

## 📊 Monitor Build

### Kwenye Expo Dashboard:

1. Nenda https://expo.dev
2. Login na account yako
3. Nenda "Builds" section
4. Angalia build status na download APK baada ya kukamilika

### Kwa Command Line:

```bash
# List builds
npx eas-cli build:list

# View build details
npx eas-cli build:view [build-id]

# Download build
npx eas-cli build:download [build-id]

# Download latest build
npx eas-cli build:download --latest
```

---

## ⚙️ Configuration

### eas.json

File `eas.json` ime-configure na:

- **Preview profile:** APK build kwa testing
- **Development profile:** APK build kwa development
- **Production profile:** AAB build kwa Play Store

### Environment Variables

Environment variables zimewekwa kwenye `eas.json`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 💡 Tips

1. **First Build:** Inaweza kuchukua 15-30 dakika
2. **Subsequent Builds:** Zita-kuwa faster (5-10 dakika)
3. **Notifications:** Expo ita-notify wewe kwa email
4. **Build Limits:** Check Expo pricing kwa build limits

---

## 🐛 Troubleshooting

### "Project not configured"

**Solution:**
```bash
npx eas-cli init
```

### "Not logged in"

**Solution:**
```bash
npx eas-cli login
```

### "Build failed"

**Solution:**
- Check build logs kwenye Expo dashboard
- Verify environment variables
- Check dependencies

---

## 📚 Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev)
- [EAS CLI Reference](https://docs.expo.dev/build/building-on-ci/)

---

**Hitimisho:** Fuata hatua hizi, na APK yako ita-build kwenye Expo.dev! 🎉
