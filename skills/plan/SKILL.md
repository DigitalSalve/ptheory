---
name: plan
description: |
  Reviews a Plane module or set of issues and produces a structured implementation plan.
  Use when starting a new milestone, reviewing a backlog, or when the user says "plan", "/plan",
  "what's next", "review the milestone", or "create an implementation plan".
  Also use when the user asks to prioritize issues or plan a sprint.
  Part of the PTheory skill chain — creates both the plan file and the workflow state file.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Plan Skill

Reviews Plane modules/issues and produces implementation plans. **Writes a plan file** that `/implement` reads and enforces, **and creates the workflow state file** that the entire chain tracks progress in.

**This is a global skill.** Works with any project that uses Plane.

## When to Use

- Starting a new milestone
- User says "/plan", "plan the milestone", "what's next", "review issues"
- Before beginning any multi-issue implementation effort
- First skill in the PTheory chain (after /scope and /onboard-project gates)

## Process

### Step 0: Pre-Planning Gates

**These gates run before any planning work. They are mandatory.**

#### Step 0a: Scope Check

1. Run `/scope read` logic — locate and load the project scope document
2. If no scope document exists → **STOP**. Tell the user: "No project scope found. Run `/scope` to define scope before planning."
3. If scope exists → load it as context for the rest of the planning process

#### Step 0b: Onboarding Check

1. Check for an active workflow state file at `~/.claude/workflows/`
2. If a workflow state file exists → read its `onboarded` field
3. If `onboarded` is `false` or missing → run `/onboard-project` logic. Wait for it to complete.
4. If no workflow state file exists → onboarding status is unknown. Check if the project has docs/, CLAUDE.md, .claude/agents/. If missing key infrastructure → run `/onboard-project`.
5. If onboarded → proceed

#### Step 0c: Entry Gate — Plane Issue Check

1. Understand the user's request (what do they want to build/fix/improve?)
2. Check the request against the loaded scope:
   - **In scope** → proceed
   - **Out of scope** → tell the user. Ask if scope should be amended via `/scope amend`. If no → **STOP**.
3. Search Plane for an existing issue matching the request
4. **If issue found (single match):** Read it for context (title, description, milestone, status, comments). If Done/Cancelled → warn user, ask if reopen or create new.
5. **If multiple issues found:** List them. Ask the user which one to work on.
6. **If no issue found:** Determine scope of work:
   - **Single task** → create one issue, assign to appropriate milestone
   - **Multi-task** → create multiple issues, assign to milestone
   - **No appropriate milestone** → create one
7. Proceed to Step 1 with the issue(s) and milestone context

### Step 0d: Parallel Milestone Detection

**When this milestone will run in a worktree alongside other milestones, detect and plan for it.**

1. **Check for active worktrees:** `ls .claude/worktrees/ 2>/dev/null` and `git worktree list`
2. **Check for other active plan files:** `ls .claude/plans/*.md` — read the `status: active` ones
3. **If other active plans exist:**
   - Read each active plan's `metadata` block (milestone name, issues) and `parallel` block if present
   - Read each active plan's file lists (the `files:` field under each issue) to build a shared-file map
   - Identify **overlap zones** — files that both this milestone and another active milestone will touch
4. **Classify overlaps:**

| Overlap type | Risk | Mitigation |
|---|---|---|
| `backend/db/schema.ts` | HIGH | Both add tables/columns — use different migration date prefixes, append-only |
| `backend/index.ts` | MEDIUM | Both mount routers — append new mounts at end, don't reorganize |
| `lib/services/api/api_service.dart` | MEDIUM | Both add methods — append at end of class |
| `lib/router/app_router.dart` | MEDIUM | Both add routes — append, don't restructure |
| Same feature files | LOW if different functions | Note in plan |
| Same feature files | HIGH if same functions | Flag — may need sequencing, not parallelism |

5. **Claim a migration date range** — check other active plans for their claimed ranges, pick the next available:
   - Each milestone gets a 2-day range (e.g., M13: `20260326-20260327`, M14: `20260328-20260329`)
   - Record in the plan file's `parallel` block
6. **If no other active plans or worktrees:** Skip this step. Single-milestone execution, no parallel concerns.

### Step 1: Gather Context

1. **Read the milestone** from Plane — get all issues, their priorities, descriptions, acceptance criteria
2. **Read the codebase** — understand current state of affected files
3. **Check dependencies** — which issues depend on others (schema before API, API before UI)
4. **Check project docs** — read CLAUDE.md, AI.md, or equivalent for project conventions
5. **Check TEST_COVERAGE.md** — understand existing test coverage for affected feature areas

### Step 2: Classify Each Issue

For each issue, determine:

| Field | Description |
|-------|-------------|
| **Type** | Bug / Feature / Improvement |
| **Surface** | Backend / Frontend / Marketing / Schema / Config |
| **Complexity** | S (< 1 file), M (2-5 files), L (5+ files) |
| **Dependencies** | Which issues must complete first |
| **Test strategy** | What tests are needed (unit, widget, route, integration) |

### Step 3: Create Dependency-Ordered Waves

Organize issues into waves. Each wave has:
- Issues that can run in parallel within the wave
- A prerequisite: all previous waves must be complete
- A gate: tests for the wave must pass before the next wave starts

### Step 4: Define Test Strategy Per Wave

For each wave, identify:
1. **New test files needed** — what test files to create
2. **Existing tests to run** — from TEST_COVERAGE.md feature area mapping
3. **Regression risk** — what existing functionality might break

### Step 5: Write the Plan File

**MANDATORY:** Write the plan to a file the `/implement` skill can read.

**Location:** `.claude/plans/MILESTONE_SLUG.md` (e.g., `.claude/plans/m3-polls-news-home.md`)

