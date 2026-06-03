# Architecture

Current is a static SPA backed by a single [PocketBase](https://pocketbase.io)
instance. There is no Node server in production.

```
┌─────────────────────┐        HTTPS         ┌──────────────────────┐
│  React + Vite SPA   │  ─────────────────▶  │ PocketBase v0.31.0   │
│  served by nginx    │  ◀─────────────────  │ SQLite + file store  │
└─────────────────────┘     REST / SSE       └──────────────────────┘
```

## Frontend layers

- **`src/lib/pb.ts`** — typed PocketBase client. Disables auto-cancellation so
  request lifecycles are owned by React Query.
- **`src/lib/auth.tsx`** — auth context, subscribes to `pb.authStore` so the UI
  reacts to token changes (sign-in, sign-out, expiry).
- **`src/lib/preferences.ts`** — fetches or lazily creates one `preferences`
  record per user. Used by the theme provider, the onboarding gate, and the
  Progressive Complexity feature matrix.
- **`src/lib/theme.tsx`** — translates preferences into `class="dark"` and
  `data-accent` / `data-density` attributes on `<html>`.
- **`src/lib/features.ts`** — the **feature matrix**. The single source of
  truth for which UI surfaces are visible at each complexity tier.
- **`src/lib/queries.ts`** — TanStack Query hooks for tasks, lists, projects,
  tags. Query keys are scoped by the authenticated user id.
- **`src/lib/ui-store.ts`** — transient UI state (sidebar, command palette)
  via Zustand.

## Routing

`src/App.tsx` decides which root to render:

1. No user → `/login` / `/signup`
2. User but `preferences.onboarded === false` → onboarding
3. Otherwise → app shell with routes for Today, Upcoming, Dashboard, Search,
   List, Project, Settings.

## State strategy

| Kind                          | Tool                       |
| ----------------------------- | -------------------------- |
| Server data (cache, mutation) | TanStack Query             |
| Auth session                  | PocketBase `authStore` + React context |
| Transient UI (sidebar, modal) | Zustand                    |
| Forms                         | React Hook Form + Zod      |
| URL / navigation              | React Router               |

## Why no global server?

PocketBase already provides: auth, REST, realtime (SSE), file storage,
admin UI, S3 integration, and a JS SDK. Adding a Node BFF would only buy
latency and complexity. If you ever need server-side rendering or third-party
API mediation, prefer a small edge function over a long-running server.

## Multi-tenant boundary

Every non-auth collection carries a `user` relation to `users` and gates
access with:

```
user = @request.auth.id
```

There is no shared collection. There is no admin override path in the
frontend. Cross-tenant leakage requires a misconfigured PocketBase rule, not
an application bug.
