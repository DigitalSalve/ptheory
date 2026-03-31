---
name: review-architecture
description: |
  Architecture review — validates layer alignment, structural integrity, and dependency consistency.
  Catches misalignments between UI, API, and database layers that UX review misses because the
  user journey might "work" even when the architecture is wrong underneath.
  This is NOT code review (/code-review) and NOT UX review (/review-ux).
  This skill asks: "are the layers properly connected and structurally sound?"
  Use when the user says "/review-architecture", "architecture review", "check alignment",
  or automatically invoked by the review orchestrator agent after /review-ux completes.
  Produces structured findings with CRITICAL/MEDIUM/LOW triage that /document-plane turns into issues.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Review Architecture Skill (Structural Alignment Review)

Validates that the system's layers are properly connected, structurally sound, and free of drift. Produces findings that `/document-plane` turns into triaged Plane issues.

**This is NOT code review** (/code-review) **and NOT UX review** (/review-ux). This skill asks: "Are the layers properly connected? Does the architecture match what was built?"

## When to Use

- After /review-ux completes (chain position: third review in orchestrator)
- User says "/review-architecture", "architecture review", "check alignment"
- Automatically invoked by the review orchestrator agent
- Before closing a milestone — structural validation pass
- After significant implementation work touching multiple layers

## Process

### Step 0: Read Context

1. Read the active workflow state file at `~/.claude/workflows/`
2. Identify which issue is being reviewed and what files changed
3. Read the plan file for the milestone
4. Read project scope and architecture docs if they exist

### Step 1: Gate Check

1. Confirm test phases are complete
2. If not → **STOP**. Tests must pass before architecture review.

### Step 2: Mark In Progress

Update workflow state: set `review_architecture: in_progress`. Update `updated` date.

### Step 3: Run Architecture Checks

For each check, produce a finding: **PASS**, **WARNING**, or **FAIL** with details.

#### Check 1: UI ↔ API Alignment

- Does every UI action that calls the API have a corresponding backend route?
- Does the API return the data shape the UI expects?
- Are there API endpoints the UI doesn't call (dead endpoints)?
- Are there UI actions that hit endpoints that don't exist (broken wiring)?

**How to check:**
- Grep for API calls in the frontend (fetch, Dio, axios patterns)
- Cross-reference with route registrations in the backend
- Flag mismatches

#### Check 2: API ↔ Database Alignment

- Does every API route that reads/writes data have corresponding schema tables?
- Are queries using columns that exist in the schema?
- Are there schema tables no API route touches (orphaned tables)?
- Are there API routes referencing tables/columns that don't exist?

**How to check:**
- Read the ORM schema (Drizzle schema.ts, Prisma schema, etc.)
- Cross-reference with route handler queries
- Flag mismatches

#### Check 3: Schema ↔ Migration Sync

- Does every table in the schema have a migration that creates it?
- Does every column in the schema have a migration that adds it?
- Are there migrations for tables/columns not in the schema (drift)?

**How to check:**
- Run schema sync checks if available (`check:schema-migrations`, `check:schema-columns`)
- If no automated check, manual comparison

#### Check 4: Route Registration and Import Resolution

- Is every route file imported and mounted in the main server entry point?
- Are there route files that exist but aren't mounted (dead code)?
- Are there mounts that reference files that don't exist?
- **Do ALL imports in new/modified files resolve to actual exports?** For every import statement, grep the target module for the imported name. If it doesn't exist → CRITICAL.
- **Do imports match existing conventions?** If every file in `routes/` imports auth from `middleware/admin.js`, but one imports from `middleware/permissions.js` → flag as convention violation.

**How to check:**
- Read the server entry point (index.ts, app.ts, etc.)
- List all route files in the routes directory
- Cross-reference mounts vs files
- For each new/modified file: extract import statements → grep target modules for exported names → flag mismatches
- Compare import sources against sibling files in the same directory

#### Check 5: Dependency Consistency

- Are all imported modules installed in package.json / pubspec.yaml?
- Are there dependencies installed but never imported (bloat)?
- Are there version conflicts between direct and transitive dependencies?
- Are dev dependencies used in production code paths?

**How to check:**
- Grep for import/require statements
- Cross-reference with dependency manifests
- Check for dev-only deps in production entry points

#### Check 6: Environment Variable Coverage

- Are all env vars referenced in code declared in .env.example or render.yaml?
- Are there env vars in .env.example that no code references (stale)?
- Are required env vars validated at startup?

**How to check:**
- Grep for `process.env.`, `Deno.env`, `Platform.environment`, `--dart-define`
- Cross-reference with .env.example, render.yaml, deployment configs

#### Check 7: Type/Model Alignment

- Do frontend models match backend response shapes?
- Are there fields the backend sends that the frontend ignores (potential data loss)?
- Are there fields the frontend expects that the backend doesn't send (broken rendering)?

**How to check:**
- Compare frontend model classes/interfaces with backend response construction
- Check serialization/deserialization

#### Check 8: Auth/Permission Alignment + Security Surface

