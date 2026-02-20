# GitHub Pages Setup Guide

Mwongozo wa jinsi ya ku-enable na ku-setup GitHub Pages kwenye repository yako.

---

## 🔧 Manual Setup (Kama GitHub Pages haionekani)

### Step 1: Enable GitHub Pages kwenye Settings

1. **Nenda kwenye repository yako kwenye GitHub**
2. **Click "Settings"** (upande wa kulia)
3. **Scroll chini hadi "Pages"** (kwenye sidebar ya kushoto)
4. **Kama "Pages" haionekani:**
   - Repository yako inaweza kuwa private - GitHub Pages inafanya kazi tu kwenye public repositories (au kwa GitHub Pro/Team)
   - Au repository haija-setup correctly

### Step 2: Configure GitHub Pages

1. **Source:** Chagua "Deploy from a branch"
2. **Branch:** Chagua `gh-pages` (au `main` kama unatumia root directory)
3. **Folder:** Chagua `/ (root)` au `/docs` kulingana na structure yako
4. **Click "Save"**

### Step 3: Wait for Workflow to Run

Baada ya ku-enable GitHub Pages:
- GitHub Actions workflow ita-run automatically
- Workflow ita-create `gh-pages` branch
- Baada ya workflow ku-complete, GitHub Pages ita-activate automatically

---

## 🚀 Automated Setup (via GitHub Actions)

Workflow yetu (`mobile-web-deploy.yml`) ina-setup GitHub Pages automatically:

1. **Workflow ina-check** kama Vercel/Netlify secrets zipo
2. **Ikiwa hazipo**, ina-deploy kwenye GitHub Pages automatically
3. **Workflow ina-create** `gh-pages` branch na ku-push files

### Requirements:

- Repository lazima iwe **public** (au GitHub Pro/Team)
- **GitHub Actions** lazima ziwe enabled
- **Workflow permissions** lazima ziwe sawa (contents: write, pages: write)

---

## 🔍 Troubleshooting

### "Pages" haionekani kwenye Settings

**Sababu za kawaida:**

1. **Repository ni private** - GitHub Pages inafanya kazi tu kwenye public repos (au kwa paid plan)
   - **Solution:** Make repository public, au upgrade kwa GitHub Pro

2. **Repository haija-setup** - GitHub haijui kama repository ina-support Pages
   - **Solution:** Run workflow manually kwanza, au create `gh-pages` branch manually

3. **Permissions issues** - User hana permissions za ku-access Settings
   - **Solution:** Ensure una admin access kwenye repository

### Workflow haifanyi kazi

**Check:**
- GitHub Actions zime-enable? (Settings → Actions → General)
- Workflow file iko kwenye `.github/workflows/`?
- Permissions ziko sawa kwenye workflow?

### GitHub Pages haionekani baada ya workflow

**Check:**
- Workflow ime-complete successfully?
- `gh-pages` branch ime-create?
- Files ziko kwenye `gh-pages` branch?

**Manual fix:**
```bash
# Create gh-pages branch manually
git checkout --orphan gh-pages
git rm -rf .
# Copy dist files here
git add .
git commit -m "Initial GitHub Pages deployment"
git push origin gh-pages
```

---

## 📝 Manual GitHub Pages Setup

Ikiwa automated setup haifanyi kazi, unaweza ku-setup manually:

### Option 1: Via GitHub UI

1. Nenda **Settings → Pages**
2. Chagua **"Deploy from a branch"**
3. Chagua branch: **`gh-pages`**
4. Folder: **`/ (root)`**
5. Click **"Save"**

### Option 2: Via Git

```bash
# Create gh-pages branch
git checkout --orphan gh-pages
git rm -rf .

# Copy dist files
cp -r apps/mobile/dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

---

## ✅ Verification

Baada ya ku-setup:

1. **Check workflow status:** Actions tab → Latest workflow run
2. **Check branch:** Branches → `gh-pages` branch
3. **Check Pages:** Settings → Pages → "Your site is live at..."
4. **Visit URL:** `https://[username].github.io/[repo-name]/`

---

## 🔗 Useful Links

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)

---

**Note:** Kwa private repositories, GitHub Pages inahitaji GitHub Pro au Team plan. Kwa public repositories, ni free.
