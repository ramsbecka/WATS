# Figma UI/UX Prompt – WATS

Use this prompt in Figma (with AI or for handoff) to design a **premium Korean-inspired e-commerce UI** for WATS (Tanzania market).

---

## Logo & brand color

- **Logo:** WATS – circular blue with white “WATS” + three dots (`logo.png` at project root).
- **Project primary color:** Logo blue **`#0078D4`** (primary/accent everywhere). Darker variant **`#0067C1`** for hover/pressed.
- **On primary:** White **`#FFFFFF`** for text and icons (as on the logo).

---

## Design direction

- **Style:** Minimal, calm, trustworthy.
- **Inspiration:** Korean e-commerce (Coupang, Olive Young): clean layouts, soft neutrals, generous whitespace, rounded corners, subtle shadows.
- **Market:** Tanzania – Swahili & English, TZS, mobile-first, trust and clarity over decoration.

---

## Design system

### Colors (from WATS logo)
- **Primary / accent:** `#0078D4` (logo blue – project color)
- **Primary dark:** `#0067C1` (hover/pressed)
- **Background:** `#F5F0E8` (warm off-white)
- **Surface / cards:** `#FFFFFF`
- **Secondary / borders:** `#E8E4DC` (light beige)
- **Text primary:** `#1A1A1A`
- **Text secondary:** `#6B6B6B`
- **On primary (text/icons):** `#FFFFFF`
- **Error:** `#C45C5C`
- **Success:** `#4A7C6B`

### Typography
- **Font family:** Inter or Pretendard-style (clean, readable).
- **Headings:** 24–28px, weight 700.
- **Body:** 15–16px, weight 400.
- **Small / captions:** 12–14px, weight 500.
- **Line height:** 1.4–1.5 for body.

### Spacing & layout
- **Border radius:** 12–16px (cards, buttons, inputs).
- **Padding (cards/sections):** 16–24px.
- **Whitespace:** Generous; avoid dense blocks.
- **Grid:** 8px base; 16, 24, 32, 48 for sections.

### Components
- Buttons: 12px radius, 14px vertical padding, 24px horizontal.
- Inputs: 12px radius, 14px padding, 1px border `#E8E4DC`.
- Cards: 16px radius, subtle shadow (e.g. 0 2px 8px rgba(0, 120, 212, 0.08)).

### Motion
- **Micro-interactions:** 200–300ms ease for hover/active.
- **Page transitions:** 250ms ease-out.
- **Loading:** Skeleton or minimal spinner in primary color.

---

## Deliverables

1. **Design system**
   - Color tokens, type scale, spacing scale, component specs.

2. **Component library**
   - Buttons (primary, secondary, ghost), inputs, cards, list rows, badges, bottom sheets.

3. **Mobile app screens**
   - Home, Product list, Product detail, Cart, Checkout (address + summary), Payment (STK prompt + status), Orders list, Order detail, Profile.

4. **Admin dashboard screens**
   - Dashboard (KPIs), Products CRUD, Categories, Inventory, Orders, Shipments, Vendors, Payments, Payouts & reports.

5. **Checkout & payment prototype**
   - Flow: Cart → Checkout (address) → “Pay with M-Pesa” → “Check your phone” → Order confirmed.

6. **Tokens for dev**
   - Export tokens for React Native (theme object) and Tailwind (admin): colors, spacing, radius, typography.

---

## Copy notes

- **Swahili:** “Sokoni kwa urahisi”, “Lipa sasa”, “Angalia simu yako”, “Order yako imethibitishwa”.
- **English:** Use for admin and optional app locale.
- **Currency:** Always “TZS” with space before amount.

---

## Reference

- Minimal, not flat: light shadows and soft borders.
- No aggressive red/orange; primary is teal/charcoal.
- Trust signals: clear totals, secure payment copy, order number visible after payment.
