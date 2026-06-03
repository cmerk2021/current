# Current — Platform Overview

> **Canonical reference document.** This file is the single source of truth for
> any external consumer of the Current project — most importantly the separate
> _Current Website_ repository, which is generated from this document.
>
> If something here disagrees with the codebase, the codebase wins; please
> update this file.

---

## 1. Product

### 1.1 Name and tagline

- **Name:** Current
- **Tagline:** _Complexity is optional._
- **Core idea:** _Focus on what's current._

### 1.2 Mission

Help people stay organized without forcing them into someone else's
productivity system.

### 1.3 Vision

Build the productivity app that feels personal, adaptable, and truly owned by
its users.

### 1.4 Brand values

- User-controlled
- Personal
- Beautiful
- Transparent
- Open source
- Progressive

### 1.5 Positioning

Current sits between Microsoft To Do, Todoist, Notion, and Linear. It combines:

- The practicality of Todoist
- The polish of Linear
- The personalization of Notion
- The data ownership of a self-hosted tool

It explicitly **avoids** Jira-style complexity, corporate project management,
enterprise workflows, and feature overload.

---

## 2. Core principle — Progressive Complexity

Progressive Complexity is the single most important product principle.

- Every advanced feature is **optional**.
- The application **reveals** functionality gradually.
- The user **chooses** complexity.
- Complexity is **never imposed**.

A beginner is productive within seconds. A power user can build a sophisticated
personal productivity system. The same application serves both.

### 2.1 Complexity tiers

| Tier         | Tagline                          | What's included                                                                                                              |
| ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Simple**   | _Just the essentials._           | Tasks, lists, Today, Upcoming, Search, Command palette, Due dates, Personalization                                           |
| **Balanced** | _Structure when you want it._    | Everything in Simple plus Projects, Priorities, Notes, Tags, Subtasks, Board view, Dashboard                                 |
| **Advanced** | _The full system._               | Everything in Balanced plus Areas, Recurring tasks, Attachments, Calendar, Smart filters, Widgets                            |

The tier is selected during onboarding and can be changed at any time in
Settings → Complexity. The frontend uses a [feature matrix](../src/lib/features.ts)
that gates UI surfaces against the active tier; the backend schema is identical
across tiers so changing complexity never destroys data.

---

## 3. Features

### 3.1 Always present (every tier)

- Tasks (create, edit, complete, delete)
- Lists
- Today view
- Search
- Command palette (`⌘K` / `Ctrl+K`)
- Personalization (theme, accent, density)
- Self-hosted authentication (email/password, OAuth-ready)

### 3.2 Optional (Balanced and Advanced)

- Projects, organized under Areas (Advanced only)
- Priorities (None / Low / Medium / High / Urgent)
- Rich notes (block editor backed by PocketBase `editor` field)
- Tags
- Subtasks (parent/child task relations)
- Board view
- Dashboard with stats and progress

### 3.3 Optional (Advanced only)

- Areas (grouping for projects)
- Recurring tasks
- Attachments
- Calendar view
- Smart filters (saved queries)
- Widget system (rearrangeable, hideable dashboard widgets)

### 3.4 Views

- **List** (default, always present)
- **Today**
- **Upcoming**
- **Board** (Balanced+)
- **Calendar** (Advanced)
- **Dashboard** (Balanced+)

---

## 4. User personas

### 4.1 "Maya" — the beginner

Wants a list of things to do today. Doesn't want to learn a system. Picks
**Simple** during onboarding and never looks back.

### 4.2 "Dan" — the considered user

Has a job, a side project, and personal errands. Picks **Balanced**. Uses
projects, tags, and priorities. Lives in the Today view but checks the board
on Monday mornings.

### 4.3 "Priya" — the system thinker

Runs her life as a system. Picks **Advanced**. Uses areas to group projects,
smart filters as named queries, recurring tasks for habits, and the dashboard
to monitor throughput.

### 4.4 "The team behind Current" — the self-hoster

Wants software they own. Self-hosts on a $5/month VPS with Docker. Backs up
the SQLite file weekly.

---

## 5. Architecture

### 5.1 High level

```
┌─────────────────────┐        HTTPS         ┌──────────────────────┐
│  Current (frontend) │  ─────────────────▶  │ PocketBase (backend) │
│  React + Vite       │                      │  Single binary       │
│  Static hosting     │  ◀─────────────────  │  SQLite + Files      │
└─────────────────────┘     JSON / SSE       └──────────────────────┘
```

