# PTheory as originally envisioned

- A complete account of the original PTheory: what it was for, how it ran, and every rule it set.
- Source: `DigitalSalve/ptheory`, March 31, 2026, written by Dustin Taylor. Read in full; nothing
  here comes from any later PTheory project or any other framework.
- This is the knowledge the new framework starts from. No files are carried over, only this.

---

## 1. The idea

PTheory was a development method for Claude Code, made of skills (how to do a step) and agents
(who does it). Its stated aim was to **cut the development cycle in half** by letting exploration
and production run in parallel, joined by contracts.

Three convictions sit under everything in it:

| Conviction | What it meant in practice |
|---|---|
| **Nothing starts without a defined scope.** | A scope document is required before any planning. It is never edited, only amended. |
| **Work moves through a fixed chain, one job per step.** | Plan, implement, test, review and close are separate steps. A step does its job and nothing else. |
| **If it isn't written down, it doesn't exist.** | Every step is documented twice: in the repo and in the tracker. The final gate only accepts files. |

It drew on the Your-Workspace "Architects and Operators" framework: an **architect** explores and builds,
an **operator** takes the result into production. The handoff between them is a **contract
boundary**, guarded by a 24-point readiness gate.

---

## 2. The lifecycle, end to end

```
/ptheory                                one entry point; detects state and routes
|
|- onboarding (once per project)
|  |- git cleanup                       resolve worktrees and branch before anything else
|  |- scope                             interview the user, write the scope document
|  |- infrastructure                    docs hierarchy, CLAUDE.md, AI.md, .claude/ folders
|  |- discovery                         scan code, docs, infra and history; interview; write index
|  |- migration                         turn the index into tracker milestones and issues (asks first)
|  |- customization                     generate project-specific skills and agents
|
|- planning (per milestone)
|  |- pre-planning gates                scope exists, project onboarded, request in scope, issue found or created
|  |- parallel detection                other milestones running? map shared files, claim migration dates
|  |- draft plan                        classify issues, order into waves, test strategy per wave
|  |- specialist review                 8 perspectives review the draft; criticals force a revision (max 3)
|  |- finalize                          write the workflow state file; this is the "plan is final" signal
|  |- document                          repo docs, then tracker
|
|- per issue, wave by wave
|  |- implement                         code only, under loaded policies
|  |- document (repo, then tracker)
|  |- test                              write and run; everything must pass
|  |- document (repo, then tracker)
|  |- review                            code, UX, architecture
|  |- document + triage                 findings become issues by severity
|  |- loop back                         any critical finding returns the work to planning
|
|- close (per milestone)
   |- operator readiness gate           24 binary criteria; one fail blocks
   |- critical findings gate            zero open criticals
   |- phase and wave checks             every phase complete or skipped with a reason
   |- parallel merge                    rebase, retest, merge in order, notify siblings
   |- mark done, post summary, archive state
```

### 2.1 Entry: `/ptheory`

One command for the user. It checks, in order: is there a scope? Is the project onboarded? Is a
workflow already running? Then it routes:

| State found | Action |
|---|---|
| No scope or not onboarded | Run the onboarding agent through every missing phase |
| Onboarded, nothing running | Ask what to work on, then start planning or implementing |
| Onboarded, workflow running | Read the state file, find where it stopped, offer to resume |
| Workflow stuck `in_progress` from a crashed session | Offer resume or reset |

The user never needs to know the sub-steps exist.

### 2.2 Onboarding

Run once per project by an autonomous onboarding agent. It skips any phase already done, never
overwrites existing files, and pauses only when it needs an answer it can't get from the code.

| Phase | Produces |
|---|---|
| 0. Git state | Clean worktrees, correct branch. Never removes the worktree it is running in. |
| A. Scope | `PROJECT_SCOPE.md`, from an interview if missing |
| B. Infrastructure | The 8-layer `docs/` hierarchy, `CLAUDE.md`, `AI.md`, `.claude/` folders, coordination folders |
| C. Discovery | `.claude/project-index.yaml`: every route, table, screen, integration; each feature classified |
| D. Migration | Tracker project, milestones and issues built from the index, after the user confirms |
| E. Customization | Project-specific skills and agents with real paths, commands and conventions |

