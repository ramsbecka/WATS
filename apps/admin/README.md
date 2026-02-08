# WATS Admin

Admin dashboard for WATS (Next.js).

## Folder structure

```
apps/admin/
  src/
    app/                    # Next.js App Router
      layout.tsx            # Root layout (AuthProvider, globals)
      globals.css           # Global styles
      login/page.tsx        # Login route
      (dashboard)/          # Route group (sidebar layout)
        layout.tsx          # Auth guard + Layout
        page.tsx            # Dashboard home
        products/           # Products CRUD routes
        categories/
        inventory/
        orders/
        shipments/
        returns/
        vendors/
        payments/
        payouts/
        fulfillment-centers/
        bulk-upload/
      not-found.tsx         # 404 page
    components/             # Shared UI
      Layout.tsx            # Sidebar + main area
    pages/                  # Page/screen components (used by app routes)
      Dashboard.tsx, Login.tsx, Products.tsx, ...
    lib/                    # Utilities
      auth.tsx              # Auth context
      supabase.ts           # Supabase client
  next.config.mjs
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
```

## Commands

- `npm run dev` — dev server (port 3001)
- `npm run build` — production build
- `npm run start` — run production server

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
