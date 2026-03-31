# Workflow State YAML Schema

**Version:** 0.1.0 (Exploration — not yet contracted)
**Location:** `~/.claude/workflows/SCHEMA.md`
**Instances:** `~/.claude/workflows/{MILESTONE_SLUG}.yaml`
**Archive:** `~/.claude/workflows/archive/`

---

## Purpose

The workflow state file is the single source of truth for where a milestone is in the skill chain. Every skill reads it to know what phase it's in, does its work, then marks the phase complete. It persists across sessions — if a conversation crashes, the next session reads the file and knows exactly where to resume.

**This is NOT the plan file.** The plan file (`.claude/plans/`) says WHAT to build. The workflow state file says WHERE WE ARE in building it.

| File | Purpose | Lifecycle |
|------|---------|-----------|
| `.claude/plans/SLUG.md` | What to build, waves, dependencies | Permanent — never deleted |
| `.claude/workflows/SLUG.yaml` | Phase tracking per issue | Active → archived when milestone closes |

---

## Schema Definition

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow` | string | Yes | Slug identifier (kebab-case, matches filename) |
| `milestone` | string | Yes | Human-readable milestone name |
| `milestone_id` | string | Yes | Linear milestone ID |
| `project` | string | Yes | Project name |
| `project_id` | string | No | Linear project ID |
| `scope_document` | string | Yes | Path to the project scope document (e.g., `docs/02-canon/PROJECT_SCOPE.md`) |
| `created` | date | Yes | YYYY-MM-DD when workflow was created |
| `updated` | date | Yes | YYYY-MM-DD last modified (updated by any skill that writes) |
| `onboarded` | boolean | Yes | `true` if project has been onboarded to PTheory via `/onboard-project`. `false` or missing = chain blocks after /scope read and runs /onboard-project before proceeding. |
| `cleanup` | enum | Yes | `archive` \| `delete` \| `keep` — what `/close` does with this file |

### Context Block

Implementation context — which policy modules apply to this workflow. Each value maps to a file in `~/.claude/skills/implement/policies/{category}/{value}.md`.

**Rule:** If a policy file exists for a value, it is a HARD constraint. If no policy file exists, `/implement` proceeds with default behavior.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `context.platform` | string | No | `render` \| `aws` \| `vercel` \| `bare-metal` \| ... |
| `context.os` | string | No | `linux` \| `macos` \| `windows` |
| `context.codebase` | list[string] | No | List of codebase modules: `typescript-hono`, `flutter-dart`, etc. |
| `context.security` | list[string] | No | Security mandates: `soc2`, `hipaa`, `pci`, `pii` |
| `context.standards` | list[string] | No | Standards: `owasp`, `wcag-aa` |

### Milestone Phases

Phases that run once for the entire milestone (before per-issue work begins).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `milestone_phases.plan_draft` | phase_value | Yes | `/plan` Steps 0-5 ran and produced the draft plan file |
| `milestone_phases.plan_review` | phase_value | Yes | `plan-review` agent ran specialist perspectives against draft |
| `milestone_phases.plan_review_cycles` | integer | No | Number of review-revise cycles (0 = clean first pass). Default 0. |
| `milestone_phases.plan_review_findings` | integer | No | Total findings from final review pass. |
| `milestone_phases.plan_finalized` | phase_value | Yes | `plan-orchestrator` confirmed review clean, workflow state created |
| `milestone_phases.plan_doc_code` | phase_value | Yes | `/document-code` confirmed plan file exists |
| `milestone_phases.plan_doc_linear` | phase_value | Yes | `/document-linear` posted plan to milestone in Linear |

### Issues Block

Per-issue tracking. Each key is the Linear issue identifier (e.g., `KEE-101`).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issues.{ID}.title` | string | Yes | Issue title (for human readability) |
| `issues.{ID}.wave` | integer | Yes | Wave number (1-based). Wave ordering is enforced. |
| `issues.{ID}.phases` | object | Yes | Phase tracking (see Per-Issue Phases below) |

### Per-Issue Phases

Every issue tracks these phases. All start as `pending`.

