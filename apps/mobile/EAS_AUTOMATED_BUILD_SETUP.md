# EAS Automated Build Setup - WATS Mobile

Mwongozo wa jinsi ya ku-setup automated builds kwenye Expo.dev wakati unapush kwenye GitHub.

---

## ✅ Setup (Mara Moja)

### 1. Pata Expo Token

```bash
npm install -g eas-cli
eas login
eas token:create
```

**Copy token** kutoka output.

### 2. Weka GitHub Secret

1. Nenda GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `EXPO_TOKEN`
4. **Value:** Token uliyo-copy kutoka step 1
5. Click **Add secret**

### 3. Weka Supabase Secrets (ikiwa bado haujafanya)

Ongeza secrets zifuatazo:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 🚀 Jinsi Inavyofanya Kazi

### Automated Builds

**Wakati unapush kwenye `main` branch:**

1. **Kwa push ya kawaida** → Build **APK** kwenye Expo.dev (profile: `preview`)
2. **Kwa tag `v*`** (e.g., `v1.0.0`) → Build **AAB** kwenye Expo.dev (profile: `production`)

**Workflow ina-trigger automatically** ikiwa:
- Push kwenye `main` branch
- Mabadiliko yako ni kwenye `apps/mobile/**` au workflow file

### Build Profiles

| Event | Profile | Build Type | Location |
|-------|---------|------------|----------|
| Push to main | `preview` | APK | Expo.dev |
| Tag v* | `production` | AAB | Expo.dev |
| Manual (workflow_dispatch) | Chagua | APK/AAB | Expo.dev |

---

## 📱 Angalia Build Status

### Kwenye Expo.dev

1. Nenda: https://expo.dev/accounts/ramsbecka/projects/wats/builds
2. Angalia build status na download APK/AAB

### Kwenye GitHub Actions

1. Nenda: GitHub → **Actions** tab
2. Click workflow run ya "Build Mobile APK"
3. Angalia logs na build URL

---

## 🔧 Troubleshooting

### "EXPO_TOKEN secret haipo"

**Solution:** Weka `EXPO_TOKEN` kwenye GitHub Secrets (tazama step 2 hapo juu).

### "Build haija-trigger"

**Check:**
- Mabadiliko yako ni kwenye `apps/mobile/**`?
- Push ni kwenye `main` branch?
- Workflow file (`mobile-apk-build.yml`) iko sawa?

### "Build failed kwenye Expo.dev"

**Check:**
- `eas.json` ina env variables sahihi?
- Expo project ID (`cbd61f57-0c51-4355-9d4b-6043c1b92fc0`) iko sawa?
- Angalia build logs kwenye Expo dashboard

---

## 📝 Notes

- **Builds zina-endelea kwenye Expo.dev servers** (si local)
- **APK/AAB zina-download** kutoka Expo dashboard baada ya build
- **Build time:** ~10-20 dakika (kwa sababu ni cloud build)
- **Free tier limits:** Check Expo pricing kwa build limits

---

## 🎯 Next Steps

1. ✅ Weka `EXPO_TOKEN` kwenye GitHub Secrets
2. ✅ Push mabadiliko kwenye `main` branch
3. ✅ Angalia build status kwenye Expo.dev
4. ✅ Download APK/AAB baada ya build kukamilika

---

**Hitimisho:** Baada ya ku-setup `EXPO_TOKEN`, kila push kwenye `main` ita-trigger automated build kwenye Expo.dev! 🚀
