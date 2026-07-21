# LNDRY Admin Dashboard

Next.js 14 (App Router) admin dashboard for the LNDRY laundry marketplace — vendor onboarding, orders, payments, riders, catalog, and platform settings. Talks to the [LNDRY backend](../Lndry_backend) over REST + Socket.IO for realtime updates.

For a full feature walkthrough see [`DASHBOARD_GUIDE.md`](./DASHBOARD_GUIDE.md); for manual test procedures see [`TESTER_GUIDE.md`](./TESTER_GUIDE.md).

## Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Data fetching:** TanStack Query, axios
- **State:** Zustand (auth/session), TanStack Query (server state)
- **Forms:** react-hook-form + Zod
- **UI:** Radix UI primitives + Tailwind (shadcn/ui pattern)
- **Realtime:** socket.io-client

## Getting started

```bash
npm install
cp .env.example .env   # then adjust NEXT_PUBLIC_API_URL if the backend runs elsewhere
npm run dev
```

Runs at **http://localhost:4501**. Requires the [backend](../Lndry_backend) running locally (default `http://localhost:4500`).

## Architecture

Every data-driven page follows the same chain: **page component → hook (`src/hooks/useX.ts`, TanStack Query) → service function (`src/services/x.service.ts`, wraps the shared axios instance) → backend**.

```
src/
├── app/(dashboard)/    # Route groups — one folder per page, App Router conventions
├── app/(auth)/          # Login / auth-only routes
├── components/          # Shared UI: shadcn primitives (components/ui) + feature components
├── hooks/                # TanStack Query hooks — one file per domain, query + mutation hooks together
├── services/             # Plain async functions wrapping the shared axios client (src/lib/api.ts)
├── lib/                   # Axios instance, query-key factory, utilities
├── store/                  # Zustand stores (auth/session)
└── types/                   # Shared TypeScript types, barrel-exported via types/index.ts
```

The shared axios instance (`src/lib/api.ts`) centralizes auth token attachment, 401/403/429 handling, step-up MFA challenges, and toast-on-error — individual service functions don't need to handle any of that themselves.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on :4501 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (vitest) |
| `npm run e2e` | End-to-end tests (Playwright) |

## Testing

```bash
npm test        # unit tests — src/__tests__, src/hooks/__tests__, etc.
npm run e2e      # Playwright end-to-end + accessibility (@axe-core/playwright)
```
