# WATS – Design System & Figma Prompt

Hii ni **document ya kubuni** ya UI/UX na maelezo ya Figma: mtindo, tokens, na matoleo. Implementation (components, tokens za code) itafuata **baada** ya kukubaliana na hii.

---

## Logo na rangi ya mradi

- **Logo:** WATS (duara bluu, maandishi meupe “WATS” + nukta tatu) – faili `logo.png` mzizi wa mradi.  
- **Rangi kuu ya mradi:** Bluu ya logo – `#0078D4` (primary/accent). Toleo jinsi: `#0067C1` (kwa hover/pressed).  
- **Rangi ya pili:** Nyeupe `#FFFFFF` kwa maandishi na vipengele juu ya bluu (kama kwenye logo).

---

## Mwelekeo wa kubuni (Design direction)

- **Mtindo:** Minimal, utulivu, wa kuaminika.  
- **Inspiration:** Korean e-commerce (Coupang, Olive Young) – safi, nafasi nzuri, kona zilizopondwa, vivuli vidogo.  
- **Soko:** Tanzania – Kiswahili & Kiingereza, TZS, mobile-first, uaminifu na uelewa zaidi ya mapambo.

---

## Design system (maelezo)

### Rangi (kutoka logo WATS)
- **Primary / accent:** `#0078D4` (bluu ya logo – rangi ya mradi)  
- **Primary dark (hover/pressed):** `#0067C1`  
- **Background:** `#F5F0E8` (warm off-white) au `#F8FAFC` (neutral)  
- **Surface / cards:** `#FFFFFF`  
- **Secondary / borders:** `#E8E4DC` (light beige) au `#E5EFF7` (bluu very light)  
- **Text primary:** `#1A1A1A` au `#0078D4` kwa links/accents  
- **Text secondary:** `#6B6B6B`  
- **On primary (text/icons):** `#FFFFFF` (kama kwenye logo)  
- **Error:** `#C45C5C`  
- **Success:** `#4A7C6B`  

### Typography
- **Font:** Inter au Pretendard-style (safi, inayosomeka).  
- **Headings:** 24–28px, weight 700.  
- **Body:** 15–16px, weight 400.  
- **Small / captions:** 12–14px, weight 500.  
- **Line height:** 1.4–1.5 kwa body.  

### Spacing na layout
- **Border radius:** 12–16px (cards, buttons, inputs).  
- **Padding (cards/sections):** 16–24px.  
- **Whitespace:** Generous; epuka blocks nene.  
- **Grid:** 8px base; 16, 24, 32, 48 kwa sections.  

### Components (maelezo)
- **Buttons:** radius 12px, padding wima 14px, horizontal 24px; variants: primary, secondary, ghost.  
- **Inputs:** radius 12px, padding 14px, border 1px #E8E4DC.  
- **Cards:** radius 16px, shadow kidogo (0 2px 8px rgba(44,62,62,0.06)).  

### Motion
- **Micro-interactions:** 200–300ms ease.  
- **Page transitions:** 250ms ease-out.  
- **Loading:** Skeleton au spinner mdogo kwa rangi ya primary.  

---

## Figma prompt (copy–paste kwa Figma AI / designer)

Design a **premium Korean-inspired e-commerce UI** for **WATS** (Tanzania market).

**Style:** Minimal; soft neutral colors (white, beige, light grey); accent muted deep teal/charcoal (#2C3E3E); rounded corners 12–16px; generous whitespace; Inter or Pretendard-style typography; smooth micro-interactions.

**Deliver:**
1. **Design system** – color tokens, type scale, spacing, component specs.  
2. **Component library** – buttons (primary, secondary, ghost), inputs, cards, list rows, badges, bottom sheets.  
3. **Mobile screens** – Home, Product list, Product detail, Cart, Checkout (address + summary), Payment (STK prompt + status), Orders list, Order detail, Profile.  
4. **Admin screens** – Dashboard (KPIs), Products CRUD, Categories, Inventory, Orders, Shipments, Vendors, Payments, Payouts & reports.  
5. **Checkout & payment prototype** – flow: Cart → Checkout → “Pay with M-Pesa” → “Check your phone” → Order confirmed.  
6. **Tokens for dev** – export for React Native (theme object) and Tailwind (admin): colors, spacing, radius, typography.  

**Copy:** Swahili where relevant (“Sokoni kwa urahisi”, “Lipa sasa”, “Angalia simu yako”, “Order yako imethibitishwa”); English for admin; currency “TZS” with space before amount.  

**Trust:** Clear totals, secure payment copy, order number visible after payment; no aggressive red/orange. **Brand:** Use WATS logo and logo blue (#0078D4) as primary.

---

## Tokens kwa code (baada ya kukubaliana)

- **React Native:** colors, spacing, radius, typography (object/constants).  
- **Tailwind (admin):** extend theme na same values (colors, spacing, borderRadius, fontFamily).  

Hii document inatumika kwa **kujadili** na kukubaliana na design kabla ya Figma na implementation.
