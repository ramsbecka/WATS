# Deploy – mwongozo

## Admin dashboard (Vercel)

- **Deploy inafanywa na workflow moja tu:** **Deploy Admin Dashboard**
- **Jinsi:** GitHub → **Actions** → chagua **"Deploy Admin Dashboard"** → **Run workflow** (au push mabadiliko kwenye `apps/admin/**` na `main`).
- **Usitumie** "Deploy Next.js site to Pages" – workflow hiyo haitakiwi na inasababisha error.

## Kama kwenye Settings unaonaje "Deploy Next.js site to Pages"

1. Nenda **Settings** → **Pages** (Build and deployment).
2. Chagua **Source:** **"Deploy from a branch"** (si "GitHub Actions").  
   - Hivyo GitHub haitaonyesha/kuendesha workflow ya Next.js kwa Pages.
3. Admin inadeploy **kupitia Vercel** tu: tumia **Actions** → **"Deploy Admin Dashboard"** (au push kwenye `main`).

## Muhtasari

| Unachotaka        | Fanya hivi                                      |
|-------------------|--------------------------------------------------|
| Deploy admin      | Actions → **Deploy Admin Dashboard** → Run      |
| Kusimamia Pages  | Settings → Pages → Source = **Deploy from a branch** (au weka Disabled ikiwa unatumia Vercel tu) |
