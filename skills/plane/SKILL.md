---
name: plane
description: |
  Generalized Plane project management interactions.
  Use when the user says "/plane", "check plane", "update the issue",
  "create an issue", "what's in the backlog", or any Plane project management task.
  Covers reading issues, updating status, posting comments, managing milestones.
allowed-tools: Read, Glob, Grep, Bash
---

# Plane Skill

Manage Plane issues, milestones, and project status. Project-specific skills (if they exist) take priority for templates and conventions.

## Common Operations

### Read milestone issues
1. List issues filtered by milestone
2. Group by status (Backlog, In Progress, Done)
3. Summarize: total, by priority, by type

### Update issue status
- **Starting work:** Mark In Progress
- **Completing work:** Post completion comment FIRST, then mark Done
- **Blocked:** Add comment explaining the blocker

### Post completion comment

Every Done issue must have this structure:

```markdown
## Completion Summary

**Fix:** [What and why — 1-2 sentences]

**Files changed:**
- `path/to/file` — description

**Commit:** `abc1234`

**Verification:**
- Step-by-step verification

**Test results:**
- `test/file` — X/X passed
```

### Create an issue

Include:
- Clear title with type prefix: `[BUG]`, `[FEATURE]`, `[IMPROVEMENT]`
- Summary section
- Location section (files and routes affected)
- Current vs Expected behavior (for bugs)
- Acceptance criteria (for features)
- Priority and labels

### Bulk operations

When processing multiple issues:
1. Fetch all at once
2. Process in parallel where possible
3. Report results as a table

## Rules

- Never mark Done without a completion comment
- Never mark Done without tests passing
- Always include file paths and commit hashes in completion comments
- Always set priority and labels on new issues
- Check for project-specific Plane skills/templates before creating entries
