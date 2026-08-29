# Restaurant POS & Business Management System

A real, working Next.js + Supabase restaurant POS — not a UI prototype. Every action on the
POS screen writes to Postgres through Row Level Security-protected tables and an atomic
`complete_sale` database function.

## What's built (Phase 1 + 2)

- **Database schema** — `businesses`, `profiles`, `business_users`, `menu_categories`,
  `menu_items`, `restaurant_tables`, `customers`, `orders`, `order_items`, `payments`,
  `audit_logs` — all UUID-keyed, multi-tenant via `business_id`.
- **Row Level Security** on every table — staff can only ever see their own business's data.
  Roles (`owner`, `manager`, `cashier`, `waiter`, `kitchen`, `delivery`) are enforced at the
  database level, not just in the UI.
- **Atomic checkout** — `complete_sale()` is a single Postgres function that creates the
  order, order items, payment record, updates the table status, and writes an audit log in
  one transaction. If anything fails, nothing is half-saved.
- **Auth** — Supabase email/password auth, session-aware middleware, protected routes.
- **Onboarding** — a new restaurant owner can sign up, create their business, and optionally
  seed demo categories/items/tables to start selling immediately.
- **POS / Checkout screen** — cloned from the supplied design reference: category pills,
  searchable product grid, cart with Dine-in/Takeaway/Delivery tabs, table picker, discount,
  tax, delivery fee, cash/card/mobile-money selection with automatic change calculation,
  and a printable receipt.
- **Dashboard** — today's sales, order count, order status breakdown, and recent
  transactions — pulled live from the database, nothing hard-coded.
- **Role-based sidebar** — only shows modules a given role is permitted to use.

## Not yet built (next phases)

Kitchen display, table management UI, delivery management, menu management CRUD,
ingredient-level inventory, purchases/suppliers, expenses, cash register/shifts, employee
management, reports, notifications, and real-time updates are scaffolded as placeholder
routes but not yet implemented. See the sidebar — each shows "scheduled for the next build
phase" until built.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

The `.env.local` in this delivery is already pointed at your connected Supabase project
(`pos`), so it should run as-is.

## Database

All schema/RLS/RPC migrations were applied directly to your Supabase project. To reproduce
them elsewhere, pull migrations with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db pull
```

## Deployment

- **Frontend** → Vercel (`vercel deploy`), set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
- **Backend** → already live on Supabase (Postgres, Auth, and RLS are hosted there).

## Security notes

- Only the anon/publishable key is ever used client-side. No service role key appears
  anywhere in this codebase.
- `complete_sale` is restricted to the `authenticated` role — anonymous callers cannot
  invoke it.
- Every table has RLS enabled with business-scoped policies.
