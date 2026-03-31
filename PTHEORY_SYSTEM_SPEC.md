# PTheory System Specification

**Version:** 0.10.0 (Exploration)
**Created:** 2026-03-23
**Last Amended:** 2026-03-30
**Location:** `~/.claude/PTHEORY_SYSTEM_SPEC.md`
**Linear Initiative:** PTheory (KeepstarVentures)

---

## Part 1: What PTheory Is (Macro)

### 1.1 Definition

PTheory is a development methodology that cuts the development cycle in half by running exploration and production preparation in parallel.

Traditional development is sequential: discover → finish discovering → hand off → operator learns the system → build production. The operator waits until exploration is complete. PTheory eliminates that wait.

### 1.2 The Three Layers

Every feature, component, or system flows through three layers **independently and concurrently:**

**Exploration** — The architect discovers and proves solutions using AI agents governed by skills, policies, and guardrails. The primary output is working implementations plus structured artifacts (breadcrumbs) that describe what was built, why, what edge cases exist, and what limitations remain.

**Contract** — When a component's external behavior stabilizes (inputs, outputs, schemas, service responsibilities), a contract is declared. The contract does not mean internal implementation is finished. It means the external behavior is stable enough for other systems to rely on. The contract is the boundary between exploration and operations.

**Productization** — The operator takes contracts and breadcrumbs and builds the scalable, reliable, monitored production version. The operator does not need to reverse-engineer the exploration. The breadcrumbs and contract provide everything needed.

These layers are not sequential phases. Components move through them independently. At any given time, some features are in exploration, some have declared contracts, and some are in production — all within the same project.

### 1.3 Architect and Operator

| Role | Strength | Risk | PTheory Solution |
|------|----------|------|-----------------|
| **Architect** | Discovers fast, proves concepts quickly | Skips structure, leaves no trail | Skills enforce documentation at every phase; breadcrumbs auto-generated |
| **Operator** | Builds reliably, scales production | Slows exploration waiting for handoff | Contract boundary lets operator start as soon as external behavior stabilizes |

AI agents bridge the gap by translating development activity into structured artifacts both sides consume. What historically required weeks of knowledge transfer happens continuously as a byproduct of the development process itself.

### 1.4 The Contract Boundary

A contract is declared when a component's **external behavior** is stable:
- Endpoints, schemas, inputs, outputs are locked
- Internal implementation may still be rough
- Other systems can rely on the declared interface
- The operator can begin production planning against it

Contracts are versioned. Breaking changes require a new version.

### 1.5 Scope as the First Input

Before any work begins, the project must have a defined scope. The scope document is:
- **Required** — the chain blocks without it
- **Living** — amendments are appended, never edited into the original
- **Traceable** — every change has a date, reason, and source
- **Checked twice** — at chain start (is this in scope?) and at chain end (should scope change?)

---

## Part 2: How It Works (Micro)

### 2.0 Request Classification

Every user message is classified before any tool is called. This classification is deterministic and governs whether PTheory's chain is invoked.

**Two modes:**

| Mode | Trigger | What Runs | Changes Anything? |
|------|---------|-----------|-------------------|
| **Advisory** | User is exploring, discussing, analyzing | Agents — they read, analyze, recommend | No |
| **Action** | User needs something done — code, config, infrastructure, behavioral docs | PTheory chain from the top | Yes |

**Advisory mode.** The user is thinking. Launch the appropriate agent — `Plan` to explore approaches, `Explore` to search code, `code-reviewer` to evaluate, `security-auditor` to assess risk. Agents use skills internally as thinking tools but do not execute chain phases. Nothing in the project changes.

Advisory signals: "What is…", "Let's figure out…", "What do you think about…", "Analyze…", "Review this for me…", "How does X work?", "What's our scope?"

**Action mode.** The user needs work done. Start at the top of PTheory. The chain runs in full: intake → scope check → feature request → plan → implement → test → review → close. No skipping. No "quick fix."

Action signals: "Fix…", "Add…", "Implement…", "Create…", "Change…", "Update…", "Remove…", "Build…", "Plan this…", "Do this…"

**The boundary is natural language.** Discussion is free — advisory agents inform decisions without process overhead. But the moment action is required, the chain enforces order. A conversation can start advisory and transition to action when the user says "ok let's do it" or "go ahead."

**Agents own skills, not the other way around.** You don't call `/plan` directly — you call the agent that uses `/plan` as part of its process. The agent determines how to use the skill based on context. In advisory mode, a `Plan` agent can think through approaches without invoking the `/plan` skill's chain phase. In action mode, `plan-orchestrator` runs `/plan` as a formal chain step.

**Feature requests are a PTheory artifact.** When action is classified, PTheory creates a feature request as part of intake before planning begins. This is framework behavior, not a project-specific rule. Projects may define where feature requests are stored (e.g., `docs/08-status/coordination/feature-requests/`), but the requirement to create one comes from PTheory.

**PTheory lives apart from any project.** This classification behavior exists at `~/.claude/` (user-level) and follows the user to every project. A project's `AI.md` may reference PTheory but does not define the gate — PTheory does.