The frontend is a static SPA. All persistence, auth, file storage, and realtime
subscriptions are provided by [PocketBase](https://pocketbase.io) **v0.31.0**.
There is no Node server in production.

### 5.2 Frontend stack

- **React 18** + **TypeScript** (strict)
- **Vite** build
- **Tailwind CSS** with HSL CSS custom properties for theming
- **Radix UI** primitives wrapped in shadcn-style components
- **Framer Motion** for animation
- **TanStack Query** for server state, caching, and invalidation
- **Zustand** for transient UI state (sidebar, command palette)
- **React Hook Form** + **Zod** for forms and validation
- **cmdk** for the command palette
- **lucide-react** for icons
- **sonner** for toasts

### 5.3 Backend stack

- **PocketBase v0.31.0** — single Go binary, SQLite database, S3-compatible
  file storage, realtime via SSE, REST and JS SDK.
- Authentication: email/password by default. The `users` collection is
  pre-configured to enable OAuth2 by editing the collection in admin UI.

### 5.4 Data flow

1. The frontend authenticates against PocketBase. The token is stored in
   `pb.authStore` (localStorage).
2. All collections are protected by per-user list/view/create/update/delete
   rules of the form `user = @request.auth.id`.
3. React Query keys are namespaced by the current user id, so a sign-out
   clears the cache by virtue of the key changing.

### 5.5 Repository layout

```
/
├── public/                     # static assets
├── pb_schema.json              # PocketBase 0.31 schema (import in admin UI)
├── docker/                     # Dockerfiles for PocketBase + nginx config
├── docs/                       # documentation (this file lives here)
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn-style primitives
│   │   ├── layout/             # sidebar, topbar, app shell
│   │   └── tasks/              # task list + quick add
│   ├── lib/
│   │   ├── pb.ts               # PocketBase client + types
│   │   ├── auth.tsx            # auth context
│   │   ├── theme.tsx           # theme/accent/density provider
│   │   ├── preferences.ts      # user preferences hook
│   │   ├── features.ts         # Progressive Complexity feature matrix
│   │   ├── queries.ts          # TanStack Query hooks
│   │   └── ui-store.ts         # Zustand UI state
│   ├── pages/                  # route components
│   ├── styles/globals.css      # tailwind layers + theme tokens
│   ├── App.tsx                 # routing
│   └── main.tsx                # entry
├── Dockerfile                  # static web image (nginx)
├── docker-compose.yml          # web + pocketbase
├── vercel.json                 # frontend on Vercel
├── render.yaml                 # full stack on Render
└── railway.toml                # Railway hints
```

---

## 6. Database design

The PocketBase schema is in [`pb_schema.json`](../pb_schema.json) and targets
PocketBase **v0.31.0** (modern `fields` collection format, `autodate` fields,
`primaryKey: true` on `id`, modern auth options, per-collection rule syntax).

### 6.1 Collections

| Collection       | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `users`          | Auth collection. Email/password, OAuth-ready, avatar file. |
| `preferences`    | One per user. Complexity, theme, accent, density, sidebar config, widget layout, onboarded flag. |
| `areas`          | Groupings for projects (Advanced tier).                    |
| `projects`       | Projects with optional area, status, due, color, icon, notes. |
| `lists`          | Lightweight lists, optionally scoped to a project.         |
| `tags`           | User-scoped tags.                                          |
| `tasks`          | The core entity. Title, notes, done, completed_at, due, scheduled, priority, list, project, parent (subtasks), tags, recurrence (JSON), attachments. |
| `smart_filters`  | Saved filter queries, optionally pinned.                   |

### 6.2 Access rules

All non-auth collections use the same rule shape:

```
list   = user = @request.auth.id
view   = user = @request.auth.id
create = @request.auth.id != "" && user = @request.auth.id
update = user = @request.auth.id
delete = user = @request.auth.id
```

This makes the multi-tenant boundary trivial to reason about: a user can
only see their own data, period.

### 6.3 Indexes

Indexes exist for every common query path: `(user)`, `(user, done)`,
`(user, due)`, `(user, scheduled)`, `(user, list)`, `(user, project)`, plus a
unique `(user, name)` index on `tags`.

---

## 7. UI / UX philosophy

- **Personal, not corporate.** Use generous whitespace, restrained color, and
  a soft accent. The default accent is indigo; users can change it.
- **Calm by default.** Motion is short (≤200 ms) and subtle. Toasts are
  bottom-right and dismissible.
- **Keyboard-first.** The command palette is the fastest path to any action.
- **Dark mode is first-class.** Both modes are tuned independently.
- **Mobile-first thinking.** The shell collapses cleanly on narrow viewports;
  task rows are touch-friendly.
- **Density.** Compact / Comfortable / Spacious — applied via a CSS variable
  to all task rows.
- **Accessibility.** Built on Radix primitives. Focus rings are always
  visible. Color is never the only signal (priorities also carry text and an
  icon).

---

## 8. Personalization

Every user gets:

- **Theme** — System / Light / Dark
- **Accent color** — Indigo / Violet / Blue / Emerald / Amber / Rose / Slate
- **Density** — Compact / Comfortable / Spacious
- **Sidebar customization** — favorites and hidden sections (stored as JSON)
- **Widget layout** — visible widgets and their order (Advanced tier)

Preferences live in the `preferences` collection, one row per user, created
lazily on first load.

---

## 9. Onboarding

When a new user signs up, they see exactly one screen: a complexity selector
with three cards (Simple / Balanced / Advanced). Choosing one sets
`preferences.complexity` and `preferences.onboarded = true`, then drops them
into the Today view.

The onboarding flow:

- Has a single decision point.
- Surfaces the philosophy explicitly: _"Complexity is optional. You can
  always change this later."_
- Pre-selects **Balanced** as the recommended starting point.
- Is purely client-side after the first authenticated request — no extra
  network round-trips beyond the preferences write.

---

## 10. Deployment

Current is designed to be self-hosted in **under 10 minutes from clone to
working deployment**.

### 10.1 Supported targets

| Target    | Frontend                  | PocketBase                  |
| --------- | ------------------------- | --------------------------- |
| Docker    | `Dockerfile` (nginx)      | `docker/pocketbase.Dockerfile` |
| Compose   | `docker-compose.yml`      | included                    |
| Dokploy   | Compose app or 2 services | volume on `/pb/pb_data`     |
| Coolify   | 2 resources               | persistent volume           |
| Render    | `render.yaml` (Blueprint) | included                    |
| Railway   | Dockerfile service        | Dockerfile service + volume |
| Vercel    | `vercel.json`             | hosted elsewhere            |

### 10.2 Steps

1. Import [`pb_schema.json`](../pb_schema.json) in the PocketBase admin UI.
2. Configure `.env` with `VITE_PB_URL` pointing at the PocketBase URL.
3. Start PocketBase.
4. Deploy the frontend.

Detailed per-provider instructions live in [deployment.md](./deployment.md).

---

## 11. Roadmap

Built today (v0.1):

- Tasks, lists, projects (data layer)
- Today, Upcoming, List, Project, Search, Dashboard, Settings
- Onboarding with complexity selection
- Theme / accent / density personalization
- Command palette with quick-add
- PocketBase v0.31 schema
- Docker, Compose, Render, Railway, Vercel deploy targets
- CI (lint + typecheck + build)

Near-term:

- Board view for projects and lists
- Calendar view
- Subtasks UI (data already supported)
- Tags UI (data already supported)
- Recurring tasks engine (data already supported)
- Smart filter editor (data already supported)
- Drag-and-drop ordering

Mid-term:

- Widget system + customizable dashboard
- Areas UI
- Mobile installable PWA
- iCal export
- Native OAuth integrations (Google, GitHub)
- Realtime sync via PocketBase SSE
- Import from Todoist / Microsoft To Do

Long-term:

- Native desktop wrapper (Tauri)
- Native mobile apps
- End-to-end encrypted notes
- Automations (rules engine)
- Public API and webhooks

---

## 12. Stable facts (for downstream consumers)

The following are stable contracts the website generator can rely on:

- **Name:** `Current`
- **Tagline:** `Complexity is optional.`
- **Tagline (alt):** `Focus on what's current.`
- **License:** `MIT`
- **Primary repo path:** `/` (this repository)
- **Schema file:** `pb_schema.json` — PocketBase 0.31 format
- **Default frontend port:** `5173`
- **Default PocketBase port:** `8090`
- **Required PocketBase version:** `v0.31.0` or newer in the 0.31.x line
- **Required Node version:** `>= 20`
- **Brand colors (HSL):**
  - Primary (indigo): `238 76% 60%` (light) / `238 84% 67%` (dark)
  - Accent palette: indigo, violet, blue, emerald, amber, rose, slate
- **Logo concept:** wave-of-current glyph, gradient indigo → sky-500. The
  in-app SVG lives in [`public/favicon.svg`](../public/favicon.svg).

---

## 13. Screenshots (placeholders)

The website should request screenshots from the following routes once a demo
instance exists:

- `/` (Today view)
- `/upcoming`
- `/dashboard`
- `/settings` — appearance tab
- `/settings` — complexity tab
- Command palette (`⌘K`) overlay
- Onboarding screen

For now, no real screenshots ship with the repo. Suggested asset slots:

```
docs/assets/screenshots/today-light.png
docs/assets/screenshots/today-dark.png
docs/assets/screenshots/dashboard-light.png
docs/assets/screenshots/onboarding.png
docs/assets/screenshots/command-palette.png
```

---

## 14. Future plans for the website

The Current Website repository should treat this document as its data source.
Recommended page structure:

- `/` — hero (tagline + product video), three-tier complexity explainer
- `/features` — generated from §3 of this file
- `/philosophy` — generated from §2
- `/self-host` — generated from §10
- `/docs` — proxied or rebuilt from `/docs/*` in this repository
- `/changelog` — from GitHub releases
- `/download` — links to releases + Docker pull instructions

The website is the marketing surface. This repository is the product. They
should never drift; this file is how we keep them in sync.