When all phases finish it writes `.claude/ptheory.yaml`, a permanent record that the project is
onboarded. It is checked first next time.

**Feature classes** used in discovery: implemented, implemented-untested, partial, stubbed, planned.
**Gaps** it looks for: test debt, stub content, incomplete wiring, schema drift, config gaps.

**The docs hierarchy:**

| Layer | Holds |
|---|---|
| `01-orientation` | How to approach the repo |
| `02-canon` | Mandates, policies, the scope document |
| `03-architecture` | How the system is built, data, boundaries |
| `04-behavior` | User flows, API contracts |
| `05-integrations` | External APIs |
| `06-operations` | SOPs, deployment, processes |
| `07-guides` | Feature documentation and templates |
| `08-status` | Progress, reports, decisions, test coverage, agent coordination |

### 2.3 Scope

A living document with a formal amendment trail.

- **Required.** The chain stops if there is no scope.
- **Immutable original.** Changes are appended as dated amendments: change, reason, source, impact.
- **Used twice in the chain:** at planning ("is this request in scope?") and at review ("is this
  finding an in-scope gap or an out-of-scope observation?").
- **Out of scope is not "never."** An amendment can bring something in, and the trail shows when and why.

Template sections: product definition, in scope (features, technical), out of scope (excluded,
future phases), boundary rules, scope decisions log, amendments, revision history.

### 2.4 Planning

Driven by the **plan orchestrator**; the plan skill only writes files.

**Pre-planning gates**, all mandatory:
1. Scope exists, or stop.
2. Project is onboarded, or run onboarding first.
3. Request is in scope, or ask whether to amend scope; stop if not.
4. A tracker issue exists for the request: use it, pick from several, or create issues and a
   milestone if none exist.

**Parallel milestones.** If other milestones are running in worktrees, the plan maps which files
both will touch, rates each overlap (schema high; router and API client medium; same feature files
low or high), and claims a two-day migration date range so migrations from parallel milestones
never collide. A merge order is recorded.

**The draft plan** classifies every issue (type, surface, size S/M/L, dependencies, test strategy),
then orders them into **waves**: issues within a wave can run in parallel; each wave depends on the
one before it and has a gate (its tests must pass) before the next starts. Dependency order is
always schema → API → UI.

**The plan file** (`.claude/plans/<milestone>.md`) is a machine-readable contract, not just notes:
metadata, a parallel block, waves with each issue's files, tests to write and tests to run, and
done criteria. It is permanent and never deleted.

**Specialist review.** Eight perspectives review the draft, in parallel where they don't overlap:

| Perspective | Catches |
|---|---|
| Backend | Schema impact, API design, auth middleware, route mounting |
| Frontend | Route registration, state, cross-platform, missing UI states |
| Data | Migration safety, backfills, indexes, schema sync |
| Security auditor | Auth gaps, data exposure, input validation, secrets |
| Security engineer | Platform vulnerabilities, OWASP checks, CORS |
| Performance | Query bottlenecks, rendering cost, bundle size, cold starts |
| Designer | Visual consistency, accessibility, responsiveness |
| DevOps | Deployment config, env vars, CI/CD, start commands |

- Any CRITICAL finding forces a revision of the plan file, then a re-review.
- MEDIUM findings become notes in the plan; LOW findings don't block.
- At most 3 revision cycles; after that the user decides.
- Specialists don't invent risks. "Nothing found" is a valid answer.

**Finalize.** Only after review passes is the **workflow state file** created, with
`plan_finalized: complete`. Its existence is the signal that a plan is safe to build against.

### 2.5 Implementation

Driven by the **implement orchestrator**: one agent for all layers, loading policies instead of
spawning a code specialist per layer.

Before starting an issue it checks: plan documentation done in both places; every issue in earlier
waves closed; this issue not already implemented (or resume/reset if half done); the issue's
milestone is not already complete.

**Policies** are the mechanism for stack knowledge. The workflow state records the project's
context (platform, codebase, security, standards, OS). For each value, if a policy file exists it
is loaded as a set of MUST / MUST NOT constraints; if not, nothing is loaded. A policy violation is
treated like a failing test. Policies are additive and written only when a real project needs one.
The original shipped 13 (TypeScript/Hono, Flutter/Dart, React/Next.js, Drizzle/Postgres, migrations,
PostgreSQL, Render, AWS S3, JWT, OAuth, OWASP, performance, accessibility).

Implementation rules: production-ready code only, no stubs, mock data or TODOs; follow repo
conventions; stage specific files; commit with the issue ID. The implement step writes no tests,
no docs and no tracker updates.

### 2.6 Testing

A separate phase, gated on implementation being documented. It follows the plan's test contract:
write the listed tests, run the listed regression tests, run everything mapped to the feature area,
then the full suite. **All must pass.**

Three test types the original required beyond normal coverage:

| Test | Why |
|---|---|
| **Abnormal input** | Nulls, empties, huge and negative values, injection and XSS patterns, malformed JSON. Behavior is documented, not just pass/fail. Feeds the operator gate. |
| **Real import validation** | Every mocked module also gets a test that imports it for real, so mocks can't hide broken imports. |
| **Smoke boot** | The server must actually start. Green tests with a server that won't boot means the tests are wrong. |

Extend existing tests rather than duplicating them; follow the project's existing framework.

### 2.7 Review

The **review orchestrator** runs three reviews in sequence, each informing the next, and combines
them into one report. Any CRITICAL makes the overall result FAIL.

| Review | Checks |
|---|---|
| **Code** | Conventions, imports matching neighbors, security checklist, tests, documentation |
| **UX / journey** | Journey completeness, logical flow, state coverage, edge cases, integration points, regression risk, data flow, accessibility, security baseline, stability baseline |
| **Architecture** | UI↔API, API↔DB, schema↔migration sync, route registration and imports, dependency consistency, env var coverage, type alignment, auth alignment, background jobs, deploy config |

The reviews also produce structured artifacts: edge cases, failure paths, data exposure.

### 2.8 Documentation, after every phase

Two skills, run in this order after plan, implement, test and review:

| Skill | Touches | Writes |
|---|---|---|
| **document-code** | Repo only | Architecture, schema, feature notes, CLAUDE.md, API docs, test coverage index, and the operator artifacts (system flow as built, dependencies, limitations, edge cases, failure paths) |
| **document-plane** | Tracker (Plane) only | Plan summary, completion comment, test results, review findings, triage issues |

Each one is gated on its phase being complete, and the next phase is gated on both.

**Writing standard** for everything a person reads:
- TL;DR of at most 3 bullets first.
- Tables over prose; no prose block over 3 sentences.
- Headers that answer questions.
- One fact per line.
- Tracker comments: one-line summary first, at most 15 lines, no filler.
- Target: an operator scanning at speed gets the picture in 30 seconds.

### 2.9 Triage and the loop

Review findings are triaged by fixed rules ("don't negotiate with yourself about priority"):

| Severity | Means | Becomes |
|---|---|---|
| **CRITICAL** | Feature broken, journey can't complete, data integrity or security risk, crash | Issue in the current milestone; work loops back to planning |
| **MEDIUM** | Works, but rough edges, UX gaps, performance concerns | Issue outside the current milestone |
| **LOW** | Polish, refactors, minor tweaks | Backlog |
| **Out of scope** | Not covered by the scope | Noted only; may prompt a scope amendment |

### 2.10 Close

The last step for a milestone. Every gate here is absolute.

1. **Operator readiness gate**: 24 binary criteria (section 4). One fail blocks; each failure
   becomes a CRITICAL issue and the chain loops back.
2. **Critical findings gate**: zero open critical review issues.
3. **Every phase** of every issue complete, or skipped with a stated reason.
4. **Wave order** intact: a later wave can't be complete while an earlier one isn't.
5. **Parallel merge**, if the milestone ran in a worktree: warn if an earlier sibling hasn't merged
   (advisory, user can proceed), rebase, rerun tests, merge, and leave a note in later siblings'
   plans telling them to rebase.
6. Mark issues done, post the milestone summary, then archive the workflow state.
   Plan files are never touched.

---

## 3. State: what the framework remembered

| File | Lifetime | Holds |
|---|---|---|
| `PROJECT_SCOPE.md` | Permanent, amended | What the project is and isn't |
| `.claude/ptheory.yaml` | Permanent | Onboarded, when, which phases ran |
| `.claude/project-index.yaml` | Permanent, re-generated | Everything discovery found |
| `.claude/plans/<milestone>.md` | Permanent | The plan contract |
| Workflow state `<milestone>.yaml` | Archived at close | Milestone phases, per-issue phases, context for policies, cleanup setting |
| `.claude/artifacts/*.md` | Permanent | Operator handoff evidence |

**Phases tracked per milestone:** plan draft, plan review (with cycle and finding counts), plan
finalized, plan documented (repo, tracker).

**Phases tracked per issue:** implement, implement documented ×2, test, test documented ×2,
review (code, UX, architecture), review documented ×2, close. Each is pending, in progress,
complete, blocked (with reason) or skipped (with reason).

The state file is what made sessions resumable: any new session could read it and continue from
the exact step that was interrupted.

---

## 4. The operator readiness gate

Binary, no partial credit, no negotiation. 23 of 24 is a fail. Verbal explanations don't count:
if it isn't in a file, it doesn't exist. The gate evaluates; it never creates the artifacts itself.

| Section | Criteria |
|---|---|
| **Documentation** (6) | System flow as built; dependency list with versions; edge cases with observed behavior; failure paths with triggers and responses; change log (completion comments on every done issue); limitations, nothing implied |
| **Security** (4) | No hardcoded credentials; every auth path documented, even unimplemented ones; data exposure risks with scope and severity; no permissions beyond core function |
| **Stability** (4) | All tests pass and the core journey runs; abnormal input tested and documented; dependencies match actual imports; plan + state + code = reproducible build |
| **Operational awareness** (4) | Resource estimates; infrastructure implications; monitoring needs; scaling concerns. Surfaced, not solved: the operator solves them |
| **Handoff packet** (6) | Discrete system flow; list of modules and services; dependencies with versions; operational concerns list; initial production requirements; usage observations from testing |

---

## 5. Every decision the original made

These are the rules as the original wrote them, grouped by kind. This catalog is the input to the
new framework's decision engine.

| Kind | Rule | Where it lived |
|---|---|---|
| Routing | No scope → create scope; not onboarded → onboard; running → resume; stuck → resume or reset | entry |
| Routing | After each documentation step, name the next step; criticals → re-plan, otherwise → close | document-plane |
| Prerequisite | Scope must exist before planning | scope, plan |
| Prerequisite | Project must be onboarded before planning | plan |
| Prerequisite | Request must be in scope, or scope amended | plan |
| Prerequisite | Workflow state is only created after specialist review passes | plan, plan orchestrator |
| Prerequisite | Plan documented in repo and tracker before any implementation | implement |
| Prerequisite | All earlier waves closed before an issue in a later wave starts | implement |
| Prerequisite | Implementation documented in both places before testing | test |
| Prerequisite | Tests passing before review | implement orchestrator |
| Prerequisite | Each documentation step only after its phase completes | document-code, document-plane |
| Hard stop | No work added to a completed milestone; gaps become new issues elsewhere | plan, implement |
| Hard stop | Don't re-run a completed phase | implement, test |
| Hard stop | No milestone closes with an open critical | close |
| Hard stop | No milestone closes with a pending or blocked phase | close |
| Hard stop | No milestone closes unless all 24 gate criteria pass | close, operator gate |
| Hard stop | Later wave complete while earlier isn't = chain violation | close |
| Hard stop | Rebase conflict or failing tests after rebase blocks the merge | close |
| Human sign-off | Creating tracker projects, milestones or issues during onboarding | onboarding |
| Human sign-off | Production push: confirm before starting and again before pushing | push-production |
| Human sign-off | Production merge conflicts are never auto-resolved | push-production |
| Human sign-off | Out-of-order parallel merge: warn, user decides | close |
| Human sign-off | Plan still critical after 3 revisions: user decides | plan orchestrator |
| Human sign-off | Removing a dirty worktree | onboarding |
| Safety | Scan staged changes for secrets before commit; scan the branch diff before PR | commit, pr, sanitize-check |
| Safety | Never `git add .`, never stage env or credential files, never `--no-verify` | commit, implement |
| Safety | No PR with failing tests, no PR from main | pr |
| Safety | No deploy with failing tests or without validation | deploy |
| Safety | Never force-push to production or to a PR without approval | deploy, pr, push-* |
| Safety | Dirty working tree blocks a push | push-staging, push-production |
| Safety | Loaded policies are hard constraints; a violation is a failing test | implement |
| Triage | CRITICAL / MEDIUM / LOW by fixed criteria; out-of-scope findings become notes only | document-plane |
| Loop | Any critical finding sends the milestone back to planning | review, document-plane, orchestrator |
| Loop | Plan review loops until no criticals, at most 3 times | plan orchestrator |
| Loop | Any operator gate failure becomes a critical and loops back | operator gate |

---

## 6. Roles

| Group | Agents |
|---|---|
| **Drivers** | Onboarding agent, plan orchestrator, implement orchestrator, review orchestrator, repo orchestrator (git pushes) |
| **Plan specialists** | Backend, frontend, data, security auditor, security engineer, performance, designer, DevOps |
| **Workers** | Code reviewer, test engineer, debugger, refactor agent, documentation writer, SEO specialist |

The pattern: drivers own the order of things, specialists give an opinion and never change the
plan themselves, workers do one kind of job.

---

## 7. Supporting skills

| Group | Skills |
|---|---|
| Core chain | entry, scope, plan, implement, test, verify, close, operator gate |
| Documentation | document-code, document-plane, document-review (rewrite docs to the standard), flow-diagram (one tree format for all flows) |
| Review | code-review, review-ux, review-architecture |
| Onboarding | onboard (session catch-up), onboard-project, onboard-discover, onboard-migrate, onboard-customize |
| Git and release | commit, pr, sanitize-check, push-staging, push-production, deploy, resolve-worktree, cleanup-branches, status |
| Database | db, migrate |
| Debugging | debug: reproduce, isolate, fix, test, document |
| Dispatch | code-dispatch: a fixed prompt for handing code work to a fresh agent (read the repo's rules first, stay on the working branch, plan → implement → test → update tracker per issue) |
| Framework upkeep | ptheory-update (document a framework change as it happens), ptheory-sync (find and fix drift between the framework and its spec) |
| Stack-specific | dart, flutter, plus the 13 policies |
| Specific to one setup | Plane tracker, Linear→Plane migration, Render, AWS S3, Cloudflare, remote control |
| Design | design, design-system, ui-styling, ui-ux-pro-max, brand, banner-design, slides |

**Verify** deserves a note: it audits a finished milestone for honesty. Plan waves marked complete
must match done issues; every test file on disk must be in the coverage index and vice versa; every
done issue needs a completion comment with real test numbers.

---

## 8. What was general and what was specific

| General method | Specific to the original's environment |
|---|---|
| Scope with amendments | Plane as the only tracker, baked into planning, docs and close |
| Chain with one job per step | Render, AWS, Cloudflare, one product's domains |
| Plan file as contract, waves | TypeScript/Hono, Flutter, Drizzle as the assumed stack |
| Workflow state and resume | Staging/main branch model |
| Specialist plan review | Coordination folders for a particular multi-agent setup |
| Three-lens review, fixed triage | |
| Operator readiness gate | |
| Policies as composable constraints | |
| Writing standard for humans | |

---

## 9. Weak points in the original

Observed in the original itself, not borrowed from anywhere.

| Weak point | Effect |
|---|---|
| **Every rule was prose inside a skill.** | A skill that wasn't run, or was misread, meant a rule that silently didn't apply. |
| **The same rule was written in several places.** | Secret scanning, "tests must pass" and gate checks appear in 3–4 skills each and could drift apart. |
| **Deciding and doing were mixed.** | Each skill checked its own permission to start. Changing a rule meant editing the instructions for doing the work. |
| **Heavy documentation ceremony.** | Eight documentation steps per issue (two after each of four phases), each a gate. |
| **Referenced files were missing.** | The workflow schema and system spec are referred to throughout but not in the repo. |
| **Naming drift.** | `document-linear` and `document-plane` both appear; plan review is described as 7 and as 8 specialists; a step number repeats in close. |
| **State lived in the home folder.** | Workflow state under `~/.claude/` rather than in the repo, so it didn't travel with the project. |
| **Tracker and stack were wired in.** | The method couldn't run on a project without Plane or outside the assumed stack without edits. |

The first three are the problem the new framework's decision engine exists to solve.
