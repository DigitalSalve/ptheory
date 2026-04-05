# Render Templates

Scaffolding templates for the patterns documented in [`../render.md`](../render.md).

## multi-env/ — CI-generated render.yaml from template

Implements the Multi-Environment Setup standard. One `render.yaml.template` that CI renders per environment via `envsubst`.

**Use when:** project deploys to 2+ Render environments (e.g. production + staging).

**Files:**
- `render.yaml.template` — parameterized Blueprint, same on every branch
- `.github/env-values/{env}.env` — per-environment variable values
- `.github/workflows/generate-render-yaml.yml` — regenerates `render.yaml` on push
- `gitattributes-snippet` — `.gitattributes` rule to protect generated `render.yaml` from cross-env merges

### How to apply to a new project

1. **Copy files into the project root:**
   ```bash
   cp -r skills/implement/policies/platforms/render-templates/multi-env/* /path/to/project/
   ```
2. **Customize `render.yaml.template`:**
   - Replace `myapp` prefix with your project's service name prefix
   - Add your project's actual services (API, workers, static sites, databases)
   - Add/remove env vars under each service as needed (secrets go in env groups — see below)
3. **Update `.github/env-values/production.env` and `staging.env`:**
   - Set `PROJECT_NAME` to match your Render project name
   - Set `BRANCH_NAME` to your production/staging branch names
4. **Append to project's `.gitattributes`:**
   ```bash
   cat skills/implement/policies/platforms/render-templates/multi-env/gitattributes-snippet >> /path/to/project/.gitattributes
   ```
5. **In Render dashboard — create matching env groups:**
   - Create env group named exactly the same as `PROJECT_NAME` for each env
   - Attach each env group to its environment's services
   - Add all secrets (JWT_SECRET, STRIPE_*, etc.), public URLs, and app config to the group
6. **Remove the old `render.yaml`** from the repo:
   ```bash
   git rm render.yaml
   ```
7. **Generate locally to verify:**
   ```bash
   set -a; source .github/env-values/staging.env; set +a
   envsubst '$PROJECT_NAME $ENV_NAME $BRANCH_NAME' < render.yaml.template > render.yaml
   ```
8. **Commit and push to staging first** — CI regenerates `render.yaml` via bot push
9. **Verify staging services stay healthy**, then promote to main via normal PR

### Extending to 3+ environments

Add `dev.env` or similar:

1. Create `.github/env-values/dev.env`
2. Add the new branch to `generate-render-yaml.yml`:
   - Extend the `branches:` list under `on: push:`
   - Extend the env-file picker step's branch case statement
3. Create matching Render env group (e.g. `MyProject-Dev`)
4. Ensure `.gitattributes` with `render.yaml merge=ours` exists on the new branch

See [`../render.md`](../render.md) → "Development environment patterns" for the four common topologies (local-only, dedicated dev, per-PR previews, strict 3-stage).
