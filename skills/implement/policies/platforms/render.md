# Platform Policy: Render

## MUST

- Every web service must have a `healthCheckPath` defined (typically `/health`)
- Start commands must use only production dependencies — no `tsx`, `ts-node`, or devDependencies in start commands
- Database connection must use `DATABASE_URL` from Render's `fromDatabase` property, not hardcoded strings
- Migrations must run before app start: `npm run migrate && npm run start` pattern in startCommand
- Static sites must have `staticPublishPath` pointing to the build output directory
- SPA (single-page apps) must have a rewrite rule: `/* → /index.html`
- Secrets must never have their values committed to render.yaml — declare them with `sync: false` (inline) or `fromGroup:` (env groups); both keep values in Render's UI
- `NODE_ENV` must be set to `production` for production services (any environment expecting Node.js production-mode library behavior); non-production environments may set it to match the environment name

## MUST NOT

- Never put devDependencies in production start commands (e.g., `tsx` — use compiled JS or `node`)
- Never hardcode database connection strings — always use environment variables
- Never commit secret values to render.yaml — use `sync: false` (inline) or `fromGroup:` (env groups) to keep values in Render's UI
- Never use `npm install` without `--omit=dev` awareness — Render runs `npm install` which includes devDeps by default, but start commands should not depend on them
- Never skip health checks — Render uses them to determine if a deploy succeeded
- Never use ports other than what Render assigns via `PORT` env var (web services)

## SHOULD

- Run `npm run validate:production` (or equivalent) before pushing backend changes
- Use `npm run check:schema-migrations` to verify schema-migration sync before deploy
- Define all services in a single `render.yaml` at repo root (or `render.yaml.template` when multi-environment, see below)
- Use Render's `fromDatabase` property for DATABASE_URL instead of manual env var
- Group related env vars by service in render.yaml for readability
- Use `plan: starter` for web services and workers, `plan: basic-1gb` for databases (adjust as needed)
- Keep build commands lean — install + build only, no test execution during build
- Use branch-based environments (main → production, staging → staging) in render.yaml projects — when running 2+ Blueprints, see Multi-Environment Setup section below for the template-based approach

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

**Correct secret handling (single-environment):**
```yaml
envVars:
  - key: JWT_SECRET
    sync: false  # value set in Render dashboard, not committed
```

---

## Multi-Environment Setup (Production + Staging)

When a project runs two or more Render Blueprints (typically production on `main` + staging on `staging`), `render.yaml` cannot be committed as-is on both branches — the two copies diverge (different service names, branch refs, DB names, URLs), which causes merge conflicts and makes staging→main promotions require hand-curated release branches.

**The standard pattern is CI-generated `render.yaml` from a single template.**

### MUST (multi-environment)

- Maintain `render.yaml.template` as the single source of truth. Humans edit the template; `render.yaml` is a generated artifact
- Parameterize environment differences with template variables: `PROJECT_NAME`, `ENV_NAME`, `BRANCH_NAME` (add more only if necessary)
- Store per-environment values in `.github/env-values/{production,staging}.env` (simple `KEY=value` files)
- Add a GitHub Action (`.github/workflows/generate-render-yaml.yml`) that runs on push to `main`/`staging`, picks the correct `.env` file, substitutes variables via `envsubst` **in allowlist mode**, and commits the regenerated `render.yaml` back to the branch
- Configure `.gitattributes` with `render.yaml merge=ours` on every branch where a Blueprint lives — protects `render.yaml` from being overwritten when merging between environments
- Use per-environment Render Environment Variable Groups for secrets, URLs, and app config; reference them from the template via `fromGroup: ${PROJECT_NAME}` (name env groups to match the project name)
- Keep dynamic references inline in the Blueprint template: `NODE_ENV` (literal per env), `DATABASE_URL` (via `fromDatabase`), `INTERNAL_API_URL` (via `fromService hostport` when used)

### MUST NOT (multi-environment)

- Never hand-edit the generated `render.yaml` — edit `render.yaml.template` instead. Hand edits will be silently overwritten by the next CI run
- Never maintain two diverging `render.yaml` files on different branches long-term — causes merge pain and structural drift
- Never merge `render.yaml` from one environment's branch to another without `.gitattributes merge=ours` protection — risks swapping production's service configuration with staging's (or vice versa)
- Never declare a secret in the Blueprint inline as `sync: false` when the project uses env groups — put it in the env group and reference via `fromGroup`. Duplicating it creates drift between Blueprint and group
- Never use `envsubst` without an allowlist — unrestricted substitution will mangle shell variables like `${API_BASE_URL}` or `$HOME` inside `buildCommand`/`startCommand` lines