**Classification errors.** If uncertain, default to advisory. Ask the user: "Should I investigate this or go ahead and fix it?" The user's answer resolves the classification. Never default to action — that risks bypassing the chain.

### 2.1 The Skill Chain

The deterministic workflow that every piece of work flows through. Two orchestrator agents drive the lifecycle:

- **plan-orchestrator** — Drives plan creation through a draft→review→finalize loop with operator approval
- **review-orchestrator** — Drives the review phase by dispatching code-review, review-ux, and review-architecture sub-phases

```
USER MESSAGE
  ↓
REQUEST CLASSIFICATION (§2.0)
  → ADVISORY: Launch agent (reads, analyzes, recommends). No chain. Stop here.
  → ACTION: Proceed to chain ↓
  ↓
INTAKE: Capture request → create feature request artifact
  ↓
/scope read (load project scope — BLOCKS if none exists)
  ↓
ONBOARDING GATE: Is project onboarded? (onboarded field in workflow state)
  → NO → /onboard-project → /onboard-discover → /onboard-migrate → /onboard-customize
  ↓
ENTRY GATE: Is there a Linear issue? (check scope, search, create if needed)
  ↓
plan-orchestrator:
  plan_draft → plan_review (plan-review agent) → plan_finalized
  (loops draft→review until operator approves)
  → /document-code → /document-linear
  ↓
/implement [per issue, per wave]
  → implement-orchestrator dispatches to specialist agents
  → Load implementation context (policies — if exist, enforce; if not, proceed)
  → /sanitize-check [GATE: scans staged diff — BLOCKS commit if sensitive data found]
  → /commit → /document-code → /document-linear
  ↓
/test → /document-code → /document-linear
  ↓
review-orchestrator:
  → review_code (code-review agent)
  → review_ux (review-ux skill)
  → review_architecture (review-architecture skill)
  → Classify findings against scope
  → /scope amend (if scope should change)
  → /document-code → /document-linear (triage: CRITICAL/MEDIUM/LOW)
  ↓
/operator-gate (human approval checkpoint before merge/deploy)
  ↓
If CRITICAL issues created → LOOP to plan-orchestrator
If only MEDIUM/LOW or none → /close
  ↓
/close (verify all phases complete, zero critical findings, archive workflow state)
  ↓
repo-orchestrator:
  → /sanitize-check [GATE: scans full branch diff — BLOCKS PR creation if sensitive data found]
  → /push-staging → /push-production → /cleanup-branches (git push/merge/cleanup operations)
```

### 2.2 Complete Skill Inventory

#### Chain Skills (enforce execution order)

| Skill | Location | Purpose | Chain Position | Status |
|-------|----------|---------|---------------|--------|
| `/scope` | `~/.claude/skills/scope/` | Read/amend project scope document | Before onboarding gate + after review | CREATED |
| `/onboard-project` | `~/.claude/skills/onboard-project/` | First-time project setup — docs, agents, skills, Linear, tools | Onboarding phase B (once) | CREATED |
| `/onboard-discover` | `~/.claude/skills/onboard-discover/` | Deep scan project, build index, interview user | Onboarding phase C (once) | CREATED |
| `/onboard-migrate` | `~/.claude/skills/onboard-migrate/` | Translate discovered state into Linear structure | Onboarding phase D (once) | CREATED |
| `/onboard-customize` | `~/.claude/skills/onboard-customize/` | Generate project-specific skills and agents | Onboarding phase E (once) | CREATED |
| `/plan` | `~/.claude/skills/plan/` | Read Linear, produce plan file, create workflow state | First dev chain skill | CREATED (updated) |
| `/implement` | `~/.claude/skills/implement/` | Write code for a single issue with policy loading | Per-issue, per-wave | CREATED (updated) |
| `/test` | `~/.claude/skills/test/` | Write and run tests (extracted from /implement) | After implement | CREATED (updated: import validation + smoke boot) |
| `/review-ux` | `~/.claude/skills/review-ux/` | UX/journey review + triage findings | Review sub-phase | CREATED |
| `/review-architecture` | `~/.claude/skills/review-architecture/` | Architecture review — boundaries, patterns, scaling, import resolution | Review sub-phase | CREATED (updated: import checks) |
| `/document-code` | `~/.claude/skills/document-code/` | Update repo documentation after each phase | After plan, implement, test, review | CREATED |
| `/document-linear` | `~/.claude/skills/document-linear/` | Update Linear after each phase + triage | After plan, implement, test, review | CREATED |
| `/document-review` | `~/.claude/skills/document-review/` | Document review findings and update docs from review | After review phase | CREATED |
| `/close` | `~/.claude/skills/close/` | Verify completion, archive workflow state | Final chain skill | CREATED |
| `/code-review` | `~/.claude/skills/code-review/` | Code conventions, security, test coverage, import resolution | Review sub-phase (quality gate) | CREATED (updated: import checks) |
| `/operator-gate` | `~/.claude/skills/operator-gate/` | Human approval checkpoint before merge/deploy | After review, before close | CREATED |
| `/push-staging` | `~/.claude/skills/push-staging/` | Push current branch to staging for validation | Post-close deployment | CREATED |
| `/push-production` | `~/.claude/skills/push-production/` | Merge to main and push to production | Post-staging deployment | CREATED |
| `/resolve-worktree` | `~/.claude/skills/resolve-worktree/` | Clean up git worktrees after work completes | Post-merge cleanup | CREATED |
| `/cleanup-branches` | `~/.claude/skills/cleanup-branches/` | Bulk audit and delete stale worktrees and branches | Standalone maintenance | CREATED |
| `/ptheory` | `~/.claude/skills/ptheory/` | Entry point — detects state, routes to right action | Top-level entry | CREATED |

