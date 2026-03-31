# Design: Skill Workflow Chain

## Problem

Skills are stateless. Each conversation starts fresh. Documentation steps are buried inside other skills and easy to skip. There's no enforced order or way to know where in the lifecycle we are. We rely on memory to do things properly, and memory is unreliable across sessions.

## Goal

Create a deterministic, file-based workflow chain that:
- Tracks which phase each issue is in via a temporary state file
- Enforces phase ordering (can't implement before plan is documented)
- Separates code documentation from Linear documentation into distinct skills
- Includes a QA/journey review phase (not just code review) before closing
- Cleans up the state file after itself (archive by default, plan files are permanent)

---

## The Chain

```
REQUEST (direct or indirect — user ask, bug report, Slack message, etc.)
  ↓
/scope read (load project scope — BLOCKS if no scope document exists)
  ↓
ONBOARDING GATE: Is this project onboarded? (workflow state `onboarded` field)
  → YES: proceed
  → NO/MISSING: /onboard-project (create docs hierarchy, agents, project skills,
                  Linear project, coordination dirs, verify tools) → set onboarded: true
  ↓
ENTRY GATE: Is there a Linear issue for this?
  → YES: Read it for context, check against scope, proceed to /plan or /implement
  → NO:  Is this in scope? If yes → /plan creates issue(s). If no → flag as out of scope.
  ↓
/plan
  → /document-code    (verify plan file exists in .claude/plans/)
  → /document-linear  (plan posted to milestone/issues in Linear;
                        create issues if none exist, assign to milestone)
  ↓
/implement [ISSUE-ID]
  → Load implementation context (policies/constraints — if they exist, enforce; if not, proceed)
  → /document-code    (architecture, schema, feature docs updated)
  → /document-linear  (completion comment posted on issue)
  ↓
/test
  → /document-code    (TEST_COVERAGE.md updated)
  → /document-linear  (test results posted to issue)
  ↓
/review (QA/journey review)
  → Classify findings against scope (in-scope gap vs out-of-scope observation)
  → /scope amend      (if review found scope should change — append dated amendment)
  → /document-code    (any doc gaps the review found)
  → /document-linear  (findings posted + TRIAGE:
      CRITICAL → new issue, Todo status, INSIDE current milestone
      MEDIUM   → new issue, Todo status, OUTSIDE current milestone
      LOW      → new issue, Backlog status, NO milestone binding)
  ↓
  If critical issues were created → LOOP BACK to /plan (re-plan current milestone)
  If only medium/low or none     → proceed to /close
  ↓
/close
  → verify all phases complete, zero critical findings open
  → archive workflow state file (default)
```

---

## Workflow State File

**Location:** `.claude/workflows/MILESTONE_SLUG.yaml`
**Archive location:** `.claude/workflows/archive/`
**Cleanup default:** `archive`

> **Important:** The plan file in `.claude/plans/` is NEVER deleted or archived.
> It is a permanent artifact. Only the workflow state file is subject to cleanup.

### Schema

```yaml
workflow: m6-admin-polls
milestone: M6 - Admin Polls
milestone_id: <linear-milestone-id>
project: MyGOP
created: 2026-03-22
updated: 2026-03-22
cleanup: archive  # archive | delete | keep

# Implementation context — which policy modules apply to this workflow
# If a policy file exists for a value, it is a HARD constraint (not a suggestion).
# If no policy file exists, implement proceeds with default behavior (no constraint).
context:
  platform: render             # render | aws | vercel | bare-metal | ...
  os: linux                    # linux | macos | windows
  codebase:                    # list of codebase convention modules
    - typescript-hono
    - flutter-dart
  security: []                 # future: soc2, hipaa, pci, pii
  standards: []                # future: owasp, wcag-aa

# Milestone-level phases (run once for the whole milestone)
milestone_phases:
  plan: complete            # /plan ran and produced the plan file
  plan_doc_code: complete   # /document-code confirmed plan file exists
  plan_doc_linear: complete # /document-linear posted plan to milestone

# Per-issue tracking
issues:
  MG-101:
    title: Add poll creation endpoint
    wave: 1
    phases:
      implement: pending             # /implement
      implement_doc_code: pending    # /document-code after implement
      implement_doc_linear: pending  # /document-linear after implement
      test: pending                  # /test
      test_doc_code: pending         # /document-code after test
      test_doc_linear: pending       # /document-linear after test
      review: pending                # /review (QA/journey)
      review_doc_code: pending       # /document-code after review
      review_doc_linear: pending     # /document-linear after review
      close: pending                 # mark Done in Linear

  MG-102:
    title: Poll list UI widget
    wave: 2
    phases:
      # same structure as above
```

### Phase Values

| Value | Meaning |
|-------|---------|
| `pending` | Not started |
| `in_progress` | Skill is actively working on this |
| `complete` | Done |
| `blocked` | Can't proceed (include reason) |
| `skipped` | Explicitly skipped with justification |

### State Rules

1. A phase can only move to `in_progress` if its prerequisite phase is `complete`
2. Wave ordering still applies — wave 2 issues can't start until wave 1 is fully closed
3. If a conversation crashes mid-phase (`in_progress` stuck), the next conversation can detect this and offer to resume or reset
4. Only the final `/close` skill reads the `cleanup` setting and acts on it

### Prerequisite Chain Per Issue

```
implement
  → requires: milestone plan_doc_code + plan_doc_linear complete
implement_doc_code
  → requires: implement complete
implement_doc_linear
  → requires: implement complete
test
  → requires: implement_doc_code + implement_doc_linear complete
test_doc_code
  → requires: test complete
test_doc_linear
  → requires: test complete
review
  → requires: test_doc_code + test_doc_linear complete
review_doc_code
  → requires: review complete
review_doc_linear
  → requires: review complete
close
  → requires: review_doc_code + review_doc_linear complete
```

---

## /scope Skill

**Purpose:** Manages the project scope as a living document with formal amendments. The scope is a required PTheory input — the chain reads it at the start and may amend it at the end.

**Two modes:**

### /scope read
- Load the project scope document (original + all amendments = current state)
- Used by the entry gate to check if a request is in scope
- Used by /review to classify findings as in-scope gaps vs out-of-scope observations
- **BLOCKS if no scope document exists** — scope must be defined before the chain can run

### /scope amend
- Append a dated amendment to the scope document
- Each amendment: date, what changed (added/removed/modified), why, who requested
- The original scope is never edited — amendments are appended
- Original + amendments = current scope at any point in time

**Scope document structure:**

```markdown
# Project Scope: [Project Name]
Created: YYYY-MM-DD

## Original Scope
[What the project does, doesn't do, platforms, boundaries, geographic scope,
 feature boundaries, technical boundaries, out-of-scope items]

## Amendments

### Amendment 1 — YYYY-MM-DD
- **Change:** [Added/Removed/Modified] [component/boundary]
- **Reason:** [Why this change was made]
- **Source:** [Review finding / user request / discovery]

### Amendment 2 — YYYY-MM-DD
- **Change:** ...
- **Reason:** ...
- **Source:** ...

## Current Scope (derived)
[Computed from original + all amendments — this section is regenerated, not manually edited]
```

**Scope document location:** Project-specific. For repo-based projects: `docs/02-canon/PROJECT_SCOPE.md` or equivalent. The workflow state file references the scope document path.

---

## Entry Gate

**Purpose:** Every request — direct or indirect — must have a Linear issue before work begins. This is the top of the chain. The entry gate also checks scope.

**Process:**

1. /scope read — load the project scope. If no scope exists, STOP.
2. Receive request (user ask, bug report, Slack message, feature idea)
3. Check request against scope — is this in scope?
4. Search Linear for an existing issue that matches
3. **If issue exists:** Read it for context. Check its milestone. Proceed to `/plan` (if multi-issue) or `/implement` (if single issue already planned).
4. **If no issue exists:** Determine scope:
   - Single task → create one issue, assign to appropriate milestone
   - Multi-task → create multiple issues, assign to milestone, proceed to `/plan`
   - No appropriate milestone → create one

**Who runs this:** Any skill can be the entry point. The entry gate logic lives in every skill's Step 0 as a shared check. Alternatively, this becomes its own `/intake` skill (future).

---

## Implementation Context (Policy Layer)

**Purpose:** Composable constraint modules that the `/implement` skill loads based on the workflow's `context` block. These define HOW code must be written for a given platform, OS, codebase, or security mandate.

**Core rule: If exists, enforce. If not, proceed.**

- If a policy file exists for a context value → it is a HARD constraint. The implement skill MUST follow it. Violations are treated like failing tests.
- If no policy file exists → the implement skill proceeds with its default behavior. No error, no warning, no blocker.
- Policies are additive and composable. A project can load `render + typescript-hono + soc2 + pii` simultaneously.

**File structure (future — created incrementally as needed):**

```
~/.claude/skills/implement/
  policies/
    platforms/
      render.md              # Cold starts, health checks, env var patterns, build commands
      aws.md                 # IAM least-privilege, Lambda patterns, S3 access
    os/
      linux.md               # File permissions, systemd, cron patterns
      macos.md               # Keychain, launchd, notarization
    security/
      soc2.md                # Audit logging, access control, encryption at rest
      hipaa.md               # PHI handling, BAA requirements, minimum necessary
      pci.md                 # Card data isolation, tokenization, TLS requirements
      pii.md                 # Data minimization, encryption, retention policies
    codebase/
      typescript-hono.md     # ESM imports, Zod validation, middleware chain, error handling
      flutter-dart.md        # Riverpod patterns, GoRouter guards, Dio interceptors
    standards/
      owasp.md               # OWASP Top 10 checks
      wcag-aa.md             # Accessibility requirements
```

**How `/implement` loads policies:**

```
Step 4b: Load Implementation Context

1. Read the workflow state file's `context` block
2. For each category (platform, os, codebase, security, standards):
   - For each value in the category:
     - Check: does ~/.claude/skills/implement/policies/{category}/{value}.md exist?
     - YES → Read it. These are MUST/MUST NOT constraints for all code in this session.
     - NO  → Skip. No constraint applied. Default behavior.
3. Collect all loaded policies into the active constraint set
4. During implementation, every code decision is checked against active constraints
5. If a constraint is violated, stop and fix before proceeding (same as a failing test)
```

**Policy file format (TBD):** Not defined yet. Will be discovered when writing the first policy. Expected structure: MUST rules, MUST NOT rules, SHOULD rules (with justification), and code examples.

**Degradation:** Zero policy files loaded = current behavior exactly. The system works without any policies. Policies are purely additive constraints.

---

## Review Triage Logic

**Purpose:** After `/review` identifies gaps, findings are triaged into Linear issues at three priority levels. This creates the feedback loop that drives the next planning cycle.

**Triage rules:**

| Priority | Where in Linear | Milestone Binding | Triggers Re-plan? |
|----------|----------------|-------------------|-------------------|
| **CRITICAL** | New issue, **Todo** status | INSIDE current milestone | YES — /plan loops |
| **MEDIUM** | New issue, **Todo** status | OUTSIDE current milestone (or next milestone) | No |
| **LOW** | New issue, **Backlog** status | NO milestone binding | No |

**What determines priority:**

- **CRITICAL:** Blocks the feature from working. User can't complete the journey. Data integrity risk. Security gap. Missing error handling that causes crashes.
- **MEDIUM:** Feature works but has rough edges. Missing empty states, inconsistent UX, performance concern, missing validation that doesn't crash but produces bad data.
- **LOW:** Nice-to-have. Code cleanup, minor UX polish, additional edge case handling, refactoring suggestions.

**Loop-back rule:**
- If `/review` → `/document-linear` creates ANY critical issues → the chain loops back to `/plan` to re-plan the current milestone with the new issues included.
- If only medium/low issues (or none) → proceed to `/close`.

**Close gate:** `/close` verifies zero critical findings are open in the current milestone before allowing closure.

---

## New Skills

### /document-code

**Purpose:** Update codebase documentation artifacts after a phase completes.

**Reads:** Workflow state file to determine which phase just completed.

**What it touches:** Files in the repo only. Never touches Linear.

**Per-phase behavior:**

| After Phase | What to Document |
|-------------|-----------------|
| plan | Verify plan file exists in `.claude/plans/`. No other action needed. |
| implement | Architecture docs, schema docs, feature notes, CLAUDE.md if project structure changed |
| test | TEST_COVERAGE.md — file list, issue map, feature area map, known gaps |
| review | Any documentation gaps the review identified |

**Gate behavior:**
1. Read workflow state file
2. Confirm the prerequisite phase is `complete`
3. If not complete → stop, tell user what's missing
4. Do the documentation work
5. Mark its phase `complete` in the workflow file

---

### /document-linear

**Purpose:** Update Linear with status, comments, and new issues after a phase completes.

**Reads:** Workflow state file to determine which phase just completed.

**What it touches:** Linear only. Never touches code files.

**Per-phase behavior:**

| After Phase | What to Document |
|-------------|-----------------|
| plan | Post plan summary to milestone. Update issue descriptions if wave assignments changed. |
| implement | Post completion comment on issue (files changed, commit ref, verification steps) |
| test | Post test results on issue (which tests ran, pass/fail, coverage numbers) |
| review | Post review findings. Create new issues for any gaps discovered (in active milestone, not completed ones). |

**Gate behavior:** Same as /document-code — reads workflow file, checks prerequisite, does work, marks complete.

---

### /review (NEW — QA/Journey Review)

**Purpose:** Validate the implementation from a user journey and application logic perspective. This is NOT code review. This is "does the feature actually work end-to-end and make sense from a user's perspective?"

**Checks:**
- **User journey completeness** — can a user do the thing from start to finish?
- **Logical flow** — do the screens/steps make sense in order?
- **Gap detection** — did we miss an edge case, error state, empty state, or loading state?
- **Integration points** — does this feature play nicely with existing features?
- **Regression risk** — did we break any adjacent user flows?
- **Accessibility** — can all users access this feature?
- **Data flow** — does data move correctly from UI → API → DB and back?

**Output:**
- List of findings (pass / fail / warning per check)
- Triage determination for each finding (CRITICAL / MEDIUM / LOW)
- Hands off to `/document-linear` which creates the triaged issues in Linear
- Recommendation: loop back to /plan (if critical findings) OR proceed to /close

**Sub-skills (future):** This skill is likely to grow sub-skills over time:
- Journey mapping
- State coverage audit (empty, loading, error, success, partial)
- Cross-feature integration check
- Accessibility audit

**The current `/review` skill** gets renamed to `/code-review` and continues to handle code-level conventions, security, and test coverage checks.

---

### /close

**Purpose:** Final skill in the chain. Closes the workflow cycle for a milestone.

**Process:**
1. Read the workflow state file
2. **Critical findings gate:** Check Linear for any CRITICAL priority issues in the current milestone that are not Done. If any exist → **STOP**, tell the user these must be resolved first, recommend running `/plan` to re-plan.
3. Verify ALL issues have ALL phases marked `complete`
4. If any are not complete → list what's remaining and **stop**
5. If all complete and zero critical findings open:
   - Post milestone completion summary to Linear
   - Handle cleanup per the `cleanup` setting:
     - `archive` → move workflow file to `.claude/workflows/archive/`
     - `delete` → remove workflow file
     - `keep` → leave in place
   - **Plan file in `.claude/plans/` is NEVER touched** regardless of cleanup setting

---

## Modifications to Existing Skills

### /plan (update)
- After writing the plan file, **also creates the workflow state file** at `.claude/workflows/`
- Populates issue list, waves, and all phases as `pending`
- Marks `plan: complete` in `milestone_phases`
- **Removes any built-in documentation steps** — that's now `/document-code` and `/document-linear`'s job
- Keeps the completed milestone rule (from recent update)

### /implement (update)
- Reads **workflow state file** in addition to the plan file
- Checks prerequisite phases before starting (plan + both doc phases must be `complete`)
- **NEW Step 4b: Load Implementation Context** — reads workflow `context` block, loads policy files from `~/.claude/skills/implement/policies/`. If policy exists → enforce as hard constraint. If not → proceed with default behavior.
- **Removes Step 9** (documentation) — moves to `/document-code`
- **Removes Step 11** (Linear comment) — moves to `/document-linear`
- **Removes the "mark Done" step** — moves to `/close`
- After implementing, marks `implement: complete` in workflow file
- Keeps the completed milestone rule (from recent update)

### /test (separate phase)
- Currently runs as Steps 6-7 inside `/implement`
- Becomes its own skill/phase that reads the workflow file
- Writes and runs tests
- Marks `test: complete` when all tests pass

### /code-review (renamed from current /review)
- Same content as the current `/review` — code conventions, security, test coverage
- Can be invoked within `/implement` or standalone
- Does NOT update the workflow state file (it's a quality gate, not a lifecycle phase)

---

## File Structure

```
.claude/
  workflows/
    m6-admin-polls.yaml          # active workflow state file
    archive/
      m5-user-profiles.yaml      # completed + archived
  plans/
    m6-admin-polls.md            # permanent plan artifact (NEVER deleted)
    m5-user-profiles.md          # permanent (NEVER deleted)
  skills/
    scope/SKILL.md               # NEW — project scope read/amend
    plan/SKILL.md                # UPDATED — creates workflow state file, reads scope
    implement/SKILL.md           # UPDATED — reads state, removes doc steps
    test/SKILL.md                # NEW or UPDATED — separate test phase
    review/SKILL.md              # NEW — QA/journey review, references scope
    code-review/SKILL.md         # RENAMED from current review/
    document-code/SKILL.md       # NEW — code documentation
    document-linear/SKILL.md     # NEW — Linear documentation
    close/SKILL.md               # NEW — lifecycle closer + cleanup
```

---

## Open Questions

### 1. Auto-invoke vs manual trigger for documentation skills
- **RESOLVED:** Hybrid — gate enforcement in the state file prevents skipping, each skill outputs "Next: run /document-code" when it finishes. The workflow state file is the enforcement mechanism, not skill-to-skill coupling.

### 2. Should /test be fully split from /implement?
- **RESOLVED:** Yes, split. The chain requires it for proper documentation gating. `/implement` only writes code. `/test` handles all testing.

### 3. Issues that don't need all phases?
- Config-only changes might not need `/test` or `/review`
- The `skipped` phase value with a justification handles this
- Every issue goes through the chain, but phases can be explicitly skipped

### 4. Crash recovery
- If `in_progress` is stuck, the next conversation should detect it
- **Recommendation:** Show the user what's stuck and ask — resume, reset to pending, or skip
- Don't auto-reset, as the work may have partially completed

### 5. Multiple issues in parallel within a wave
- Within a wave, issues can be implemented in parallel
- Each issue tracks its own phases independently
- `/close` requires ALL issues in ALL waves to be fully phased before closing

### 6. Policy file format (NEW)
- The implementation context policy files (`~/.claude/skills/implement/policies/`) need a format
- **Recommendation:** Don't define it yet. Write the first policy file (likely `render.md`) and let the format emerge from real use. Then standardize after 2-3 policies exist.
- Expected structure: MUST rules, MUST NOT rules, SHOULD rules, code examples

### 7. Entry gate as its own skill? (NEW)
- The "is there a Linear issue?" check is needed at the top of every chain run
- Could be a shared check in every skill's Step 0, or a dedicated `/intake` skill
- **Recommendation:** Start as shared logic in Step 0 of `/plan`. If it grows complex enough to warrant its own skill, extract it later.

---

## Implementation Sequence

### Phase A: Foundation (workflow state + directory structure)
1. Create `.claude/workflows/` and `.claude/workflows/archive/` directories
2. Create `~/.claude/skills/implement/policies/` directory structure (empty — ready for future policy files)
3. Define the workflow state file YAML schema (this doc — DONE)

### Phase B: New skills (create before modifying existing)
4. Create `/document-code` skill
5. Create `/document-linear` skill (with triage logic for review phase)
6. Create `/review` skill (QA/journey review, replaces current `/review` purpose)
7. Create `/close` skill (with critical findings gate)

### Phase C: Modify existing skills
8. Rename current `/review` → `/code-review`
9. Update `/plan` — add entry gate, create workflow state file, remove doc steps
10. Update `/implement` — add workflow state reading, add Step 4b (load implementation context), remove doc/Linear/Done steps
11. Update `/test` — extract from implement into separate phase, read/write workflow state

### Phase D: Validate
12. Test the full chain end-to-end on a real milestone
13. Write first policy file (likely `platforms/render.md`) to validate the policy loading mechanism

### Phase E: Iterate
14. Write additional policy files as needed (project-driven, not speculative)
15. Extract `/intake` skill if the entry gate logic grows complex enough