### SHOULD (multi-environment)

- Name Render env groups to exactly match the Render project name so one template variable (`PROJECT_NAME`) covers both
- Keep the env-groups lean: secrets + public URLs + app-level config only. Remove `DATABASE_URL`, `INTERNAL_API_URL`, `NODE_ENV` from groups — those belong in the Blueprint template as dynamic/per-env values
- When adding a new service, add the service block to `render.yaml.template` using `${ENV_NAME}` / `${BRANCH_NAME}` placeholders so both environments get parallel services automatically
- Pre-generate `render.yaml` locally when authoring template changes: `envsubst '$PROJECT_NAME $ENV_NAME $BRANCH_NAME' < render.yaml.template > render.yaml` and diff against the committed file to verify the change
- Trigger the workflow only on template-related paths (`render.yaml.template`, `.github/env-values/*.env`, `.github/workflows/generate-render-yaml.yml`) — do NOT trigger on `render.yaml` changes, which would cause infinite regeneration loops
- Commit the generated `render.yaml` alongside the template in PRs so reviewers see the exact output that will deploy

### Examples (multi-environment)

**Template variables (standard 3):**

| Variable | Example values | Used for |
|---|---|---|
| `PROJECT_NAME` | `MyProject-Main` / `MyProject-Staging` | Render project name + env group name (kept identical) |
| `ENV_NAME` | `production` / `staging` | Service name suffix, DB name, `NODE_ENV` value, `environments.name` |
| `BRANCH_NAME` | `main` / `staging` | `branch:` field on each service |

**`render.yaml.template` (excerpt):**
```yaml
projects:
  - name: ${PROJECT_NAME}
    environments:
      - name: ${ENV_NAME}
        services:
          - type: web
            name: myapp-api-${ENV_NAME}
            branch: ${BRANCH_NAME}
            runtime: node
            rootDir: backend
            buildCommand: npm install
            startCommand: npm run migrate:render && npm run start
            healthCheckPath: /health
            envVars:
              - fromGroup: ${PROJECT_NAME}
              - key: NODE_ENV
                value: ${ENV_NAME}
              - key: DATABASE_URL
                fromDatabase:
                  name: myapp-db-${ENV_NAME}
                  property: connectionString
        databases:
          - name: myapp-db-${ENV_NAME}
            plan: basic-1gb
```

**`.github/env-values/production.env`:**
```
PROJECT_NAME=MyProject-Main
ENV_NAME=production
BRANCH_NAME=main
```

**`.github/env-values/staging.env`:**
```
PROJECT_NAME=MyProject-Staging
ENV_NAME=staging
BRANCH_NAME=staging
```

**`.github/workflows/generate-render-yaml.yml`:**
```yaml
name: Generate render.yaml
on:
  push:
    branches: [main, staging]
    paths:
      - 'render.yaml.template'
      - '.github/env-values/*.env'
      - '.github/workflows/generate-render-yaml.yml'
jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - name: Pick env file
        id: env
        run: |
          if [[ "${{ github.ref_name }}" == "main" ]]; then
            echo "file=.github/env-values/production.env" >> $GITHUB_OUTPUT
          else
            echo "file=.github/env-values/staging.env" >> $GITHUB_OUTPUT
          fi
      - name: Substitute template
        run: |
          set -a
          source ${{ steps.env.outputs.file }}
          set +a
          # Allowlist: only substitute the 3 template variables.
          # Shell vars like ${API_BASE_URL}, $HOME, $PORT pass through untouched.
          envsubst '$PROJECT_NAME $ENV_NAME $BRANCH_NAME' < render.yaml.template > render.yaml
      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          if git diff --quiet render.yaml; then
            echo "No change to render.yaml — skipping commit"
            exit 0
          fi
          git add render.yaml
          git commit -m "ci: regenerate render.yaml for ${{ github.ref_name }}"
          git push
```

**`.gitattributes`:**
```
# Environment-specific generated files — keep the current branch's version during merges.
render.yaml merge=ours
```

