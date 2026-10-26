---
name: scope
description: |
  Manages a project's scope as a living document with formal amendments. The scope is a required
  PTheory input — the chain reads it at the start for context and may amend it at the end.
  Use when the user says "/scope", "check scope", "is this in scope", "amend scope",
  "update scope", "define scope", or when starting any PTheory chain execution.
  Also invoked automatically by /plan (Step 0) and /review (findings classification).
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Scope Skill

Manages the project scope document — a definitive article that defines what a project does and does not include, with a formal amendment process for tracking changes over time.

**This is a global skill.** It works with any project that has a scope document. The scope document itself is project-specific; this skill is not.

## Two Modes

### /scope read
Load the current project scope and make it available as context for the chain.

### /scope amend
Append a dated amendment to the scope document. The original scope is never edited.

---

## When to Use

- **Chain start:** /plan Step 0a calls `/scope read` before any planning
- **Review phase:** /review calls `/scope read` to classify findings as in-scope vs out-of-scope
- **After review:** If review found something that should change scope, call `/scope amend`
- **User request:** User says "/scope", "is X in scope?", "add Y to scope", "define scope"
- **New project:** When PTheory is applied to a project that has no scope document yet

---

## /scope read — Process

### Step 1: Locate the Scope Document

Search for the scope document in this order:
1. Check the workflow state file's `scope_document` field (if a workflow is active)
2. Check common locations:
   - `docs/02-canon/PROJECT_SCOPE.md`
   - `PROJECT_SCOPE.md` (repo root)
   - `docs/PROJECT_SCOPE.md`
3. Search for files matching `*SCOPE*` or `*scope*` in the repo

### Step 2: Handle Missing Scope

If no scope document is found:
- **STOP the chain.** Do not proceed with planning or implementation.
- Tell the user: "No project scope document found. PTheory requires a defined scope before work can begin."
- Offer to create one using the template (see Step 5 below).

### Step 3: Read and Parse

Read the scope document. Extract:
- **Original scope** — what the project does, doesn't do, platforms, boundaries
- **Amendments** — all dated changes (if any)
- **Current scope** — original + amendments = what's true now

### Step 4: Return Scope Context

Make the scope available for the calling skill:
- For /plan: "Is this request in scope?" → YES (proceed) or NO (flag to user)
- For /review: "Is this finding an in-scope gap or an out-of-scope observation?"

### Step 5: Create Scope Document (if user approves)

If no scope document exists and the user wants to create one, use this template:

```markdown
# Project Scope: [Project Name]

**Created:** YYYY-MM-DD
**Last Amended:** YYYY-MM-DD

---

## Product Definition

[What this project is — one paragraph. What it does, who it serves, what platforms.]

---

## In Scope

### Core Features

| Feature Area | Description | Status |
|-------------|-------------|--------|
| [Feature] | [What it includes] | [In scope] |

### Technical Scope

| Area | Description | Status |
|------|-------------|--------|
| [Tech area] | [What it includes] | [In scope] |

---

## Out of Scope

### Explicitly Excluded

| Item | Reason |
|------|--------|
| [Feature/area] | [Why it's excluded] |

### Future Phases (Not in Initial Scope)

| Feature | Status | Notes |
|---------|--------|-------|
| [Feature] | Future phase | [Context] |

---

## Scope Boundaries

### What Defines "In Scope"
[Rules for determining if something is in scope]

### What Defines "Out of Scope"
[Rules for determining if something is out of scope]

---

## Scope Decisions

| Question | Decision | Date | Notes |
|---------|----------|------|-------|
| [Question that was asked] | [Decision made] | YYYY-MM-DD | [Context] |

---

## Amendments

[Amendments are appended here. The original scope above is never edited.]

---

## Revision History

| Date | Change | Source |
|------|--------|--------|
| YYYY-MM-DD | Initial scope document created | [Who/what created it] |
```

---

## /scope amend — Process

### Step 1: Confirm the Change

Before amending, verify:
- What is being added, removed, or modified?
- Why? (Review finding, user request, discovery, external requirement)
- Is this a scope expansion or contraction?

### Step 2: Append the Amendment

Add a new amendment entry to the **Amendments** section of the scope document. **Never edit the Original Scope section.**

```markdown
### Amendment [N] — YYYY-MM-DD

- **Change:** [Added/Removed/Modified] [component/feature/boundary]
- **Reason:** [Why this change was made]
- **Source:** [Review finding KEE-XXX / user request / discovery / external requirement]
- **Impact:** [What this means for current and future work]
```

### Step 3: Update the Revision History

Add an entry to the Revision History table.

### Step 4: Update the Current Scope Section (if present)

If the scope document has a "Current Scope (derived)" section, regenerate it to reflect original + all amendments.

### Step 5: Update the Workflow State File

If a workflow is active, update its `updated` date.

---

## Integration Points

| Skill | How it uses /scope |
|-------|--------------------|
| /plan (Step 0) | Calls `/scope read` to check if request is in scope before creating issues |
| /review | Calls `/scope read` to classify findings as in-scope gap vs out-of-scope observation |
| /review → /document-linear | If scope was amended during review, notes it in the Plane update |
| Workflow state file | `scope_document` field references the path to the scope document |

---

## Rules

1. **Scope is required.** The chain blocks if no scope document exists.
2. **Original scope is immutable.** Amendments are appended, never edited into the original.
3. **Amendments are traceable.** Every change has a date, reason, source, and impact.
4. **Scope is per-project.** Each project has its own scope document. This skill is global.
5. **Out-of-scope is not "never."** Items can be moved in-scope via amendment. The amendment trail shows when and why.
