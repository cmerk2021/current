# Database

The PocketBase schema for Current lives in [`pb_schema.json`](../pb_schema.json)
and targets **PocketBase v0.31.0**.

> Import it from the PocketBase admin UI: **Settings → Import collections**.
> Paste the file contents and apply.

## Format

The schema uses PocketBase's modern collection format:

- Collections declare `fields` (not the legacy `schema`).
- The `id` field is explicit, with `primaryKey: true`, `system: true`,
  and an `autogeneratePattern`.
- Timestamps use the `autodate` field type (`onCreate` / `onUpdate`).
- Access rules are top-level strings (`listRule`, `viewRule`, `createRule`,
  `updateRule`, `deleteRule`).
- The `users` collection is `type: "auth"` with `passwordAuth.enabled = true`
  and an OAuth2 block ready to be enabled.

## Collections

### `users` (auth)

Email/password authentication. OAuth-ready (toggle in admin UI). Avatar file
field constrained to common image types up to 5 MB with a 100×100 thumbnail.

### `preferences`

One row per user, created lazily on first authenticated load. Stores:

- `complexity` — `simple` / `balanced` / `advanced`
- `theme` — `system` / `light` / `dark`
- `accent` — one of seven brand colors
- `density` — `compact` / `comfortable` / `spacious`
- `sidebar` — JSON: favorites and hidden sections
- `widgets` — JSON: ordered widget visibility list
- `onboarded` — boolean gate for the onboarding flow

Unique index on `user` enforces the one-to-one relationship.

### `areas`

Optional groupings for projects (Advanced tier). Name, icon, color, order,
archived flag.

### `projects`

Belongs to a user and optionally to an area. Carries `name`, `notes` (rich
editor), `icon`, `color`, `status` (`active` / `on_hold` / `completed` /
`archived`), `order`, `due`.

### `lists`

Lightweight containers for tasks. Optionally scoped to a project.

### `tags`

User-scoped tags. Unique per `(user, name)`.

### `tasks`

The core entity:

| Field           | Type               | Notes                                    |
| --------------- | ------------------ | ---------------------------------------- |
| `title`         | text (required)    | up to 500 chars                          |
| `notes`         | editor             | rich text, up to 200 KB                  |
| `done`          | bool               |                                          |
| `completed_at`  | date               | set automatically on completion          |
| `due`           | date               |                                          |
| `scheduled`     | date               | "work on this date"                      |
| `priority`      | select             | none / low / medium / high / urgent      |
| `list`          | relation → lists   |                                          |
| `project`       | relation → projects|                                          |
| `parent`        | relation → tasks   | for subtasks; cascade delete             |
| `tags`          | relation[] → tags  | up to 20                                 |
| `order`         | number             | fractional, used for drag-sort           |
| `recurrence`    | json               | `{ freq, interval, byweekday? }`         |
| `attachments`   | file[]             | up to 10 files, 10 MB each               |

### `smart_filters`

Saved filter definitions, optionally pinned to the sidebar.

## Access rules

Every non-auth collection uses the same rules:

```
listRule   = user = @request.auth.id
viewRule   = user = @request.auth.id
createRule = @request.auth.id != "" && user = @request.auth.id
updateRule = user = @request.auth.id
deleteRule = user = @request.auth.id
```

This guarantees per-user isolation at the database layer regardless of
frontend bugs.

## Indexes

Indexes exist for the read paths the app uses:

- `users`: unique on `email`, unique on `tokenKey`
- `preferences`: unique on `user`
- `areas`: `(user)`, `(user, order)`
- `projects`: `(user)`, `(user, status)`, `(user, area)`
- `lists`: `(user)`, `(user, order)`
- `tags`: unique `(user, name)`
- `tasks`: `(user)`, `(user, done)`, `(user, due)`, `(user, scheduled)`,
  `(user, list)`, `(user, project)`, `(parent)`
- `smart_filters`: `(user)`

## Migrations

For a fresh install, importing `pb_schema.json` is enough. When you change the
schema, evolve it in the PocketBase admin UI, then re-export to keep
`pb_schema.json` in sync. Commit both.
