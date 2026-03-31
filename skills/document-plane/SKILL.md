---
name: document-plane
description: |
  Updates Plane after a chain phase completes. Touches Plane only — never code files.
  Runs after /plan, /implement, /test, and /review as part of the PTheory skill chain.
  Includes triage logic after /review: creates issues at CRITICAL/MEDIUM/LOW priority levels.
  Use when the user says "/document-plane", or automatically invoked by the chain after each phase.
  This is a global skill — works with any project that uses Plane.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Document Plane Skill

Updates Plane after a chain phase completes. This skill touches **Plane only** — never code files. Its counterpart `/document-code` handles repo documentation.

**This is a global skill.** It works with any project that uses Plane for tracking.

## When to Use

- Automatically after each chain phase: plan, implement, test, review
- User says "/document-plane" or "update Plane"
- Chain enforcement: the workflow state file gates the next phase on this being complete

## Process

### Step 0: Read Workflow State

1. Find the active workflow state file at `~/.claude/workflows/`
2. Determine which phase just completed (look for the most recent `complete` phase whose `_doc_plane` is still `pending`)
3. Read the milestone_id, project, and issue ID from the workflow state
4. If no workflow state file exists, ask the user what to update in Plane

### Step 1: Gate Check

1. Read the prerequisite phase for this doc_plane phase
2. If the prerequisite is NOT `complete` → **STOP**
3. If the prerequisite IS `complete` → proceed

### Step 2: Mark In Progress

Update the workflow state file: set the relevant `_doc_plane` phase to `in_progress`. Update the `updated` date.

### Step 3: Do the Plane Work

What to post depends on which phase just completed.

**OUTPUT FORMAT RULES (all phases):**
- Lead with a one-line summary. The first line should tell a human what happened without reading further.
- Tables over prose. Structured data goes in tables, not paragraphs.
- Max 15 lines per comment. If longer, link to an artifact file instead of inlining.
- No filler. No "This was done because..." — just what, where, result.
- Humans read these. Write for a person scanning at speed, not an AI parsing for completeness.

---

#### After /plan

```markdown
Plan: [milestone name] — [N] issues, [N] waves. Plan file: `.claude/plans/{slug}.md`

| Wave | Issues | Gate |
|------|--------|------|
| 1 | KEE-101, KEE-102 | Tests pass |
| 2 | KEE-103 | Wave 1 closed |

Context: [platform], [codebase]. [N] policies loaded.
```

---

#### After /implement

```markdown
Implemented: [one-line what and why]

| File | Change |
|------|--------|
| `path/to/file` | [what changed] |

Commit: `abc1234`. Verify: [one-line how to check it works]
```

---

#### After /test

```markdown
Tests: [N] written, [N] passed, [N] failed.

| Test File | Coverage | Result |
|-----------|----------|--------|
| `path/to/test` | [what it tests] | pass |

Gaps: [none / list]
```

---

#### After /review

**Post findings:**

```markdown
Review: [PASS / PASS WITH FINDINGS / FAIL]

| # | Finding | Priority | Issue |
|---|---------|----------|-------|
| 1 | [short description] | CRITICAL | KEE-XXX |
| 2 | [short description] | MEDIUM | KEE-YYY |
| 3 | [short description] | PASS | — |

Next: [/plan (critical found) / /close]
```

**Triage — create issues for non-PASS findings:**

| Priority | Status | Milestone |
|----------|--------|-----------|
| CRITICAL | Todo | Inside current |
| MEDIUM | Todo | Outside current |
| LOW | Backlog | None |

**Triage issue format (keep short):**
```markdown
Title: [REVIEW] {finding — max 10 words}

Source: {issue ID}, {milestone}
Finding: {2-3 sentences max}
Fix: {what needs to change}
```

---

### Step 4: Mark Complete

Update the workflow state file: set the relevant `_doc_plane` phase to `complete`. Update the `updated` date.

### Step 5: Report and Next Step

Tell the user:
- What was posted to Plane (with links if possible)
- If review phase: how many issues were created at each priority level
- Next step in the chain:
  - After plan_doc_plane: "Ready for /implement on Wave 1 issues"
  - After implement_doc_plane: "Ready for /test"
  - After test_doc_plane: "Ready for /review"
  - After review_doc_plane with CRITICAL: "Critical findings found. Run /plan to re-plan the milestone."
  - After review_doc_plane without CRITICAL: "Ready for /close"

---

## Triage Rules (Review Phase Only)

### What Determines Priority

| Priority | Criteria | Examples |
|----------|----------|---------|
| **CRITICAL** | Blocks the feature from working. User can't complete the journey. Data integrity risk. Security gap. Crashes. | Missing error handling that causes 500s. Auth bypass. Data not saved. Broken navigation. |
| **MEDIUM** | Feature works but has rough edges. UX gaps. Performance concerns. | Missing empty states. Inconsistent styling. No loading indicators. Validation that doesn't crash but produces bad data. |
| **LOW** | Nice-to-have. Polish. Code quality. | Refactoring suggestions. Minor UX tweaks. Additional edge case handling. Better error messages. |

### Loop-Back Rule

If ANY critical issues are created during triage → the chain loops back to `/plan` to re-plan the current milestone with the new critical issues included.

If only medium/low issues (or none) → proceed to `/close`.

### Scope Check

Before creating triage issues, check each finding against the project scope:
- **In-scope finding** → create the issue as described above
- **Out-of-scope finding** → note it in the review comment as "out of scope per [scope document]". Do NOT create an issue. If the finding suggests scope should change, recommend `/scope amend`.

---

## Rules

1. **Plane only.** This skill never touches code files. That's /document-code's job.
2. **Gate enforcement is mandatory.** If the prerequisite phase isn't complete, stop.
3. **Update the workflow state file.** Every run must mark its phase in_progress at start and complete at end.
4. **Triage is deterministic.** CRITICAL/MEDIUM/LOW rules are defined above. Don't negotiate with yourself about priority.
5. **Scope-check findings.** Out-of-scope findings are noted but don't become issues.
6. **Link everything.** When creating triage issues, reference the source issue and milestone.

---

## Phase-to-Doc-Plane Mapping

| Workflow Phase | Doc Plane Phase | What It Posts |
|---------------|-----------------|---------------|
| `plan` | `plan_doc_plane` | Plan summary to milestone |
| `implement` | `implement_doc_plane` | Completion comment on issue |
| `test` | `test_doc_plane` | Test results on issue |
| `review` | `review_doc_plane` | Findings + triage issues |