| Phase | Description | Prerequisite |
|-------|-------------|-------------|
| `implement` | `/implement` wrote the code | milestone `plan_finalized` + `plan_doc_code` + `plan_doc_linear` complete |
| `implement_doc_code` | `/document-code` updated repo docs after implement | `implement` complete |
| `implement_doc_linear` | `/document-linear` posted completion comment | `implement` complete |
| `test` | `/test` wrote and ran tests | `implement_doc_code` + `implement_doc_linear` complete |
| `test_doc_code` | `/document-code` updated TEST_COVERAGE.md | `test` complete |
| `test_doc_linear` | `/document-linear` posted test results | `test` complete |
| `review` | `review-orchestrator` ran all 3 reviews (code + UX + architecture) | `test_doc_code` + `test_doc_linear` complete |
| `review_code` | `/code-review` completed | `test_doc_code` + `test_doc_linear` complete |
| `review_ux` | `/review-ux` completed | `review_code` complete |
| `review_architecture` | `/review-architecture` completed | `review_ux` complete |
| `review_doc_code` | `/document-code` updated docs from review findings | `review` complete |
| `review_doc_linear` | `/document-linear` posted findings + triaged issues | `review` complete |
| `close` | Issue marked Done in Linear | `review_doc_code` + `review_doc_linear` complete |

---

## Phase Values

| Value | Meaning |
|-------|---------|
| `pending` | Not started |
| `in_progress` | Skill is actively working on this phase |
| `complete` | Phase finished successfully |
| `blocked` | Can't proceed — include `blocked_reason` field |
| `skipped` | Explicitly skipped — include `skipped_reason` field |

### Blocked and Skipped Extensions

When a phase is `blocked` or `skipped`, an adjacent reason field is required:

```yaml
phases:
  test: blocked
  test_blocked_reason: "Waiting for API endpoint from KEE-103"

  review: skipped
  review_skipped_reason: "Config-only change, no user journey to review"
```

---

## State Rules

1. **Prerequisite enforcement:** A phase can only move to `in_progress` if ALL prerequisite phases are `complete`.
2. **Wave ordering:** Wave N+1 issues cannot start until ALL wave N issues have `close: complete`.
3. **Crash recovery:** If `in_progress` is stuck from a previous session, the next session detects it and asks the user: resume, reset to pending, or skip.
4. **Cleanup:** Only `/close` reads and acts on the `cleanup` setting. Plan files are NEVER touched.
5. **Updated field:** Any skill that writes to the workflow file updates the `updated` date.

---

## Prerequisite Chain (Visual)

```
MILESTONE PHASES (run once, driven by plan-orchestrator):
  plan_draft → plan_review (loop until clean, max 3 cycles) → plan_finalized
    → plan_doc_code → plan_doc_linear
                                    ↓
PER-ISSUE PHASES (run per issue, per wave, driven by implement-orchestrator):
  implement
    → implement_doc_code  ─┐
    → implement_doc_linear ─┤
                            ↓
  test
    → test_doc_code  ─┐
    → test_doc_linear ─┤
                       ↓
  review (review-orchestrator runs all 3):
    → review_code → review_ux → review_architecture
    → review_doc_code  ─┐
    → review_doc_linear ─┤
                         ↓
  close
```

Notes:
- `_doc_code` and `_doc_linear` for each phase can run in parallel. Both must be complete before the next phase starts.
- `plan_review` loops: if CRITICAL findings, plan is revised and re-reviewed (max 3 cycles).
- `review` is the overall status. `review_code`, `review_ux`, `review_architecture` are sub-phases.
- `implement-orchestrator` checks `plan_finalized: complete` before starting any issue.

---

## File Naming

- **Active:** `~/.claude/workflows/{milestone-slug}.yaml`
- **Archived:** `~/.claude/workflows/archive/{milestone-slug}.yaml`
- **Slug format:** kebab-case derived from milestone name (e.g., "E1 — Foundation" → `e1-foundation`)

---

## Amendment Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-22 | Initial schema design | Workflow chain design session |
| 2026-03-23 | Added scope_document field, blocked/skipped reason fields | /scope skill design, crash recovery clarity |
| 2026-03-23 | Split plan phase into plan_draft/plan_review/plan_finalized; added plan_review_cycles and plan_review_findings; added review sub-phases (review_code, review_ux, review_architecture); implement now requires plan_finalized | Plan-orchestrator review loop, review-orchestrator 3-review chain |