Create the `.claude/plans/` directory if it doesn't exist.

**File format — this is a machine-readable contract, not just documentation:**

```markdown
# Plan: [Milestone Name]

## metadata
- milestone: [Plane module name]
- milestone_id: [Plane module ID]
- project: [Project name]
- project_id: [Plane project ID]
- issues: [comma-separated issue IDs]
- created: [YYYY-MM-DD]
- status: active

## parallel
- worktree: [worktree path, or "none" if running on staging directly]
- branch: [branch name]
- migration_date_range: [YYYYMMDD-YYYYMMDD, or "none"]
- merge_order: [1|2|3|... — lower merges first, or "none"]
- active_siblings: [comma-separated milestone slugs running in parallel, or "none"]
- shared_files:
  - [file path]: [risk level] — [mitigation note]
- rebase_before_test: [true if siblings exist, false otherwise]

## waves

### wave-1: [Wave Name]
- status: pending
- depends_on: none
- gate: [what must be true before wave 2 starts]

#### issues
- ISSUE-XX: [title]
  - surface: backend|flutter|schema|config
  - files: [list of files to change]
  - tests_to_write: [list of test files to create]
  - tests_to_run: [existing tests from TEST_COVERAGE.md]

### wave-2: [Wave Name]
- status: pending
- depends_on: wave-1
- gate: [what must be true before wave 3 starts]

#### issues
- ISSUE-XX: [title]
  - surface: backend|flutter|schema|config
  - files: [list of files to change]
  - tests_to_write: [list of test files to create]
  - tests_to_run: [existing tests from TEST_COVERAGE.md]

## done_criteria
- all_tests_pass: false
- test_coverage_updated: false
- linear_comments_posted: false
- milestone_summary_posted: false
```

### Step 5b: STOP — Return to Plan Orchestrator

**After writing the draft plan file, STOP HERE.** Do not create the workflow state file yet.

The `plan-orchestrator` agent controls what happens next:
1. It launches the `plan-review` agent to run 7 specialist perspectives against the draft
2. If specialists find CRITICAL issues → the orchestrator calls this skill again to revise the plan
3. Only after review passes does the orchestrator call Step 6 to finalize

**If called directly (not via plan-orchestrator):** Run Steps 0-5, then tell the user:
"Draft plan written. Run the plan-orchestrator agent to review and finalize, or proceed to Step 6 manually."

### Step 6: Finalize — Create the Workflow State File

**ONLY RUN THIS STEP AFTER THE PLAN-ORCHESTRATOR CONFIRMS REVIEW PASSED.**

This step is called by the plan-orchestrator after specialist review is clean (zero CRITICAL findings).

**Location:** `~/.claude/workflows/MILESTONE_SLUG.yaml`

**Schema:** Per `~/.claude/workflows/SCHEMA.md`

1. If a workflow state file already exists for this milestone → read it, don't overwrite. Only update if issues changed.
2. If no workflow state file exists → create one:
   - Set `workflow`, `milestone`, `milestone_id`, `project`, `project_id` from Plane
   - Set `scope_document` to the path found by /scope read
   - Set `onboarded: true` (we passed the onboarding gate)
   - Set `created` and `updated` to today
   - Set `cleanup: archive` (default)
   - Detect `context` from project files (render.yaml → platform: render, package.json → codebase, etc.)
   - Set `milestone_phases.plan: complete`
   - Set `milestone_phases.plan_doc_code: pending`
   - Set `milestone_phases.plan_doc_plane: pending`
   - For each issue, create the `issues.{ID}` block with title, wave number, and all phases as `pending`

### Step 7: Create Todos

Create a TodoWrite list tracking each wave. Wave N+1 todos should be pending until Wave N is complete.

### Step 8: Summarize to User

Show the plan summary in chat. Tell the user:
- Plan file location
- Workflow state file location
- Next step: "Run `/document-code` to verify the plan file, then `/document-plane` to post the plan to Plane"

## Important Rules

- **Never start implementing during planning** — this skill is research and planning only
- **Always write the plan file** — `/implement` reads it to enforce wave ordering
- **Always create the workflow state file** — the entire chain depends on it
- **Always check for dependencies** — schema before API, API before UI
- **Always include test strategy** — no issue plan without a test plan
- **Always include existing regression tests** — from TEST_COVERAGE.md feature area mapping
- **Check for project-specific completion standards** — look for Issue Completion Standard or equivalent
- **Documentation is NOT this skill's job** — /document-code and /document-plane handle it. Plan just creates the files.

### Completed Milestone Rule — Hard gate

- **Never plan work against a completed milestone.** If you discover gaps, missing tests, or improvements in a milestone that is already 100% Done, the new work goes in a **new issue** assigned to a current or new milestone.
- When auditing a completed milestone, any gaps found must be tracked as new issues referencing the original. Do not reopen or attribute new work to completed milestones.
- If there is no appropriate active milestone for gap work, create one (e.g., "QA / Test Debt", "Post-M5 Gaps").

## Plan File Lifecycle

1. `/plan` (Steps 0-5) creates the **draft** plan file with all waves `status: pending`
2. `plan-orchestrator` launches `plan-review` agent → 7 specialist perspectives review the draft
3. CRITICAL findings → `plan-orchestrator` calls `/plan` to revise → re-review (max 3 cycles)
4. Review passes → `plan-orchestrator` calls `/plan` Step 6 → creates workflow state with `plan: complete`
5. `plan-orchestrator` runs `/document-code` → plan artifacts to repo docs
6. `plan-orchestrator` runs `/document-plane` → plan summary + review findings to Plane
7. `implement-orchestrator` reads both files, checks prerequisites before starting each issue
8. Plan file stays in `.claude/plans/` for reference — **never deleted**
9. Workflow state file is archived by `/close` — plan file is not