#### Orchestrator Agents (drive lifecycle phases)

| Agent | Location | Purpose |
|-------|----------|---------|
| `plan-orchestrator` | `~/.claude/agents/plan-orchestrator.md` | Drives plan lifecycle: draft → review → finalize with operator approval loop |
| `plan-review` | `~/.claude/agents/plan-review.md` | Reviews plan drafts for completeness, feasibility, scope alignment |
| `review-orchestrator` | `~/.claude/agents/review-orchestrator.md` | Dispatches review_code, review_ux, review_architecture sub-phases |
| `implement-orchestrator` | `~/.claude/agents/implement-orchestrator.md` | Dispatches implementation to specialist agents per issue |
| `repo-orchestrator` | `~/.claude/agents/repo-orchestrator.md` | Drives git push/merge operations (staging → production) |
| `ptheory-onboarder` | `~/.claude/agents/ptheory-onboarder.md` | Autonomous onboarding agent (phases A–E) |

#### Specialist Agents (dispatched by orchestrators)

| Agent | Location | Purpose |
|-------|----------|---------|
| `backend-engineer` | `~/.claude/agents/backend-engineer.md` | Backend implementation |
| `frontend-engineer` | `~/.claude/agents/frontend-engineer.md` | Frontend implementation |
| `test-engineer` | `~/.claude/agents/test-engineer.md` | Test writing, execution, and live production QA (uses project skills: qa-site-test, api-security-test, auth-security-test) |
| `code-reviewer` | `~/.claude/agents/code-reviewer.md` | Code review sub-phase |
| `documentation-writer` | `~/.claude/agents/documentation-writer.md` | Documentation updates |
| `security-auditor` | `~/.claude/agents/security-auditor.md` | Plan review: auth gaps, validation, secrets | Advisor (plan-review) | CREATED |
| `security-engineer` | `~/.claude/agents/security-engineer.md` | Platform vulns, OWASP top 11, CORS |
| `data-engineer` | `~/.claude/agents/data-engineer.md` | Database/data operations |
| `devops-engineer` | `~/.claude/agents/devops-engineer.md` | Infrastructure/deployment |
| `designer` | `~/.claude/agents/designer.md` | Design review |
| `performance-engineer` | `~/.claude/agents/performance-engineer.md` | Performance review |
| `debugger` | `~/.claude/agents/debugger.md` | Debugging |
| `refactor-agent` | `~/.claude/agents/refactor-agent.md` | Refactoring |
| `seo-specialist` | `~/.claude/agents/seo-specialist.md` | SEO review |
| `remote-control-manager` | `~/.claude/agents/remote-control-manager.md` | Remote-control LaunchAgent management |

#### Utility Skills (standalone, not chain-ordered)

| Skill | Location | Purpose |
|-------|----------|---------|
| `/commit` | `~/.claude/skills/commit/` | Standardized git commit workflow |
| `/deploy` | `~/.claude/skills/deploy/` | Pre-deploy checklist and deployment |
| `/status` | `~/.claude/skills/status/` | Project health check |
| `/onboard` | `~/.claude/skills/onboard/` | New session startup |
| `/debug` | `~/.claude/skills/debug/` | Structured debugging |
| `/pr` | `~/.claude/skills/pr/` | Pull request creation |
| `/db` | `~/.claude/skills/db/` | Database schema and migrations |
| `/linear` | `~/.claude/skills/linear/` | Generic Linear interactions |
| `/verify` | `~/.claude/skills/verify/` | Test suites + completion verification |
| `/code-dispatch` | `~/.claude/skills/code-dispatch/` | Route code tasks to agents |
| `/flow-diagram` | `~/.claude/skills/flow-diagram/` | Markdown tree-format flow diagrams for plans and docs | Standalone | CREATED |
| `/ptheory-sync` | `~/.claude/skills/ptheory-sync/` | Self-documentation — scan skills/agents/policies, diff vs spec, update |
| `/ptheory-update` | `~/.claude/skills/ptheory-update/` | Proactive framework documentation — documents changes as they happen |
| `/remote-control` | `~/.claude/skills/remote-control/` | Manage Claude remote-control LaunchAgent service |
| `/sanitize-check` | `~/.claude/skills/sanitize-check/` | Pre-commit/pre-PR gate — scans diffs for sensitive data (emails, tokens, keys, personal identifiers). Blocks commit and PR creation on any finding. |
| `/cleanup-branches` | `~/.claude/skills/cleanup-branches/` | Bulk worktree/branch audit (local + remote), classify stale/merged/unique, delete with confirmation. Always asks separately before deleting remote branches. |

