<div align="center">

# Current

**Focus on what's current.**

A personal productivity platform built around _Progressive Complexity_.
Complexity is optional.

[Documentation](./docs) · [Self-hosting](./docs/deployment.md) · [Architecture](./docs/architecture.md)

</div>

---

Current is an open-source, self-hosted productivity application. It is designed
to be useful within seconds for a beginner — and powerful enough for someone who
wants to build a sophisticated personal system on top of it.

Every advanced feature is optional. The application grows alongside the user.

## Highlights

- **Progressive Complexity** — choose Simple, Balanced, or Advanced. The UI
  adapts to expose only what you've chosen.
- **Tasks, lists, and a Today view** that are always present.
- **Projects, areas, tags, subtasks, priorities, recurring tasks,
  attachments, smart filters, dashboards, and widgets** that appear only when
  you want them.
- **Beautiful by default** — typography, motion, dark mode, density, and seven
  accent colors. Personalize without fiddling.
- **Keyboard-driven** — `⌘K` / `Ctrl+K` opens the command palette.
- **You own your data** — backed by [PocketBase](https://pocketbase.io). Single
  binary, single SQLite file.
- **Self-host in under 10 minutes** — Docker, Dokploy, Coolify, Render,
  Railway, Vercel.

## Quickstart (local development)

```bash
# 1. Install JS deps
npm install

# 2. Configure the frontend
cp .env.example .env

# 3. Start PocketBase (in another terminal)
#    Download v0.31.0 from https://github.com/pocketbase/pocketbase/releases
./pocketbase serve

# 4. Open the PocketBase admin UI (printed on startup),
#    go to Settings → Import collections, and paste pb_schema.json.

# 5. Start the frontend
npm run dev
```

The frontend will be available at <http://localhost:5173>. The first sign-up
becomes a regular user. The PocketBase admin account is separate and is created
through the admin URL printed at startup.

## Self-hosting with Docker

```bash
docker compose up -d
# Frontend: http://localhost:5173
# PocketBase: http://localhost:8090
```

Then import `pb_schema.json` from the PocketBase admin UI.
See [docs/deployment.md](./docs/deployment.md) for Dokploy, Coolify, Render,
Railway, and Vercel guides.

## Tech stack

| Layer        | Tools                                                       |
| ------------ | ----------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite                                  |
| UI           | Tailwind CSS, Radix UI, shadcn-style components, Framer Motion |
| State / data | TanStack Query, Zustand                                     |
| Forms        | React Hook Form, Zod                                        |
| Backend      | PocketBase **v0.31.0** (single binary, SQLite)              |

## Scripts

| Command            | What it does                            |
| ------------------ | --------------------------------------- |
| `npm run dev`      | Start the Vite dev server               |
| `npm run build`    | Type-check and build the production app |
| `npm run preview`  | Preview the production build            |
| `npm run lint`     | ESLint                                  |
| `npm run typecheck`| TypeScript no-emit check                |

## Documentation

- [Platform overview](./docs/current-platform-overview.md) — canonical reference
  document, intended as input to the separate _Current Website_ repository.
- [Architecture](./docs/architecture.md)
- [Database](./docs/database.md)
- [Deployment](./docs/deployment.md)
- [Design system](./docs/design-system.md)
- [Contributing](./docs/contributing.md)

## License

[MIT](./LICENSE) © Current contributors.
