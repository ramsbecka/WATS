# WATS – Deliverables na Order ya kazi

Hii inaeleza **matoleo** yanayotarajiwa na **mpangilio sahihi**: documentation kwanza, halafu ujenzi.

---

## Kanuni: Documents kwanza, halafu ujenzi

1. **Kujadili na kudocuments** – maelezo, mbinu, mkataba (hizi docs).  
2. **Kukubaliana** – stakeholders / team wanakubali spec na order ya kazi.  
3. **Kujenga** – implementation inafuata spec iliyodocuments.

---

## Documentation (imeshaanzishwa)

| Doc | Yaliyomo |
|-----|----------|
| **01_PROJECT_BRIEF.md** | Lengo, modeli ya biashara, mahitaji, features, orodha ya deliverables. |
| **02_ARCHITECTURE.md** | Mchoro wa mfumo, auth, payment flow, database approach, Edge Functions, security, observability. |
| **03_DATABASE_SPEC.md** | Entities, uhusiano, enums, indices, RLS rules, triggers (kubuni tu). |
| **04_API_CONTRACT.md** | Endpoints (checkout, webhook, orders, bulk upload), request/response, auth, roles. |
| **05_DESIGN_SYSTEM_AND_FIGMA.md** | Rangi, typography, spacing, components, Figma prompt, tokens. |
| **06_DELIVERABLES_AND_ORDER.md** | Hii – orodha ya matoleo na mpangilio. |

---

## Order ya ujenzi (baada ya documentation)

**Kwanza:** Documentation (01–06) inakubaliwa.

**Halafu:** Implementation kwa mpangilio ufuatao:

| Kaunti | Kipande | Kile unachofanya |
|--------|--------|--------------------|
| **A** | Database | SQL migrations (schema + indices + FKs + timestamps); RLS policies; trigger (profile on signup, order_number). |
| **B** | Edge Functions | Checkout & payment initiation (validate cart, order, payment, STK Push, idempotency); Payment webhook (signature, update payment/order, notifications, audit). M-Pesa adapter mfano. |
| **C** | React Native (Expo) | Screens: Home, Product list/detail, Cart, Checkout, Payment flow, Orders, Order detail, Profile. API layer, Zustand, UI components, loading/error. |
| **D** | Design | Figma: design system, component library, mobile + admin screens, checkout prototype; tokens for React Native & Tailwind. |
| **E** | Admin dashboard | React + Vite + Tailwind + Shadcn: Dashboard, Products CRUD, Categories, Inventory, Orders, Shipments, Vendors, Payments, Payouts & reports. |
| **F** | API spec (final) | REST endpoints + payloads + auth + pagination + role checks (can be 04_API_CONTRACT.md updated with any changes from implementation). |
| **G** | Tests | Unit (payment flows); integration (order → payment → fulfillment); error tracking (e.g. Sentry). |
| **H** | Deployment | GitHub Actions; Supabase migrations + Edge deploy; Admin → Vercel/Netlify; env vars documentation + .env.example. |
| **I** | README | Local setup, env vars, how to run migrations, apps, and deploy. |

---

## Kwa Cursor / team

- **“Tujadili”** = kujadili na kudocuments (01–06) – **hii imefanywa**.  
- **“Documents kwanza”** = documentation 01–06 ni msingi; hakuna ujenzi unaotakiwa kukwenda mbele ya spec.  
- **“Halafu ndiyo ujenzi”** = ujenzi (A→I) unafuata **baada** ya kukubaliana na docs.

Kama kuna mabadiliko kwenye mahitaji au mbinu, sasisha docs kwanza, halafu implementation.
