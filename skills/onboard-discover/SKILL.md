---
name: onboard-discover
description: |
  Deep project scanning, indexing, and user interview. Second phase of PTheory onboarding.
  After /onboard-project sets up infrastructure, this skill scans the existing codebase to understand
  what's built, indexes features/migrations/tests/infrastructure, and interviews the user about
  things that can't be inferred from code.
  Use when the user says "/onboard-discover", "scan this project", "index the codebase",
  or automatically after /onboard-project completes on a new project.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# Onboard Discover Skill

Deep project scanning and indexing. Reads the entire codebase, documentation, infrastructure, and git history to build a structured project index. Interviews the user about things that can't be inferred from code.

**This is phase 2 of the onboarding chain:**
```
/onboard-project (infrastructure) → /onboard-discover (scanning + indexing) → /onboard-migrate (Plane)
```

**This is a global skill.** Works with any project regardless of tech stack.

## When to Use

- After /onboard-project completes on a new project
- User says "/onboard-discover", "scan this project", "what's in this repo"
- When PTheory needs to understand an existing project before creating Plane structure
- Can be re-run to update the index after significant changes

## Process

### Step 1: Code Scanning

Use the Explore agent or direct Glob/Grep/Read to discover:

#### Backend
- **Routes/endpoints:** Scan for route files (Express, Hono, Fastify, Flask, etc.)
  - For each: path, HTTP method, auth required?, handler location
- **Database schema:** Find ORM schema files (Drizzle, Prisma, TypeORM, SQLAlchemy)
  - Tables, columns, relations, enums
- **Migrations:** Find migration directory, list all migrations, determine which have run
- **Models/types:** Data structures, DTOs, API response types
- **Services/libraries:** Business logic modules, shared utilities
- **Middleware:** Auth, validation, rate limiting, error handling
- **Workers/jobs:** Background processes, scheduled tasks

#### Frontend
- **Screens/pages:** Find all screens/pages/views
  - For each: route path, component name, what it renders
- **Components:** Reusable UI components
- **State management:** Providers, stores, contexts, reducers
- **API client:** How the frontend calls the backend
- **Navigation:** Router config, route guards, deep links

#### Marketing/Public Site
- **Pages:** Public-facing pages
- **Forms:** Contact, newsletter, volunteer forms
- **SEO:** Meta tags, sitemap, robots.txt

### Step 2: Documentation Scanning

- **README.md / CLAUDE.md / AI.md** — existing project context
- **docs/ hierarchy** — any existing documentation layers
- **Feature notes** — completed feature documentation
- **Architecture docs** — system maps, schema docs, flow docs
- **Changelogs / release notes** — version history
- **API docs** — OpenAPI specs, Postman collections
- **ADRs** — architecture decision records

### Step 3: Infrastructure Scanning

- **Deployment config:** render.yaml, Dockerfile, vercel.json, fly.toml, etc.
  - Services, build commands, start commands, health checks
- **CI/CD:** GitHub Actions, GitLab CI, CircleCI workflows
- **Environment variables:** .env.example, render.yaml env blocks
  - Which are required, which are optional, which services use them
- **External integrations:** Detect from imports and config
  - Stripe, SendGrid, S3, OAuth providers, analytics, monitoring
- **Package managers:** npm, pub, pip, cargo — versions and dependency counts

### Step 4: State Scanning

