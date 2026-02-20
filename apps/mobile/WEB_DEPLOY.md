# WATS Mobile - Web Deployment Guide

Mwongozo wa jinsi ya ku-deploy mobile app kwenye web.

---

## 📋 Prerequisites

1. **Node.js 20.19+**
2. **Expo CLI** installed
3. **GitHub repository** na Actions enabled

---

## 🔐 Setup Environment Variables

### GitHub Secrets

Nenda GitHub Repository → **Settings** → **Secrets and variables** → **Actions**

Ongeza secrets zifuatazo:

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

**Kwa Vercel (optional):**
- `VERCEL_TOKEN` - Vercel access token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Kwa Netlify (optional):**
- `NETLIFY_AUTH_TOKEN` - Netlify auth token
- `NETLIFY_SITE_ID` - Netlify site ID

---

## 🚀 Deployment Options

### Option 1: Automated GitHub Actions (Recommended)

**Workflow ina-trigger automatically** wakati unapush kwenye `main` branch (ikiwa mabadiliko ni kwenye `apps/mobile/**`).

**Deployment platforms (kwa priority):**

1. **Vercel** (ikiwa secrets zipo)
2. **Netlify** (ikiwa secrets zipo)
3. **GitHub Pages** (fallback)

**Jinsi ya ku-setup:**

1. Weka GitHub Secrets (tazama hapo juu)
2. Push mabadiliko kwenye `main` branch
3. Workflow ita-build na deploy automatically

---

### Option 2: Manual Build & Deploy

#### Build locally:

```bash
cd apps/mobile
npm install
npm run build:web
```

**Output:** `dist/` folder

#### Deploy kwenye Vercel:

```bash
cd apps/mobile
npm install -g vercel
vercel --prod
```

#### Deploy kwenye Netlify:

1. Drag & drop `dist/` folder kwenye Netlify dashboard
2. Au use Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

#### Deploy kwenye GitHub Pages:

1. Upload contents ya `dist/` folder kwenye `gh-pages` branch
2. Au use GitHub Actions (automated)

---

## 📁 Build Output

Baada ya `npm run build:web`, utapata:

```
apps/mobile/dist/
├── index.html
├── _expo/
│   ├── static/
│   └── js/
└── assets/
```

---

## 🌐 Web App Features

- **Sidebar navigation** (tofauti na mobile bottom tabs)
- **Responsive design** (desktop-friendly)
- **Max-width container** (content centered)
- **Grid layouts** (2-4 columns kulingana na screen size)

---

## ✅ Checklist Kabla ya Deploy

- [ ] `.env` file iko sawa (au GitHub Secrets zimewekwa)
- [ ] `app.json` web config iko sawa
- [ ] Dependencies zote zime-install (`npm install`)
- [ ] Build ina-success locally (`npm run build:web`)
- [ ] GitHub Secrets zimewekwa (kwa automated deploy)

---

## 🐛 Troubleshooting

### "Build failed"

**Check:**
- Environment variables zimewekwa?
- Dependencies zime-install?
- Node.js version ni 20.19+?

### "Deployment failed"

**Check:**
- GitHub Secrets ziko sawa?
- Platform credentials (Vercel/Netlify) ziko valid?
- Build output (`dist/`) iko?

### "Web app haifanyi kazi"

**Check:**
- Environment variables zime-set kwenye hosting platform?
- Build output iko complete?
- Browser console kwa errors?

---

## 📚 Resources

- [Expo Web Docs](https://docs.expo.dev/workflow/web/)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Pages Docs](https://docs.github.com/pages)

---

**Hitimisho:** Setup GitHub Secrets na push kwenye `main` - workflow ita-deploy automatically! 🚀
