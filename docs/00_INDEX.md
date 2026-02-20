# WATS – Documentation Index

**Kanuni:** Documents kwanza, halafu ujenzi. Hii ni mjadala na maelezo ya mradi – si code bado.

---

## Order ya kusoma / kujadili

| # | File | Yaliyomo |
|---|------|----------|
| 1 | [01_PROJECT_BRIEF.md](./01_PROJECT_BRIEF.md) | Lengo, modeli ya biashara, mahitaji, features, deliverables |
| 2 | [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) | Mchoro wa mfumo, auth, payment flow, database, security |
| 3 | [03_DATABASE_SPEC.md](./03_DATABASE_SPEC.md) | Tables, relationships, enums, RLS rules, triggers (kubuni) |
| 4 | [04_API_CONTRACT.md](./04_API_CONTRACT.md) | Endpoints, request/response, auth, roles |
| 5 | [05_DESIGN_SYSTEM_AND_FIGMA.md](./05_DESIGN_SYSTEM_AND_FIGMA.md) | UI/UX, rangi, typography, Figma prompt, tokens |
| 6 | [06_DELIVERABLES_AND_ORDER.md](./06_DELIVERABLES_AND_ORDER.md) | Orodha ya matoleo na mpangilio wa ujenzi (A→I) |

---

## Orodha ya kumbukumbu / operesheni

| File | Yaliyomo |
|------|----------|
| [PAYMENT_FLOW.md](./PAYMENT_FLOW.md) | Flow kamili ya malipo: Mobile → checkout-initiate → M-Pesa STK → payment-webhook → Admin |
| [DATA_FLOW_AND_SECURITY.md](./DATA_FLOW_AND_SECURITY.md) | Data flow admin ↔ mobile, usalama, admin leads mobile (realtime) |
| [DEPLOY_EDGE_FUNCTIONS.md](./DEPLOY_EDGE_FUNCTIONS.md) | Deploy checkout-initiate, payment-webhook, payment-retry, payment-verify |

---

## Baada ya kukubaliana na docs

Ujenzi unafuata kwa mpangilio ufuatao: **A** Database → **B** Edge Functions → **C** React Native → **D** Figma/tokens → **E** Admin → **F** API spec final → **G** Tests → **H** Deployment → **I** README.
