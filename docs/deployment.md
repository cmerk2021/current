# Deployment

Current is designed to be self-hosted in under ten minutes.

For every target the recipe is the same:

1. Run PocketBase v0.31.0 with a persistent volume mounted at `/pb/pb_data`.
2. Open the PocketBase admin URL, create the admin account, and import
   [`pb_schema.json`](../pb_schema.json) via **Settings → Import collections**.
3. Build the frontend with `VITE_PB_URL` set to your PocketBase URL.
4. Serve the frontend's `dist/` folder as static files.

## Local — Docker Compose (recommended)

```bash
docker compose up -d
# Frontend:   http://localhost:5173
# PocketBase: http://localhost:8090/_/
```

The compose file ships with a healthcheck on PocketBase and waits for it
before starting the web service. Data persists in `./pb_data`.

To change the PocketBase URL the frontend talks to:

```bash
VITE_PB_URL=https://pocketbase.example.com docker compose up -d --build web
```

## Local — bare metal

```bash
# 1. Download PocketBase v0.31.0 from
#    https://github.com/pocketbase/pocketbase/releases
./pocketbase serve    # http://127.0.0.1:8090

# 2. Import pb_schema.json from the admin UI

# 3. Run the frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
```

## Dokploy

1. Create a new **Compose** application and point it at this repository.
   Dokploy will pick up `docker-compose.yml` and run both services.
2. Add a persistent volume bound to `./pb_data` so PocketBase data survives
   redeploys.
3. Expose port `5173` (web) and `8090` (PocketBase) via Dokploy's domain
   manager. Set `VITE_PB_URL` to your PocketBase domain and trigger a rebuild
   of the web service.
4. Import `pb_schema.json` from the PocketBase admin UI.

## Coolify

1. Create two **Application** resources from this repository:
   - **current-pocketbase** — Dockerfile path `docker/pocketbase.Dockerfile`.
     Attach a persistent volume at `/pb/pb_data`. Expose port `8090`.
   - **current-web** — Dockerfile path `Dockerfile`. Set the build arg /
     env var `VITE_PB_URL` to the public URL of `current-pocketbase`.
2. Assign domains in Coolify.
3. Import `pb_schema.json` in the PocketBase admin UI.

## Render

A [`render.yaml`](../render.yaml) blueprint is included. Click **New +
Blueprint** in Render, point it at this repo, and accept the plan. Render
will provision:

- a **static site** for the frontend (`dist/`)
- a **Docker web service** running PocketBase with a 1 GB persistent disk

Set the `VITE_PB_URL` environment variable on the static site to the URL of
the PocketBase service and redeploy.

## Railway

Create two services from this repository:

| Service               | Builder    | Notes                                                          |
| --------------------- | ---------- | -------------------------------------------------------------- |
| `current-web`         | Dockerfile (`Dockerfile`) | Set `VITE_PB_URL` build env to your PocketBase service URL |
| `current-pocketbase`  | Dockerfile (`docker/pocketbase.Dockerfile`) | Mount a persistent volume at `/pb/pb_data`. Expose port 8090. |

See [`railway.toml`](../railway.toml) for hints.

## Vercel (frontend only)

Run PocketBase yourself (anywhere reachable over HTTPS) and host the static
frontend on Vercel:

1. Import the repository in Vercel.
2. Set the env var `VITE_PB_URL` to your PocketBase URL.
3. Deploy. [`vercel.json`](../vercel.json) configures SPA fallbacks.

## Health, backups, and upgrades

- **Health.** PocketBase exposes `GET /api/health`. The Docker image's
  healthcheck uses it.
- **Backups.** The entire dataset is the contents of `pb_data/`. Snapshot
  the volume on a schedule, or use PocketBase's built-in **Backups** feature
  from the admin UI.
- **Upgrades.** To upgrade PocketBase, bump `PB_VERSION` in
  [`docker/pocketbase.Dockerfile`](../docker/pocketbase.Dockerfile) and
  rebuild. Always back up first.

## Production checklist

- [ ] PocketBase served over HTTPS (terminate TLS at your reverse proxy)
- [ ] `pb_data/` on a persistent volume **with backups**
- [ ] Admin account created with a strong password
- [ ] `VITE_PB_URL` set to the public PocketBase URL before building the frontend
- [ ] `pb_schema.json` imported
- [ ] Email settings configured in PocketBase admin if you want verification /
      password-reset emails to actually send