**Correct env var pattern for multi-environment services:**
```yaml
envVars:
  - fromGroup: ${PROJECT_NAME}          # all secrets, URLs, app config from env group
  - key: NODE_ENV                        # literal per environment
    value: ${ENV_NAME}
  - key: DATABASE_URL                    # dynamic — always fromDatabase
    fromDatabase:
      name: myapp-db-${ENV_NAME}
      property: connectionString
  - key: INTERNAL_API_URL                # dynamic — live service hostname
    fromService:
      name: myapp-api-${ENV_NAME}
      type: web
      property: hostport
```

**Wrong pattern (creates Blueprint↔group drift):**
```yaml
envVars:
  - fromGroup: MyProject-Main
  - key: JWT_SECRET            # ❌ already in env group — duplicate creates drift
    sync: false
  - key: DATABASE_URL          # ❌ DATABASE_URL should be fromDatabase, not in group
    sync: false
```

### Release workflow after this is set up

1. Dev pushes commits to `staging` → CI regenerates `render.yaml` on staging → Render staging Blueprint re-syncs
2. At release time, dev opens PR `staging → main`
3. `.gitattributes merge=ours` auto-resolves `render.yaml` (keeps main's version)
4. All other staging commits flow into main normally
5. Merge → CI regenerates `render.yaml` on main with production values → Render production Blueprint re-syncs
6. No release branches. No hand-curation. No render.yaml merge conflicts.

### Development environment patterns

The multi-env template supports any of these dev environment topologies:

**Pattern A — Local dev + 2 Render Blueprints** (most common, MyGOP uses this)
- Local dev runs on developer machines (not deployed to Render)
- `staging` branch → staging Blueprint (doubles as dev/integration env)
- `main` branch → production Blueprint
- Template variables: 2 env files (`production.env`, `staging.env`)
- Use when: team is small, staging can absorb dev work, no need for cloud dev environment

**Pattern B — Dedicated dev Blueprint + staging + production**
- Local dev still exists but a `dev` branch gets its own Render stack
- `dev` branch → dev Blueprint (team's shared cloud dev env)
- `staging` branch → staging Blueprint (pre-prod QA)
- `main` branch → production Blueprint
- Template variables: 3 env files (`production.env`, `staging.env`, `dev.env`)
- Use when: need cloud dev with real DB/integrations, or when staging must remain production-like

**Pattern C — Render Preview Environments per-PR** (Render-native feature)
- `main` branch → production Blueprint
- Each PR → temporary preview stack spun up automatically by Render
- Single `render.yaml.template` with `previewsEnabled: true`
- Add `previewValue:` to env vars that need PR-specific overrides
- Use when: team has low-friction preview needs and doesn't require persistent staging

**Pattern D — Strict 3-stage promotion** (dev → staging → production)
- Same infra as Pattern B, but with enforced branch promotion chain
- Add branch-protection rules requiring staging as base for main PRs, dev as base for staging PRs
- Template variables: 3 env files
- Use when: regulated environment, strict release control

### Extending the template to 3+ environments

1. Add a new `.env` file: `.github/env-values/dev.env`
2. Extend the workflow's branch picker:
```yaml
- name: Pick env file
  id: env
  run: |
    case "${{ github.ref_name }}" in
      main)    echo "file=.github/env-values/production.env" >> $GITHUB_OUTPUT ;;
      staging) echo "file=.github/env-values/staging.env" >> $GITHUB_OUTPUT ;;
      dev)     echo "file=.github/env-values/dev.env" >> $GITHUB_OUTPUT ;;
      *)       echo "Unsupported branch: ${{ github.ref_name }}"; exit 1 ;;
    esac
```
3. Add `dev` to the workflow's trigger branches
4. Create matching env group in Render (`MyProject-Dev`) with the same keys as other env groups
5. Add the `dev` branch to the workflow's `on: push: branches:` list
6. Confirm `.gitattributes merge=ours` is on the `dev` branch too

### Evolution path

- **Render Environments feature** (newer Render accounts): if available, migrate off Blueprints onto native Environments — eliminates the template need entirely
- **Dynamic values at deploy time** (commit SHA, build number): add a step to the workflow that appends runtime vars to the `.env` file before `envsubst`
- **Per-branch secrets rotation**: use a separate env group per environment, reference via `fromGroup: ${PROJECT_NAME}`, rotate secrets in Render UI without touching the Blueprint
