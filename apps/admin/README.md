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
    components/             # UI used by app routes (Layout, Dashboard, Login, Products, …)
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
- `npm run clean` — remove `.next` cache (run after stopping dev server if you see ENOENT/manifest errors)

## Troubleshooting

- **"Missing required error components" / ENOENT `app-build-manifest.json`**  
  Turbopack has been disabled (`--turbo` removed). If you still see cache errors: stop the dev server (Ctrl+C), run `npm run clean`, then `npm run dev` again.
- **`.next` in use**  
  Stop the dev server completely before running `npm run clean` or deleting the `.next` folder.

## Environment

Copy the repo root `.env.example` to `apps/admin/.env.local` (or create `.env.local` here) and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