#### Project-Specific Skills (per-project, not global)

These exist per-project and are not part of the PTheory core:
- `/render`, `/aws`, `/cloudflare` — infrastructure management
- `/dart`, `/flutter` — language/framework specific
- `/migrate` — project-specific migration workflow
- `/design`, `/brand`, `/ui-styling`, `/ui-ux-pro-max`, `/slides`, `/banner-design`, `/design-system` — design tools
- `/qa-site-test` — live production QA across all 3 MyGOP surfaces (marketing, webapp, API)
- `/api-security-test` — automated API security testing (auth, input validation, injection, rate limits)
- `/auth-security-test` — authenticated security testing (OWASP Top 10: XSS, IDOR, JWT, CORS, role escalation, refresh token rotation)

### 2.3 Workflow State File

**Location:** `~/.claude/workflows/{milestone-slug}.yaml`
**Schema:** `~/.claude/workflows/SCHEMA.md`
**Archive:** `~/.claude/workflows/archive/`

The workflow state file tracks where a milestone is in the chain. Every skill reads it to know what phase it's in, does its work, then marks the phase complete. It persists across sessions.

**Key fields:**
- Workflow metadata (slug, milestone, project, dates, cleanup policy)
- Implementation context (platform, OS, codebase, security, standards → policy loading)
- Milestone-level phases:
  - Plan sub-phases: `plan_draft`, `plan_review`, `plan_finalized` (replacing single `plan` phase)
  - `plan_doc_code`, `plan_doc_linear`
- Per-issue phases (implement → doc_code → doc_linear → test → doc_code → doc_linear → review → doc_code → doc_linear → close)
- Review sub-phases: `review_code`, `review_ux`, `review_architecture`
- Phase values: pending, in_progress, complete, blocked, skipped

**Not the plan file.** The plan file says WHAT to build. The workflow state says WHERE WE ARE.

### 2.4 Implementation Context (Policy Layer)

**Location:** `~/.claude/skills/implement/policies/`
**README:** `~/.claude/skills/implement/policies/README.md`

Composable constraint modules loaded by /implement and /migrate based on the workflow's context block.

**Core rule: If a policy file exists, enforce it. If not, proceed with defaults.**

```
policies/
├── POLICY_TEMPLATE.md          # Standard template for creating new policies (CREATED)
├── README.md                   # Policy index, directory structure, counts (CREATED — updated)
├── platforms/
│   └── render.md              # Render deployment constraints (CREATED)
├── os/                         # linux.md, macos.md (empty — future)
├── security/
│   ├── owasp.md               # OWASP security standards (CREATED)
│   └── sensitive-data.md      # Sensitive data in version control — emails, tokens, personal identifiers (CREATED)
├── codebase/
│   ├── typescript-hono.md     # TypeScript + Hono backend (CREATED — updated: import validation rules)
│   ├── flutter-dart.md        # Flutter + Dart frontend (CREATED)
│   ├── react-nextjs.md        # React + Next.js marketing (CREATED)
│   ├── drizzle-postgres.md    # Drizzle ORM + PostgreSQL (CREATED)
│   └── database-migrations.md # Migration tracking, transaction safety, runner pattern (CREATED)
├── databases/
│   └── postgresql.md          # PostgreSQL patterns: pooling, transactions, indexes, migrations (CREATED)
├── cloud/
│   └── aws-s3.md              # S3 patterns: presigned URLs, bucket policies, content types (CREATED)
├── auth/
│   ├── jwt-patterns.md        # JWT patterns: short-lived access, refresh rotation, HttpOnly cookies (CREATED)
│   └── oauth-general.md       # OAuth patterns: PKCE, state, server-side exchange, account linking (CREATED)
└── standards/
    ├── performance.md         # Performance standards (CREATED)
    └── accessibility.md       # Accessibility standards (CREATED)
```

14 policy files created (+ POLICY_TEMPLATE.md). Policy files contain MUST / MUST NOT / SHOULD rules. Violations are treated like failing tests. Zero policies loaded = current default behavior exactly.

### 2.5 Scope Document

**Skill:** `~/.claude/skills/scope/SKILL.md`
**Document location:** Per-project (e.g., `docs/02-canon/PROJECT_SCOPE.md`)

The scope document defines what a project does and doesn't include. It has:
- **Original scope** — immutable after creation
- **Amendments** — append-only dated entries (what changed, why, source)
- **Current scope** — derived from original + amendments

The /scope skill is global. It creates scope documents from a standard template for any project, reads them, and appends amendments. The creation process is the same regardless of project.

### 2.6 Entry Gate

**Design:** `~/.claude/plans/entry-gate-design.md`
**Implementation:** Step 0 of /plan (KEE-200)
**Prerequisite:** Request must be classified as ACTION per §2.0 before reaching this gate. Advisory requests never reach here.

