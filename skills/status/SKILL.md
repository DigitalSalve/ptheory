---
name: status
description: |
  Project health check — git state, deploys, tests, schema sync, and service status.
  Use when the user says "/status", "project status", "health check", "what's the state",
  "is everything working", or when starting a work session to understand current state.
  Checks git, tests, schema sync, API health, and deploy status.
allowed-tools: Read, Glob, Grep, Bash
---

# Status Skill

Comprehensive project health check. Run this at session start or when you need a snapshot of project state.

## Process

### Step 1: Git state

```bash
echo "=== Branch ==="
git branch --show-current

echo "=== Uncommitted changes ==="
git status --short

echo "=== Recent commits ==="
git log --oneline -5

echo "=== Unpushed commits ==="
git log --oneline @{u}..HEAD 2>/dev/null || echo "No upstream tracking"
```

### Step 2: Dependencies

Check if dependencies are installed and up to date:
```bash
# Node projects
[ -f package.json ] && [ -d node_modules ] && echo "Root: node_modules present" || echo "Root: node_modules MISSING"
[ -f backend/package.json ] && [ -d backend/node_modules ] && echo "Backend: node_modules present" || echo "Backend: node_modules MISSING"
[ -f marketing/package.json ] && [ -d marketing/node_modules ] && echo "Marketing: node_modules present" || echo "Marketing: node_modules MISSING"

# Flutter
[ -f pubspec.yaml ] && flutter pub get --dry-run 2>/dev/null && echo "Flutter: deps OK" || echo "Flutter: needs pub get"
```

### Step 3: Tests

Run quick test checks (don't run full suites unless asked):
```bash
# Backend
cd backend && npm test 2>&1 | tail -5
cd ..

# Flutter
flutter test 2>&1 | tail -5
```

### Step 4: Schema sync (if applicable)

```bash
cd backend && npm run check:schema-migrations 2>&1 | tail -3
cd backend && npm run check:schema-columns 2>&1 | tail -3
```

### Step 5: API health (if available)

```bash
# Production
curl -s https://mygop-api-production.onrender.com/health | jq . 2>/dev/null || echo "API: unreachable"

# Local
curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "Local API: not running"
```

### Step 6: Report

Summarize findings in a clear table:

| Area | Status | Details |
|------|--------|---------|
| Git | ✅/⚠️/❌ | Branch, uncommitted changes, unpushed |
| Dependencies | ✅/⚠️/❌ | Installed/missing |
| Tests | ✅/⚠️/❌ | Passing/failing/not run |
| Schema | ✅/⚠️/❌ | In sync/drift detected |
| API (prod) | ✅/⚠️/❌ | Healthy/degraded/down |
| API (local) | ✅/⚠️/❌ | Running/not running |

## When to Run

- **Session start:** Quick overview before diving into work
- **Before deploy:** Full check including tests
- **After major changes:** Verify nothing broke
- **Debugging:** Understand current state

## Rules

- Don't fix issues found — just report them
- If tests fail, note which ones and suggest next steps
- If schema is out of sync, note which tables/columns are affected
- Keep the report concise — table format preferred
