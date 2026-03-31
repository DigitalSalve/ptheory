# Platform Policy: Render

## MUST

- Every web service must have a `healthCheckPath` defined (typically `/health`)
- Start commands must use only production dependencies — no `tsx`, `ts-node`, or devDependencies in start commands
- Database connection must use `DATABASE_URL` from Render's `fromDatabase` property, not hardcoded strings
- Migrations must run before app start: `npm run migrate && npm run start` pattern in startCommand
- Static sites must have `staticPublishPath` pointing to the build output directory
- SPA (single-page apps) must have a rewrite rule: `/* → /index.html`
- Environment variables with secrets must use `sync: false` in render.yaml (never committed)
- `NODE_ENV` must be set to `production` for all Node services

## MUST NOT

- Never put devDependencies in production start commands (e.g., `tsx` — use compiled JS or `node`)
- Never hardcode database connection strings — always use environment variables
- Never commit secrets to render.yaml — use `sync: false` for sensitive values
- Never use `npm install` without `--omit=dev` awareness — Render runs `npm install` which includes devDeps by default, but start commands should not depend on them
- Never skip health checks — Render uses them to determine if a deploy succeeded
- Never use ports other than what Render assigns via `PORT` env var (web services)

## SHOULD

- Run `npm run validate:production` (or equivalent) before pushing backend changes
- Use `npm run check:schema-migrations` to verify schema-migration sync before deploy
- Define all services in a single `render.yaml` at repo root
- Use Render's `fromDatabase` property for DATABASE_URL instead of manual env var
- Group related env vars by service in render.yaml for readability
- Use `plan: starter` for web services and workers, `plan: basic-1gb` for databases (adjust as needed)
- Keep build commands lean — install + build only, no test execution during build
- Use branch-based environments (main → production, staging → staging) in render.yaml projects

## Examples

**Correct start command:**
```yaml
startCommand: npm run migrate:render && npm run start
```

**Wrong start command:**
```yaml
startCommand: npx tsx src/index.ts  # tsx is a devDependency — will fail in production
```

**Correct health check:**
```yaml
healthCheckPath: /health
```

**Correct SPA rewrite:**
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

**Correct secret handling:**
```yaml
envVars:
  - key: JWT_SECRET
    sync: false  # value set in Render dashboard, not committed
```