Every action request flows through intake and entry before work begins:
1. Request classified as ACTION (§2.0)
2. Intake: capture request, create feature request artifact (location is project-specific, e.g. `docs/08-status/coordination/feature-requests/`)
3. /scope read — load scope, block if missing
4. Check request against scope — in scope? needs amendment? out of scope?
5. Search Linear for existing issue
6. If no issue → create one from the feature request
7. Read issue context → proceed to /plan

### 2.7 Review Triage Loop

After /review identifies findings, /document-linear creates issues at three priority levels:

| Priority | Linear Status | Milestone | Re-plan? |
|----------|--------------|-----------|----------|
| CRITICAL | Todo | Inside current milestone | YES — /plan loops |
| MEDIUM | Todo | Outside current milestone | No |
| LOW | Backlog | No milestone | No |

This is the feedback loop. If critical findings exist, the chain loops back to /plan. If only medium/low, proceed to /close. /close gates on zero open critical findings.

### 2.8 Breadcrumb System

Breadcrumbs are structured artifacts auto-generated during development so the operator can reconstruct and scale the system without constant explanation from the architect.

**Generated by:** /document-code (repo artifacts) and /document-linear (Linear artifacts)
**Consumed by:** The operator during the Contract → Productization transition

Categories (from Breadcrumbs System Design doc):
- System flow (request/response paths, core logic)
- Feature changes (patches, modified services)
- Dependencies (external APIs, internal services)
- Edge cases (validation, unexpected inputs)
- Failure modes (what breaks, how it's handled)

### 2.9 Coordination System

File-based agent coordination for multi-agent workflows:
- **Active work tracking** — check-out/check-in before editing shared files
- **Feature requests** — filed before implementing new behavior
- **Directives** — instructions from the architect to agents
- **Q&A** — inter-agent questions and answers

**Template location:** Per-project in `docs/08-status/coordination/`

### 2.10 Documentation Hierarchy

8-layer structure for project documentation:

| Layer | Purpose |
|-------|---------|
| 1. Orientation | How to approach the repo |
| 2. Canon | Mandates, invariants, policies |
| 3. Architecture | System construction, data, boundaries |
| 4. Behavior | User flows, API contracts, UI standards |
| 5. Integrations | External APIs, contracts |
| 6. Operations | SOPs, deployment, processes (~30 SOPs) |
| 7. Guides | Post-completion feature documentation |
| 8. Status | Time-bound progress, reports, decisions |

**Navigation spine:** `docs/README.md` — links to every document in the hierarchy
**Entry point:** `AI.md` → `docs/README.md` → specific layer

### 2.11 Linear Integration

PTheory uses Linear for project management:
- **Initiatives** — high-level goals (PTheory itself is an initiative)
- **Projects** — work containers with milestones
- **Milestones** — stages within a project (E1-E5, C1-C4, P1-P5)
- **Issues** — individual work items with phases tracked in workflow state
- **Labels** — L1 (Exploration), L2 (Contract), L3 (Productization) for layer filtering
- **Comments** — completion summaries posted by /document-linear

---

## Part 3: Directory Structure

### Global (user-level, `~/.claude/`)

```
~/.claude/
├── PTHEORY_SYSTEM_SPEC.md          # THIS FILE — the constitution
├── workflows/
│   ├── SCHEMA.md                    # Workflow state YAML schema
│   ├── EXAMPLE.yaml                 # Reference example
│   ├── {milestone-slug}.yaml        # Active workflow states
│   └── archive/                     # Completed workflows
├── skills/
│   ├── ptheory/SKILL.md             # Entry point — state detection + routing (CREATED)
│   ├── scope/SKILL.md               # Scope read/amend (CREATED)
│   ├── onboard-project/SKILL.md     # Phase B: infrastructure setup (CREATED)
│   ├── onboard-discover/SKILL.md    # Phase C: project scanning + index (CREATED)
│   ├── onboard-migrate/SKILL.md     # Phase D: Linear structure creation (CREATED)
│   ├── onboard-customize/SKILL.md   # Phase E: project-specific skills/agents (CREATED)
│   ├── plan/SKILL.md                # Planning + workflow creation (CREATED — updated)
│   ├── implement/
│   │   ├── SKILL.md                 # Implementation + policy loading (CREATED — updated)
│   │   └── policies/               # Implementation constraints (13 files + template)
│   │       ├── POLICY_TEMPLATE.md   # Standard template for creating new policies (CREATED)
│   │       ├── README.md            # Policy index, counts, usage (CREATED — updated)
│   │       ├── platforms/render.md
│   │       ├── os/                  # (empty — future)
│   │       ├── security/owasp.md
│   │       ├── codebase/           # typescript-hono, flutter-dart, react-nextjs, drizzle-postgres, database-migrations
│   │       ├── databases/postgresql.md  # PostgreSQL patterns (CREATED)
│   │       ├── cloud/aws-s3.md     # AWS S3 patterns (CREATED)
│   │       ├── auth/jwt-patterns.md    # JWT patterns (CREATED)
│   │       ├── auth/oauth-general.md   # OAuth patterns (CREATED)
│   │       └── standards/          # performance, accessibility
│   ├── test/SKILL.md                # Testing — extracted from /implement (CREATED — updated)
│   ├── review-ux/SKILL.md           # UX/journey review (CREATED)
│   ├── review-architecture/SKILL.md # Architecture review (CREATED — updated: import checks)
│   ├── code-review/SKILL.md         # Code conventions review (CREATED — updated: import checks)
│   ├── document-code/SKILL.md       # Repo documentation (CREATED)
│   ├── document-linear/SKILL.md     # Linear documentation + triage (CREATED)
│   ├── document-review/SKILL.md     # Document review findings (CREATED)
│   ├── close/SKILL.md               # Lifecycle closer (CREATED)
│   ├── operator-gate/SKILL.md       # Human approval checkpoint (CREATED)
│   ├── push-staging/SKILL.md        # Push to staging branch (CREATED)
│   ├── push-production/SKILL.md     # Merge to main / push production (CREATED)
│   ├── resolve-worktree/SKILL.md    # Git worktree cleanup (CREATED)
│   ├── cleanup-branches/SKILL.md   # Bulk branch/worktree audit and cleanup (CREATED)
│   ├── commit/SKILL.md              # Git commit workflow (EXISTS)
│   ├── deploy/SKILL.md              # Deployment (EXISTS)
│   ├── status/SKILL.md              # Health check (EXISTS)
│   ├── onboard/SKILL.md             # Session startup (EXISTS)
│   ├── debug/SKILL.md               # Debugging (EXISTS)
│   ├── pr/SKILL.md                  # Pull requests (EXISTS)
│   ├── db/SKILL.md                  # Database operations (EXISTS)
│   ├── linear/SKILL.md              # Linear CRUD (EXISTS)
│   ├── verify/SKILL.md              # Verification (EXISTS)
│   ├── code-dispatch/SKILL.md       # Agent task routing (EXISTS)
│   ├── ptheory-sync/SKILL.md        # Self-documentation / spec sync (CREATED)
│   ├── ptheory-update/SKILL.md      # Proactive framework documentation (CREATED)
│   └── remote-control/SKILL.md      # Remote-control LaunchAgent management (CREATED)
├── agents/
│   ├── plan-orchestrator.md          # Plan lifecycle driver (CREATED)
│   ├── plan-review.md                # Plan draft reviewer (CREATED)
│   ├── review-orchestrator.md        # Review phase dispatcher (CREATED)
│   ├── implement-orchestrator.md     # Implementation dispatcher (CREATED)
│   ├── repo-orchestrator.md          # Git push/merge driver (CREATED)
│   ├── ptheory-onboarder.md          # Autonomous onboarding (CREATED)
│   ├── backend-engineer.md           # Specialist (CREATED)
│   ├── frontend-engineer.md          # Specialist (CREATED)
│   ├── test-engineer.md              # Specialist (CREATED)
│   ├── code-reviewer.md              # Specialist (CREATED)
│   ├── documentation-writer.md       # Specialist (CREATED)
│   ├── security-engineer.md          # Specialist (CREATED)
│   ├── security-auditor.md          # Advisor (CREATED)
│   ├── data-engineer.md              # Specialist (CREATED)
│   ├── devops-engineer.md            # Specialist (CREATED)
│   ├── designer.md                   # Specialist (CREATED)
│   ├── performance-engineer.md       # Specialist (CREATED)
│   ├── debugger.md                   # Specialist (CREATED)
│   ├── refactor-agent.md             # Specialist (CREATED)
│   ├── seo-specialist.md             # Specialist (CREATED)
│   └── remote-control-manager.md    # Remote-control LaunchAgent (CREATED)
└── plans/
    ├── workflow-chain-design.md      # Chain design plan (permanent)
    └── entry-gate-design.md          # Entry gate design (permanent)
```

### Per-Project (repo-level, `.claude/` and `docs/`)

```
{project-repo}/
├── AI.md                            # Agent entry point
├── CLAUDE.md                        # Project rules and conventions
├── .claude/
│   ├── agents/                      # Project-specific subagents
│   ├── settings.json                # Permissions and hooks
│   └── skills/                      # Project-specific skills (if any)
├── docs/
│   ├── README.md                    # Documentation spine
│   ├── 01-orientation/              # through 08-status/
│   └── 02-canon/
│       └── PROJECT_SCOPE.md         # Scope document (created by /scope)
└── ...
```

---

## Part 4: Bootstrappable Artifacts

Everything PTheory needs to be applied to a new project:

| Artifact | Location | Status | What It Is |
|----------|----------|--------|------------|
| System spec | `~/.claude/PTHEORY_SYSTEM_SPEC.md` | **This file** | The constitution — macro + micro |
| Workflow schema | `~/.claude/workflows/SCHEMA.md` | Created (E1) | YAML schema for phase tracking |
| Workflow example | `~/.claude/workflows/EXAMPLE.yaml` | Created (E1) | Reference instance |
| /scope skill | `~/.claude/skills/scope/SKILL.md` | Created (E1) | Scope read/amend + template |
| Entry gate design | `~/.claude/plans/entry-gate-design.md` | Created (E1) | Entry gate logic |
| Policy directory + 13 files + template | `~/.claude/skills/implement/policies/` | Created (E1/E4, expanded v0.5.0) | Constraint modules: render, ts-hono (updated: import validation), flutter-dart, react-nextjs, drizzle-postgres, database-migrations, owasp, performance, accessibility, postgresql, aws-s3, jwt-patterns, oauth-general. Template: POLICY_TEMPLATE.md |
| Chain design plan | `~/.claude/plans/workflow-chain-design.md` | Created (design) | Full chain specification |
| /ptheory skill | `~/.claude/skills/ptheory/SKILL.md` | Created | Entry point — state detection + routing |
| /plan skill | `~/.claude/skills/plan/SKILL.md` | Created (updated E3) | Planning + workflow creation |
| /implement skill | `~/.claude/skills/implement/SKILL.md` | Created (updated E3) | Code implementation + policy loading |
| /test skill | `~/.claude/skills/test/SKILL.md` | Created (updated E3, v0.4.1) | Test writing + execution + import validation + smoke boot |
| /onboard-project | `~/.claude/skills/onboard-project/` | Created (E2) | Phase B: infrastructure setup |
| /onboard-discover | `~/.claude/skills/onboard-discover/` | Created (E2) | Phase C: project scanning + index |
| /onboard-migrate | `~/.claude/skills/onboard-migrate/` | Created (E2) | Phase D: Linear structure creation |
| /onboard-customize | `~/.claude/skills/onboard-customize/` | Created (E2) | Phase E: project-specific skills/agents |
| /document-code | `~/.claude/skills/document-code/` | Created (E2) | Repo documentation |
| /document-linear | `~/.claude/skills/document-linear/` | Created (E2) | Linear documentation + triage |
| /document-review | `~/.claude/skills/document-review/` | Created (E2) | Document review findings |
| /review-ux | `~/.claude/skills/review-ux/` | Created (E2) | UX/journey review |
| /review-architecture | `~/.claude/skills/review-architecture/` | Created (E2, updated v0.4.1) | Architecture review + import resolution |
| /close | `~/.claude/skills/close/` | Created (E2) | Lifecycle closer |
| /code-review | `~/.claude/skills/code-review/` | Created (E3, updated v0.4.1) | Code conventions review + import checks |
| /operator-gate | `~/.claude/skills/operator-gate/` | Created | Human approval checkpoint |
| /push-staging | `~/.claude/skills/push-staging/` | Created | Push to staging |
| /push-production | `~/.claude/skills/push-production/` | Created | Merge to main / push production |
| /resolve-worktree | `~/.claude/skills/resolve-worktree/` | Created | Git worktree cleanup |
| /cleanup-branches | `~/.claude/skills/cleanup-branches/` | Created | Bulk branch/worktree audit and cleanup |
| /ptheory-sync | `~/.claude/skills/ptheory-sync/` | Created | Self-documentation / spec sync |
| /ptheory-update | `~/.claude/skills/ptheory-update/` | Created | Proactive framework documentation |
| /remote-control | `~/.claude/skills/remote-control/` | Created | Remote-control LaunchAgent management |
| plan-orchestrator agent | `~/.claude/agents/plan-orchestrator.md` | Created | Plan draft→review→finalize loop |
| plan-review agent | `~/.claude/agents/plan-review.md` | Created | Plan draft reviewer |
| review-orchestrator agent | `~/.claude/agents/review-orchestrator.md` | Created | Review phase dispatcher |
| implement-orchestrator agent | `~/.claude/agents/implement-orchestrator.md` | Created | Implementation dispatcher |
| repo-orchestrator agent | `~/.claude/agents/repo-orchestrator.md` | Created | Git push/merge operations |
| ptheory-onboarder agent | `~/.claude/agents/ptheory-onboarder.md` | Created | Autonomous onboarding (phases A–E) |
| 15 specialist agents + 1 advisor | `~/.claude/agents/*.md` | Created | Backend, frontend, test, security, data, devops, remote-control, etc. |
| Agent templates | To extract from `.claude/agents/` | To build (P4) | Generic subagent definitions |
| Rules templates | To extract from CLAUDE.md, AI.md | To build (P4) | Project rules templates |
| Docs hierarchy | To extract from `docs/` | To build (P5) | 8-layer template |
| SOPs | To extract from `docs/06-operations/` | To build (P5) | ~30 process templates |
| Linear templates | To extract from Anthropic skills | To build (P5) | Issue/milestone patterns |
| /bootstrap | To build (P3) | To build (P3) | Setup automation |

---

## Part 5: Source Documents

These documents informed the design of PTheory:

| Document | What It Contributed |
|----------|-------------------|
| Breadcrumbs System Design (PDF) | Artifact types, auto-generation during development, operator consumption model |
| AI Orchestrated Parallel Production (PDF) | Contract boundary concept, parallel layer execution, exploration-contract-production flow |
| Architects and Operators (PDF) | Role separation, ownership transfer at contracts, stage definitions |
| Workflow Chain Design (plan file) | Complete chain specification, YAML schema, skill modifications, implementation sequence |

---

## Amendment Log

| Date | Change | Source |
|------|--------|--------|
| 2026-03-23 | Initial specification created from two design sessions + three PDFs | KEE-208 / E1 milestone work |
| 2026-03-23 | v0.2.0: Added orchestrator agents (plan-orchestrator, review-orchestrator, implement-orchestrator, repo-orchestrator), plan sub-phases (draft/review/finalized), review sub-phases (code/ux/architecture), new skills (/push-staging, /push-production, /resolve-worktree, /document-review, /operator-gate, /review-architecture, /ptheory), 7 policy files, 13 specialist agents, onboarding chain (discover/migrate/customize). Updated all statuses from TO BUILD to CREATED. | E1–E4 completion + lifecycle design session |
| 2026-03-23 | v0.3.0: ptheory-sync drift fix. Added 2 missing skills (/ptheory-sync, /remote-control) and 1 missing agent (remote-control-manager) that existed on filesystem but were not documented in spec. Updated specialist agent count 13 to 14. No deletions. All policies verified — no drift. | /ptheory-sync process |
| 2026-03-23 | v0.4.0: Added /ptheory-update skill (proactive framework documentation). Added database-migrations.md policy (migration tracking table, transaction safety, runner pattern). Modified /migrate skill (Step 0 for migration tracking table check). Modified /db skill (migration tracking check in Before Making Changes). Modified data-engineer agent (migration tracking and transaction safety checks). Policy count 7 → 9 (original was 8 — accessibility was uncounted; now 9 with database-migrations). | /ptheory-update process |
| 2026-03-23 | v0.4.1: Import validation hardening. Modified typescript-hono.md policy (verify imports resolve, check existing import patterns, import validation tests required, smoke boot test required, never mock without real import test). Modified /test skill (Step 5b import validation tests, Step 5c smoke boot test). Modified /code-review skill (import source convention check, import resolution verification). Modified /review-architecture skill (Check 4 expanded: import resolution and convention checking). Root cause: M11 agent wrote code importing non-existent export; tests passed due to vi.mock() replacing module before import; server crashed on startup. | /ptheory-update process |
| 2026-03-23 | v0.5.0: Policy layer expansion. Added 3 new directories (databases/, cloud/, auth/) and 4 new policy files (databases/postgresql.md, cloud/aws-s3.md, auth/jwt-patterns.md, auth/oauth-general.md). Created POLICY_TEMPLATE.md for standardized policy authoring. Updated policies/README.md with expanded directory structure, policy count table (7 categories, 13 files), all policies listed. Policy count 9 → 13. | /ptheory-update process |
| 2026-03-24 | v0.7.0: Added /cleanup-branches skill (bulk worktree/branch audit, classify, and delete). Modified repo-orchestrator agent (added /cleanup-branches routing). Skill classifies branches as IDENTICAL/STALE/HAS UNIQUE WORK/PROTECTED, surfaces stashes and untracked files, gets batch confirmation before deleting. | /ptheory-update process |
| 2026-03-24 | v0.8.0: Added Section 2.0 "Request Classification" — deterministic entry point for all PTheory invocation. Every user message classified as ADVISORY (agents read/analyze, no chain) or ACTION (chain from top, no skipping). Advisory signals: "what is", "let's explore", "analyze". Action signals: "fix", "add", "implement", "create". Feature requests formalized as PTheory artifact (not project-specific AI.md rule) — created during intake before planning. Updated chain diagram (§2.1) to show Request Classification and Intake as first steps. Updated Entry Gate (§2.6) to reference §2.0 and include intake/feature-request step. Key principles: agents own skills; PTheory lives apart from projects at ~/.claude/; discussion is free but action triggers the chain. | User design session + /ptheory-update |
| 2026-03-25 | v0.9.0: Added 3 project-specific QA/security skills to MyGOP: qa-site-test (live production QA across marketing/webapp/API surfaces), api-security-test (automated API security — auth, injection, rate limits, infrastructure), auth-security-test (OWASP Top 10 authenticated testing — XSS, IDOR, JWT, CORS, role escalation, refresh token rotation). Modified test-engineer agent to include live QA methodology and reference all 3 new skills. Skills are project-specific (mygop/.claude/skills/), not global. Battle-tested from real production QA sessions. | /ptheory-update process |
| 2026-03-30 | v0.10.0: Sensitive data prevention system. Added /sanitize-check utility skill — hard gate on /commit (Step 2b) and /pr (Step 2) that scans diffs for emails, tokens, API keys, private key material, and personal identifiers in service/container names. Added security/sensitive-data.md policy (MUST NOT commit credentials or personal identifiers; MUST use generic naming; MUST run sanitize-check before every commit and PR). Updated /cleanup-branches skill to audit remote branches (git branch -r) in addition to local, with mandatory separate confirmation before any remote deletion; expanded protected branch list. Root cause: MCP_Containers PR exposed 3 personal email addresses and personal-handle-derived container names across multiple files; GitHub does not support PR deletion so prevention is the only reliable fix. Policy count 13 → 14. | /ptheory-update process |