- Do protected routes have auth middleware?
- Do admin-only screens have admin guards?
- Are there routes without auth that should have it? (Top 11 #8: Exposed APIs)
- Does the role hierarchy match between frontend guards and backend middleware?
- Are there IDOR/ADOR vulnerabilities — can user A access user B's data via predictable IDs? (Top 11 #5)
- Are CORS origins explicitly allowlisted, no wildcard with credentials? (Top 11 #11)

**How to check:**
- List all routes and their middleware
- List all screens and their guards
- Cross-reference
- `rg 'params\.(id|userId)' --type ts` → verify ownership check follows every param access
- `rg 'cors|CORS_ORIGINS|Access-Control' --type ts` → verify allowlist is explicit

#### Check 9: Worker/Background Job Alignment

- Are background jobs referencing tables and functions that exist?
- Are scheduled jobs registered and configured?
- Do workers share the same schema version as the API?

**How to check:**
- Read worker entry point and job definitions
- Cross-reference with schema and API code

#### Check 10: Deployment Configuration Alignment

- Does render.yaml / deployment config match the actual project structure?
- Are build commands correct for the current project state?
- Are health check paths valid?
- Do start commands reference scripts that exist?

**How to check:**
- Read deployment config
- Verify each service's rootDir, buildCommand, startCommand
- Check that referenced scripts exist in package.json

### Step 4: Produce Structured Outputs

**Alignment Report** — for `/document-code` to write to `.claude/artifacts/architecture-alignment.md`:
```markdown
| Layer Pair | Status | Issues |
|-----------|--------|--------|
| UI ↔ API | [aligned/misaligned] | [count] |
| API ↔ DB | [aligned/misaligned] | [count] |
| Schema ↔ Migrations | [synced/drifted] | [count] |
| Routes ↔ Registration | [complete/gaps] | [count] |
| Deps ↔ Imports | [clean/bloat] | [count] |
| Env vars ↔ Config | [covered/gaps] | [count] |
| Models ↔ Responses | [matched/drifted] | [count] |
| Auth ↔ Guards | [consistent/gaps] | [count] |
| Worker ↔ Schema | [aligned/drifted] | [count] |
| Deploy ↔ Project | [correct/stale] | [count] |
```

**Dependency Gap Report** — for `.claude/artifacts/dependency-gaps.md`:
```markdown
| # | Type | Detail | Severity |
|---|------|--------|----------|
| 1 | Missing dep | [import X but not in package.json] | [high/medium/low] |
| 2 | Unused dep | [in package.json but never imported] | low |
| 3 | Dev in prod | [dev dep used in production path] | high |
```

### Step 5: Classify Findings Against Scope

1. Read the project scope document
2. In-scope findings → triage (CRITICAL/MEDIUM/LOW)
3. Out-of-scope findings → note as "out of scope"

### Step 6: Triage Findings

| Priority | Criteria |
|----------|----------|
| **CRITICAL** | Layer misalignment that causes runtime errors. Missing tables, broken routes, auth gaps. |
| **MEDIUM** | Drift that works now but will break. Stale configs, unused deps, missing env vars. |
| **LOW** | Cleanup. Dead code, orphaned tables, redundant deps. |

### Step 7: Mark Complete

Update workflow state: set `review_architecture: complete`. Update `updated` date.

### Step 8: Produce Output

```markdown
## Architecture Review: {Issue ID} — {Issue Title}

**Overall:** PASS | PASS WITH FINDINGS | FAIL
**Date:** YYYY-MM-DD

### Layer Alignment
| Layer Pair | Status | Findings |
|-----------|--------|----------|
| UI ↔ API | aligned | — |
| API ↔ DB | misaligned | 2 queries reference missing column |
| Schema ↔ Migrations | drifted | 1 table lacks migration |

### Findings
| # | Check | Finding | Priority | In Scope? |
|---|-------|---------|----------|-----------|
| 1 | API↔DB | `sweepstakes_entries.winner_notified_at` in schema, no migration | CRITICAL | Yes |
| 2 | Routes | `events.ts` exists but not mounted in index.ts | CRITICAL | Yes |
| 3 | Deps | `lodash` installed, never imported | LOW | Yes |

### Recommendation
- CRITICAL findings → Loop back to /plan
- Only MEDIUM/LOW → Proceed to /close
```

### Step 9: Next Step

- "Run `/document-code` then `/document-plane` to post findings and create triage issues"
- Architecture artifacts written to `.claude/artifacts/`

## Rules

1. **This is structural, not behavioral.** Don't check if the feature works — that's /review-ux. Check if the layers are connected correctly.
2. **Evidence-based.** Every finding must reference specific files and line numbers.
3. **Don't create issues directly.** /document-plane does that from your findings.
4. **Gate enforcement is mandatory.** Tests must pass before architecture review.
5. **Check ALL layers touched.** If the implementation changed 3 layers, check alignment across all 3.
6. **Schema-migration sync is always checked.** Even if the implementation didn't touch the schema.
