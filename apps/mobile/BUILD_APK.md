# Jinsi ya Ku-unga APK ya WATS Mobile App

Mwongozo wa jinsi ya ku-build Android APK kwa mobile app.

---

## 📋 Requirements

Kabla ya kuanza, hakikisha una:

- ✅ Node.js 20+ installed
- ✅ Java JDK 17 installed
- ✅ Android Studio installed (na Android SDK)
- ✅ Environment variables zimewekwa (.env file)

---

## 🔧 Setup

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Setup Environment Variables

Hakikisha `.env` file ipo na ina:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🚀 Njia ya 1: Local Build (Recommended)

### Step 1: Prebuild Android Project

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
```

Hii ita-create `android/` folder na native Android project.

### Step 2: Build APK

```bash
cd android
./gradlew assembleRelease
```

### Step 3: Find APK File

APK file itakuwa kwenye:
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Kwa Windows (PowerShell):

```powershell
cd android
.\gradlew.bat assembleRelease
```

---

## 🚀 Njia ya 2: Kwa kutumia npm script

Unaweza pia kutumia script ya npm:

```bash
cd apps/mobile
npm run build:android:apk
```

APK file itakuwa kwenye:
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 Njia ya 3: EAS Build (Expo Application Services)

### Setup EAS

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

### Build APK kwa EAS

```bash
# Local build (kwenye machine yako)
eas build --platform android --profile preview --local

# Au cloud build (kwenye Expo servers)
eas build --platform android --profile preview
```

### Download Build

Baada ya build kukamilika:

```bash
eas build:list
eas build:download [build-id]
```

---

## 🚀 Njia ya 4: GitHub Actions (Automated)

Unaweza pia ku-trigger build kwa kutumia GitHub Actions:

1. **Nenda GitHub → Actions**
2. **Chagua "Build Mobile APK"**
3. **Click "Run workflow"**
4. **Chagua options:**
   - Build type: `apk`
   - Release type: `preview` au `development`
5. **Click "Run workflow"**
6. **Download APK** kutoka artifacts baada ya build

---

## 📱 Build AAB (kwa Google Play Store)

Kwa AAB file (kwa Google Play Store):

```bash
cd apps/mobile
npm run build:android:aab
```

AAB file itakuwa kwenye:
```
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔐 Signing APK (kwa Production)

Kwa production APK, unahitaji ku-sign:

### 1. Generate Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore wats-release-key.keystore -alias wats-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Update android/app/build.gradle

Ongeza signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('wats-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'wats-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### 3. Build Signed APK

```bash
cd android
./gradlew assembleRelease
```

---

## 🐛 Troubleshooting

### Problem: "Android SDK not found"

**Solution:**
```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS/Linux
# au
set ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk  # Windows

# Add to PATH
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Problem: "Java not found"

**Solution:**
- Install Java JDK 17
- Set JAVA_HOME environment variable

### Problem: "Gradle build failed"

**Solution:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Problem: "Expo prebuild failed"

**Solution:**
```bash
# Delete android folder na try again
rm -rf android
npx expo prebuild --platform android --clean
```

---

## 📝 Notes

- **APK Size:** Kawaida ni kubwa (50-100MB) kwa sababu ina bundler na dependencies zote
- **Build Time:** Local build inachukua 5-15 dakika kulingana na machine yako
- **Testing:** Test APK kwenye device halisi kabla ya ku-release
- **Version:** Update version kwenye `app.json` kabla ya build

---

## ✅ Checklist

Kabla ya ku-build:

- [ ] Environment variables zimewekwa (.env file)
- [ ] Dependencies zote zime-install (`npm install`)
- [ ] Android SDK ime-install na configured
- [ ] Java JDK 17 ime-install
- [ ] Version imesasishwa kwenye app.json
- [ ] Assets zote zipo (icon.png, splash.png, etc.)

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Build Guide](https://docs.expo.dev/build-reference/android-builds/)

---

**Hitimisho:** Fuata mwongozo huu kwa makini, na APK yako ita-build kwa mafanikio! 🎉
