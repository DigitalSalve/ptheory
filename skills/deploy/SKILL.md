---
name: deploy
description: |
  Pre-deploy checklist and deployment workflow.
  Use when the user says "/deploy", "deploy this", "push to production",
  "pre-deploy check", or before pushing to main/production branch.
  Runs validation, checks environments, and verifies readiness.
allowed-tools: Read, Glob, Grep, Bash
---

# Deploy Skill

Pre-deploy validation and deployment workflow. Never deploy without checks passing.

## Process

### Step 1: Discover deployment setup

1. Check for `render.yaml`, `Dockerfile`, `fly.toml`, `vercel.json`, etc.
2. Check for CI/CD workflows (`.github/workflows/`)
3. Read deployment docs if available
4. Identify which services deploy and from which branches

### Step 2: Run pre-deploy checks

Run all available validation:
- Tests: `npm test`, `flutter test`, etc.
- Lint: `npm run lint`, `flutter analyze`
- Schema sync: migration validation scripts
- Production validation: `npm run validate:production` or equivalent
- Build check: ensure the build succeeds locally

All checks must pass.

### Step 3: Verify environment

- [ ] All required env vars are set on the deployment platform
- [ ] Secrets are not in the codebase
- [ ] Database migrations will run on deploy (or have been run manually)
- [ ] CORS origins include production domains

### Step 4: Check git state

```bash
git status          # clean working tree
git log --oneline -5  # verify what's being deployed
git branch          # confirm correct branch
```

### Step 5: Deploy

Depending on the platform:
- **Push-to-deploy:** `git push origin main`
- **Manual deploy:** Platform-specific command
- **CI/CD:** Push triggers workflow

### Step 6: Verify deployment

After deploy completes:
- Hit health check endpoint
- Verify the latest changes are live
- Check deployment logs for errors
- Run a smoke test if available

## Pre-Deploy Checklist

- [ ] All tests pass
- [ ] Schema-migration sync validated
- [ ] No pending migrations (run before deploy or auto-run on start)
- [ ] Environment variables verified
- [ ] Build succeeds locally
- [ ] Git tree is clean
- [ ] Correct branch
- [ ] Deployment logs checked after deploy
- [ ] Health check passes

## Rules

- Never deploy with failing tests
- Never deploy without running validation
- Never push `--force` to production branches
- Always verify deployment succeeded after pushing