- **Git history:** Recent commits (last 20), active branches, contributors
- **Existing issues:** If Plane/GitHub Issues are accessible, scan for open issues
- **Migration state:** Which migrations exist vs which have been applied
- **Test state:** Run test discovery (don't execute), count test files and what they cover
- **Build state:** Can the project build? Check for build scripts and configs

### Step 5: Feature Classification

From the scanning results, classify each discovered feature:

| Status | Criteria |
|--------|----------|
| **implemented** | Backend route + frontend screen + working integration |
| **implemented-untested** | Working code but no test files found |
| **partial** | Backend exists but frontend is stubbed, or vice versa |
| **stubbed** | Code exists but uses mock data or placeholder logic |
| **planned** | Referenced in docs/issues but no code exists |
| **infrastructure** | Not a user feature — deployment, CI, tooling |

### Step 6: Gap Detection

Identify gaps automatically:
- Features with no tests → test debt
- Backend endpoints with no frontend consumer → incomplete wiring
- Frontend screens with hardcoded data → stub content
- Migrations in schema but not in migration files → schema drift
- Environment variables referenced but not in .env.example → config gap
- Documented features that don't exist in code → doc drift

### Step 7: User Interview

After scanning, present findings and ask targeted questions. Use AskUserQuestion for structured responses.

**Questions to ask:**

1. "I found [N] features. Here's the summary: [list]. Is this accurate? Anything I missed?"
2. "What's the current priority? What are you actively working on?"
3. "I detected these gaps: [list]. Are these known? Are any intentional?"
4. "Are there features planned that aren't in the code yet?"
5. "Are there compliance or security requirements I should know about?"
6. "Who else works on this project? What are their roles?"
7. "What's the deployment workflow? (Push to main? PR review? Staging first?)"

**Adapt questions based on what was found.** Don't ask about deployment if render.yaml already answers it. Don't ask about tech stack if it's obvious from the code.

### Step 8: Produce Project Index

Write the structured index to `.claude/project-index.yaml`:

```yaml
# PTheory Project Index
# Generated by /onboard-discover
# Last updated: YYYY-MM-DD

project:
  name: [project name]
  description: [from scope + scanning]
  repo: [git remote URL]
  tech_stack:
    backend: [frameworks, language, ORM, database]
    frontend: [frameworks, language, state management]
    marketing: [framework, styling]
  platforms: [web, ios, android]
  deployment:
    platform: [render, aws, vercel, etc.]
    services: [list of services]
    ci: [GitHub Actions workflows]
  external_integrations: [stripe, sendgrid, s3, etc.]

features:
  - name: [Feature Name]
    status: [implemented | implemented-untested | partial | stubbed | planned]
    backend:
      routes: [list of route files]
      models: [list of model/type files]
      migrations: [list of related migrations]
    frontend:
      screens: [list of screen files]
      components: [list of component files]
      providers: [list of state files]
    tests: [list of test files]
    docs: [list of related doc files]
    notes: "[human-readable description of current state]"

infrastructure:
  services:
    - name: [service name]
      type: [web, worker, static, database]
      config_file: [render.yaml, Dockerfile, etc.]
      health_check: [URL if applicable]
  ci_workflows:
    - name: [workflow name]
      file: [.github/workflows/xxx.yml]
      triggers: [push, PR, etc.]
  env_vars:
    - name: [VAR_NAME]
      service: [which service uses it]
      required: [true/false]
      has_example: [true/false]

gaps:
  - type: [test_debt | stub_content | incomplete_wiring | schema_drift | config_gap | doc_drift]
    description: "[what's missing]"
    affected_feature: [feature name]
    severity: [high | medium | low]

user_responses:
  priority: "[what the user said]"
  active_work: "[what's in progress]"
  planned_features: "[what's next]"
  known_debt: "[acknowledged tech debt]"
  compliance: "[security/compliance requirements]"
  team: "[who works on this]"
  deploy_workflow: "[how deployments work]"
```

### Step 9: Report

Show the user a summary:

```
## Project Discovery Complete: [Project Name]

**Tech stack:** [detected]
**Features found:** [count] ([count] implemented, [count] partial, [count] stubbed)
**Test coverage:** [count] features with tests, [count] without
**Gaps detected:** [count] ([count] high, [count] medium, [count] low)
**Infrastructure:** [count] services, [count] CI workflows

Project index written to: .claude/project-index.yaml

Next step: Review the index, then run /onboard-migrate to create the Plane project structure.
```

---

## Rules

1. **Scan thoroughly but efficiently.** Use agents for broad exploration, direct reads for targeted inspection.
2. **Don't modify any code.** This skill is read-only. It observes and records.
3. **Adapt the interview.** Don't ask questions the code already answers. Focus on context that can't be inferred.
4. **Feature classification is best-effort.** If unsure, ask the user during the interview.
5. **Gap detection is objective.** Report what's missing without judgment. The user decides what matters.
6. **The project index is the output.** Everything flows through this file. /onboard-migrate reads it.
7. **Idempotent.** Re-running updates the index. Old features keep their status unless the code changed.
