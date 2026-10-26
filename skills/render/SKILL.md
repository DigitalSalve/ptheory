---
name: render
description: |
  Render deployment platform for MyGOP — 5 services (API, marketing site, Flutter webapp, worker, PostgreSQL).
  Use when the user says "/render", "check Render", "Render status", "check deploy",
  "check the API", "Render logs", "restart service", "run migrations", or any Render task.
  Covers deploys, logs, migrations, health checks, env vars, and troubleshooting.
allowed-tools: Read, Glob, Grep, Bash
---

# Render Skill — MyGOP Services

MyGOP runs 5 services on Render under Blueprint **MyGOPHub-Main**. Two environments: production (branch `main`) and staging (branch `staging`).

## Services

| Service | Type | Source | Domain | Plan |
|---------|------|--------|--------|------|
| **mygop-api-production** | Node web | `backend/` | mygop-api-production.onrender.com | starter |
| **mygop-web-production** | Static | `marketing/` | mygophub.com | — |
| **mygop-webapp-production** | Static | repo root (Flutter) | app.mygophub.com | — |
| **mygop-worker-production** | Node worker | `backend/` (worker.ts) | — (no URL) | starter |
| **mygop-db-production** | PostgreSQL | Render managed | Internal | basic-1gb |

Staging: same names with `-staging` suffix, deploys from `staging` branch.

## API Key

Store in `.env.render` at repo root (gitignored):
```
RENDER_API_KEY=rnd_xxxxxxxxxxxxxxxxxxxxxxxx
```
Create at: Render Dashboard → Account Settings → API Keys

## Health Check

```bash
curl -s https://mygop-api-production.onrender.com/health | jq .
# Returns: { "status": "ok", "database": "connected" }
```

The health endpoint (`GET /health`) always returns 200 — DB status is in the response body. Render uses this to mark deploys as live.

## Deploy Flow

```
Code → Push to main → Render auto-deploys all services
```

**API start command:** `npm run migrate:render && npm run start`
- Runs all migrations first (tracks applied in `schema_migrations` table)
- Then starts the Hono server

**Webapp build:** Checks for pre-built `build/web/` from GitHub Actions CI. If absent, clones Flutter SDK and builds.

## Pre-Deploy Validation (Required)

**Always run before pushing backend changes:**
```bash
cd backend && npm run validate:production
```

This simulates Render's environment:
1. Schema-migrations sync check
2. `npm install --omit=dev` (production deps only)
3. Starts API, polls `/health`
4. Restores devDependencies

Catches failures like `tsx: not found` (devDependency used in start command).

## Migrations

### Run single migration (preferred for agents)
```bash
cd backend && npx tsx scripts/run-migration.ts db/migrations/YYYYMMDD_name.sql
```
Script auto-fetches DB URL via Render API if `RENDER_API_KEY` is in `.env.render`.

### Run all pending migrations
```bash
cd backend && npm run migrate:render
```
Runs all migrations in `backend/db/migrations/` that aren't in `schema_migrations` table.

### Verify schema
```bash
cd backend && npm run check:schema-migrations   # tables have migrations
cd backend && npm run check:schema-columns       # columns have migrations
```

### DB URL resolution order (in scripts)
1. `EXTERNAL_DATABASE_URL` — preferred for local/agent (external hostname)
2. `DATABASE_URL` — when on Render (internal hostname)
3. Render API fetch — uses `RENDER_API_KEY` from `.env.render`

SSL: Scripts auto-append `?sslmode=require` for external connections.

## Render API Operations

### List all services
```bash
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services?limit=20" | jq '.[].service | {id, name, type}'
```

### Check recent deploys
```bash
# Get service ID first, then:
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/SERVICE_ID/deploys?limit=5" | jq '.[].deploy | {id, status, createdAt, finishedAt}'
```

### Get deploy logs
```bash
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/deploys/DEPLOY_ID/logs" | jq '.[].message'
```

### Trigger manual deploy
```bash
curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/SERVICE_ID/deploys" \
  -d '{"clearCache":"do_not_clear"}'
```

### Restart service
```bash
curl -s -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/SERVICE_ID/restart"
```

### List environment variables
```bash
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/SERVICE_ID/env-vars" | jq '.[].envVar.key'
```

### Get database connection info
```bash
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/postgres" | jq '.[].postgres | {id, name, status}'
# Then:
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/postgres/POSTGRES_ID/connection-info"
```

## Environment Variables

**mygop-api-production (required):**
- `JWT_SECRET` — Auth token signing

**mygop-webapp-production (required):**
- `API_BASE_URL` — `https://mygop-api-production.onrender.com` (build-time dart-define)

**Auto-provided by Render:**
- `DATABASE_URL` (from mygop-db connection string)
- `NODE_ENV=production`
- `PORT` (default 3000)

**Full list:** See `render.yaml` (50+ env vars with `sync: false`) and `docs/06-operations/ENV_VARS_RENDER.md`.

## Troubleshooting

### API returning 502 Bad Gateway
- Server must bind to `0.0.0.0` (not localhost) — check `backend/index.ts` line 137
- Check deploy logs for start command failures
- Verify `DATABASE_URL` is set

### Deploy fails with "command not found"
- Tool is likely in devDependencies, not dependencies
- Run `npm run validate:production` locally to catch this
- Common: `tsx` was in devDependencies but used in start command

### Health check fails
- API returns 200 even if DB is disconnected (graceful)
- If health check itself fails, the server didn't start
- Check deploy logs for errors

### Migrations fail on deploy
- Check migration SQL is idempotent (`IF NOT EXISTS`, `DO $$ BEGIN ... END $$`)
- Script ignores duplicate errors (PostgreSQL codes 42701, 42P07, 42710)
- Run migration manually: `cd backend && npx tsx scripts/run-migration.ts db/migrations/FILE.sql`

### Flutter webapp not updating
- GitHub Actions pre-builds `build/web/` on push to main
- If CI didn't run, Render clones Flutter SDK and builds (slow, ~10 min)
- Check `.github/workflows/build-webapp.yml` for trigger conditions

### CORS errors
- Default origins hardcoded in `backend/index.ts` (includes mygophub.com, app.mygophub.com)
- Override with `CORS_ORIGINS` env var (replaces all defaults)
- For local dev: set `ALLOW_LOCALHOST_ORIGINS=true`

## Key Files

| File | Purpose |
|------|---------|
| `render.yaml` | Blueprint — all 5 services, both environments |
| `backend/scripts/run-migration.ts` | Run single migration against Render DB |
| `backend/scripts/run-all-migrations.ts` | Run all pending migrations |
| `backend/scripts/lib/get-render-db-url.ts` | Fetch DB URL via Render API |
| `backend/scripts/validate-production.js` | Pre-deploy validation |
| `scripts/run-render-migrations.sh` | Bash migration runner (requires psql) |
| `docs/06-operations/RENDER_SERVICES_INDEX.md` | Canonical service reference |
| `docs/06-operations/DEPLOYMENT_WORKFLOW.md` | Deploy procedure |
| `docs/06-operations/ENV_VARS_RENDER.md` | Env vars by service |
| `docs/06-operations/RENDER_API_ACCESS_SETUP.md` | API key setup |

## Rules

- Never restart production services without explicit user approval
- Never modify production env vars without explicit user approval
- Always run `npm run validate:production` before pushing backend changes
- Always run migrations immediately after creating them — do not defer
- Never expose DATABASE_URL, API keys, or secrets in output
- Read `render.yaml` before making assumptions about service config
- Migrations are idempotent — never rewrite or delete existing migration files
