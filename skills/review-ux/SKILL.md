---
name: review-ux
description: |
  UX/journey review — validates implementation from a user journey and application logic perspective.
  This is NOT code review (/code-review) and NOT architecture review (/review-architecture).
  This skill asks: "does the feature work end-to-end and make sense from a user's perspective?"
  Use when the user says "/review-ux", "UX review", "QA check", "does this work for users",
  or automatically invoked by the /review agent after /test completes.
  Produces structured findings with CRITICAL/MEDIUM/LOW triage that /document-linear turns into issues.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Review UX Skill (User Journey Review)

Validates implementation from a user journey and application logic perspective. Produces structured findings that `/document-linear` turns into triaged Linear issues.

**This is NOT code review** (/code-review) **and NOT architecture review** (/review-architecture). This skill asks: "Does the feature actually work end-to-end and make sense from a user's perspective?"

**This is a global skill.** Works with any project.

## When to Use

- After /test completes (chain position: after test_doc_linear)
- User says "/review-ux", "UX review", "QA this", "does this work for users"
- Automatically invoked by the /review orchestrator agent
- Before closing a milestone — final UX validation pass

## Process

### Step 0: Read Context

1. Read the active workflow state file at `~/.claude/workflows/`
2. Identify which issue is being reviewed
3. Read the plan file for the milestone to understand intended behavior
4. Read the issue description and acceptance criteria from Linear
5. Read the project scope document (via /scope read logic)

### Step 1: Gate Check

1. Check that `test_doc_code` and `test_doc_linear` are both `complete` for this issue
2. If not → **STOP**. Tests and their documentation must be done before review.

### Step 2: Mark In Progress

Update the workflow state file: set `review: in_progress`. Update `updated` date.

### Step 3: Run Review Checks

For each check, produce a finding: **PASS**, **WARNING**, or **FAIL** with details.

#### Check 1: User Journey Completeness
- Can a user complete the intended flow from start to finish?
- Walk through the feature as a user would — entry point → steps → outcome
- Does every step have a clear path forward?
- Can the user get back / cancel / undo if needed?

#### Check 2: Logical Flow
- Do the screens/steps/actions make sense in order?
- Is the information shown at each step sufficient for the user to proceed?
- Are transitions between steps smooth and predictable?

#### Check 3: State Coverage
- **Empty state:** What happens when there's no data?
- **Loading state:** Is there a loading indicator where async operations occur?
- **Error state:** What happens when something fails? Is the error message helpful?
- **Success state:** Is success clearly communicated?
- **Partial state:** What about partial data? Lists with 1 item? Long text?

#### Check 4: Edge Cases
- What happens with invalid input?
- What happens at boundary values (0, negative, very large)?
- What happens with special characters, empty strings, null values?

#### Check 5: Integration Points
- Does this feature work correctly with existing features?
- Does navigation to/from this feature work?
- Are shared components (auth, navigation, notifications) still working?

#### Check 6: Regression Risk
- Did this change break any adjacent user flows?
- Are there screens that share code with the changed files?

#### Check 7: Data Flow
- Does data move correctly from UI → API → DB and back?
- Are create/read/update/delete operations all working?
- Is data refreshed/invalidated correctly after mutations?

#### Check 8: Accessibility (if applicable)
- Can the feature be used with keyboard navigation?
- Are interactive elements properly labeled?
- Is color contrast sufficient?

#### Check 9: Security Baseline (Operator Gate criteria)
- **Credentials:** Are there any hardcoded credentials, API keys, tokens, or secrets in the code? (must be externalized)
- **Authentication paths:** Are all auth paths identified and documented? (even if not fully implemented)
- **Data exposure:** Are there data exposure risks? Document each with scope and severity.
- **Access scope:** Does the system request or use elevated permissions beyond what's needed for core function?

#### Check 10: Stability Baseline (Operator Gate criteria)
- **Core function:** Does the feature complete its core function without crashing under normal conditions?
- **Abnormal input:** Have abnormal/unexpected inputs been tested? (cross-reference with /test results)
- **Undisclosed dependencies:** Are there any dependencies not listed in the dependency manifest?

### Step 3b: Produce Structured Artifact Outputs

In addition to the findings table, produce these discrete artifacts for the Operator Gate:

**Edge Case Catalog** — for `/document-code` to write to `.claude/artifacts/edge-cases.md`:
```markdown
| # | Edge Case | Input/Condition | Observed Behavior | Severity |
|---|-----------|----------------|-------------------|----------|
| 1 | [description] | [what triggers it] | [what happens] | [high/medium/low] |
```

**Failure Path Registry** — for `/document-code` to write to `.claude/artifacts/failure-paths.md`:
```markdown
| # | Failure Scenario | Trigger Condition | Expected System Response | Verified? |
|---|-----------------|-------------------|-------------------------|-----------|
| 1 | [description] | [what causes it] | [how system should respond] | [yes/no] |
```

**Data Exposure Assessment** — for `/document-code` to write to `.claude/artifacts/data-exposure.md`:
```markdown
| # | Risk | Scope | Severity | Mitigation |
|---|------|-------|----------|------------|
| 1 | [description] | [what data, where exposed] | [high/medium/low] | [current or needed] |
```

These artifacts are consumed by `/document-code` (which writes them to disk) and evaluated by `/operator-gate` at milestone close.

### Step 4: Classify Findings Against Scope

For each finding that is not PASS:
1. Read the project scope document
2. **In-scope findings** → proceed to triage (CRITICAL/MEDIUM/LOW)
3. **Out-of-scope findings** → note as "out of scope". If it suggests scope should change, recommend `/scope amend`.

### Step 5: Triage Findings

| Priority | Criteria |
|----------|----------|
| **CRITICAL** | Blocks the feature. User can't complete journey. Data integrity risk. Security gap. Crashes. |
| **MEDIUM** | Feature works but rough edges. Missing empty states, inconsistent UX, performance concerns. |
| **LOW** | Nice-to-have. Polish, cleanup, minor UX tweaks. |

### Step 6: Mark Complete

Update the workflow state file: set `review: complete`. Update `updated` date.

### Step 7: Produce Output

```markdown
## Review Findings: {Issue ID} — {Issue Title}

**Overall:** PASS | PASS WITH FINDINGS | FAIL
**Date:** YYYY-MM-DD
**Scope document:** {path}

### Findings

| # | Check | Finding | Priority | In Scope? |
|---|-------|---------|----------|-----------|
| 1 | Journey | [description] | CRITICAL | Yes |
| 2 | States | [description] | MEDIUM | Yes |
| 3 | Data Flow | [pass] | PASS | — |

### Scope Amendments Recommended
- [None / list]

### Recommendation
- CRITICAL findings → Loop back to /plan
- Only MEDIUM/LOW → Proceed to /close
- All PASS → Proceed to /close
```

### Step 8: Next Step

- "Run `/document-code` then `/document-linear` to post findings and create triage issues"
- If scope amendments recommended, suggest `/scope amend` first

---

## Rules

1. **This is QA, not code review.** Don't check code style or naming. That's /code-review.
2. **Scope-check everything.** Out-of-scope findings are noted but not triaged.
3. **Don't create issues directly.** /document-linear does that from your findings.
4. **Gate enforcement is mandatory.** Tests must be done before review.
5. **Be thorough but practical.** Skip checks that don't apply, but document why.
6. **Update the workflow state file.** Mark in_progress at start, complete at end.
