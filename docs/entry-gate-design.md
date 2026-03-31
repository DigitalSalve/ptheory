# Design: Entry Gate — Linear Issue Existence Check

**Issue:** KEE-193
**Status:** Design complete — implementation in KEE-200 (update /plan with entry gate + workflow state creation)

---

## Purpose

Every request that enters the skill chain must have a Linear issue before work begins. The entry gate ensures nothing is worked on without being tracked, and nothing is tracked without being checked against scope.

---

## Where It Lives

**Decision:** The entry gate is shared logic in Step 0 of `/plan`. It is NOT its own skill (yet). If it grows complex enough (e.g., parsing Slack messages, email triage), it can be extracted into `/intake` later.

**Why Step 0 of /plan:** Every chain execution starts with /plan (or goes through /plan if the request is new). The entry gate is the first thing /plan does before any planning work.

---

## Entry Gate Process

```
REQUEST (user ask, bug report, feature idea, Slack message, etc.)
  │
  ▼
STEP 0a: /scope read
  │ Load the project scope document
  │ If no scope document exists → STOP. Scope must be defined first.
  │
  ▼
STEP 0b: Is this request in scope?
  │ Check the request against the current scope (original + amendments)
  │ → IN SCOPE: proceed to Step 0c
  │ → OUT OF SCOPE: tell the user. Ask if scope should be amended.
  │   → User says amend → /scope amend, then proceed
  │   → User says no → STOP. Do not create an issue.
  │
  ▼
STEP 0c: Search Linear for an existing issue
  │ Search by: title keywords, description content, labels
  │ Search within: the project associated with this workflow
  │
  ├─► ISSUE FOUND (single match):
  │     Read it for context (title, description, milestone, status, comments)
  │     → If status is Done/Cancelled → warn user, ask if they want to reopen or create new
  │     → If status is active → proceed with this issue
  │
  ├─► MULTIPLE ISSUES FOUND:
  │     List them with titles, statuses, and milestones
  │     Ask the user which one to work on (or if this is a new issue)
  │
  └─► NO ISSUE FOUND:
        Determine the scope of work:
        │
        ├─► SINGLE TASK:
        │     Create one issue in Linear
        │     Assign to appropriate milestone (ask user if unclear)
        │     Proceed to /plan (or /implement if simple enough)
        │
        └─► MULTI-TASK:
              Create multiple issues in Linear
              Assign to milestone (existing or create new)
              Proceed to /plan to organize into waves
```

---

## Issue Creation Defaults

When the entry gate creates a new issue:

| Field | Default |
|-------|---------|
| Title | Derived from the request (prefixed with [FEATURE], [BUG], or [IMPROVEMENT]) |
| Team | The team associated with the project |
| Project | The project from the workflow context |
| Milestone | Ask user if no obvious fit; suggest the active milestone |
| Status | Todo |
| Priority | Medium (user can override) |
| Labels | Inherit project labels; add L1/L2/L3 if PTheory |
| Description | Summary of the request + acceptance criteria if discernible |

---

## Edge Cases

### 1. Request is ambiguous — could be multiple issues
Ask the user to clarify before creating anything. Don't guess.

### 2. No milestone fits the request
Options in order:
1. Is there an active milestone this fits into? → assign there
2. Is there a planned milestone this belongs to? → assign there
3. Neither → create without milestone binding (Backlog). Suggest creating a milestone if the work is substantial.

### 3. Issue exists but in a different project
Show the user the existing issue and ask: work on the existing one, or create a new issue in the current project?

### 4. Request is explicitly out of scope
Do not create an issue. Tell the user it's out of scope per the scope document. If they disagree, the path is /scope amend → then create the issue.

### 5. Request is a bug in existing functionality
Create with [BUG] prefix. If the bug is in a completed milestone's feature, create the issue outside that milestone (don't reopen completed milestones). Assign to the current active milestone or leave unbound.

### 6. User says "just do it" / doesn't want to go through the gate
The gate is not optional. The chain requires a Linear issue to track work. The minimum viable path is: create issue → implement → close. But the issue must exist.

---

## What the Entry Gate Does NOT Do

- Does not plan (that's /plan's job after the gate)
- Does not implement (that's /implement's job)
- Does not check code or run tests
- Does not update documentation
- Does not create workflow state files (that's /plan's job)

The entry gate's ONLY job is: ensure a Linear issue exists and is in scope.

---

## Implementation Location

When KEE-200 (update /plan) is implemented, the entry gate becomes Step 0 of the /plan SKILL.md:

```
Step 0: Entry Gate
  0a. /scope read — load scope, block if missing
  0b. Check request against scope
  0c. Search Linear for existing issue
  0d. If no issue → create one
  0e. Read issue context → proceed to Step 1 (planning)
```

---

## Future: /intake Skill Extraction

If the entry gate needs to handle:
- Parsing Slack messages into issue descriptions
- Email triage into issues
- Automated bug report ingestion
- Multi-project routing

Then extract it from /plan Step 0 into a dedicated `/intake` skill. Until then, it lives in /plan.
