---
name: close
description: |
  Final skill in the PTheory chain. Closes the workflow cycle for a milestone.
  Verifies all phases complete, checks for open critical findings, posts milestone summary to Plane,
  and archives the workflow state file.
  Use when the user says "/close", "close the milestone", "are we done", "wrap up",
  or automatically invoked after /review + /document-plane complete with no critical findings.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Close Skill

Final skill in the PTheory chain. Closes the workflow cycle for a milestone after verifying everything is complete.

**This is a global skill.** Works with any project that uses the PTheory workflow chain.

## When to Use

- After /review → /document-code → /document-plane complete with no critical findings
- User says "/close", "close the milestone", "wrap up", "are we done"
- When all issues in a milestone have all phases marked complete

## Process

### Step 1: Read Workflow State

1. Find the active workflow state file at `~/.claude/workflows/`
2. Read all issue phases and milestone phases
3. If no workflow state file exists → **STOP**. Nothing to close.

### Step 2: Operator Readiness Gate

**This gate CANNOT be bypassed.**

Run `/operator-gate` — the Stage 5 Non-Negotiable Acceptance Criteria evaluation.

1. `/operator-gate` evaluates all 24 criteria (documentation, security, stability, operational awareness, handoff packet)
2. If ANY criteria FAIL → **STOP**. Deficiencies are created as CRITICAL issues. Chain loops back to /plan.
3. If ALL criteria PASS → proceed to Step 3.

This is the contract boundary. Nothing crosses from exploration to production without passing all 24 criteria.

### Step 3: Critical Findings Gate

**This gate CANNOT be bypassed.**

1. Read the milestone_id from the workflow state
2. Search Plane for issues in this milestone with:
   - Title containing `[REVIEW]` (created by triage)
   - Priority: Urgent (CRITICAL findings)
   - Status: NOT Done and NOT Cancelled
3. If ANY critical issues are open → **STOP**

```
CRITICAL FINDINGS OPEN — Cannot close milestone.

Open critical issues:
- KEE-XXX: [title] (status: [status])
- KEE-YYY: [title] (status: [status])

These must be resolved before the milestone can close.
Recommendation: Run /plan to re-plan the milestone with these critical issues.
```

### Step 3: Verify All Phases Complete

Check every issue in the workflow state file:

1. For each issue, verify ALL phases are either `complete` or `skipped` (with reason)
2. If any phase is `pending`, `in_progress`, or `blocked` → **STOP**

```
INCOMPLETE PHASES — Cannot close milestone.

Issues with incomplete phases:
- KEE-101:
  - review_doc_plane: pending
  - close: pending
- KEE-102:
  - test: blocked (reason: waiting for API endpoint)

Resolve these before closing.
```

### Step 4: Verify Wave Ordering

All waves must be fully complete:
1. Wave 1 issues: all phases complete/skipped
2. Wave 2 issues: all phases complete/skipped
3. ... and so on

If a later wave is complete but an earlier wave isn't → **STOP**. This indicates a chain violation.

### Step 5: Parallel Milestone Merge Gate

**If this milestone was developed in a worktree (parallel execution), handle the merge to staging.**

1. **Check plan file for `parallel` block:**
   - Read `.claude/plans/MILESTONE_SLUG.md`
   - If `parallel.worktree` is "none" → skip to Step 5b (not a parallel milestone)
   - If `parallel.worktree` exists → this is a parallel milestone, continue

2. **Check merge order:**
   - Read `parallel.merge_order` from the plan file
   - Read `parallel.active_siblings` to get other parallel milestone slugs
   - For each sibling with a LOWER merge_order:
     - Check if their plan file status is still `active` (not yet merged)
     - If an earlier-order sibling is still active → **WARN** (do not block, but inform):
       ```
       WARNING: M{X} (merge_order: {N}) has not merged yet. This milestone has merge_order: {M}.
       Merging out of order increases conflict risk. Recommended: wait for M{X} to merge first.
       Proceed anyway? [y/N]
       ```
     - If all earlier siblings are complete or merged → proceed

3. **Rebase onto staging:**
   ```bash
   git fetch origin staging
   git rebase origin/staging
   ```
   - If conflicts → show them, resolve (prefer incoming for additive changes like new tables/routes)
   - If rebase fails → **STOP**. Report conflicts. User must resolve manually.

4. **Run tests after rebase:**
   - Run the project's test suite to ensure nothing broke from the rebase
   - If tests fail → **STOP**. Rebase introduced regressions. Fix before merging.

5. **Merge to staging:**
   - Use `/push-staging` skill logic (checkout staging, merge branch, push)
   - After successful push, update the plan file: `status: merged`

6. **Notify sibling milestones:**
   - For each sibling plan file with a HIGHER merge_order that is still `active`:
     - Add a note in their plan file's `parallel` block: `sibling_merged: [this milestone slug] on [date]`
     - This signals the next session to rebase before testing

### Step 5b: Mark Issues Done in Plane

For each issue in the workflow state that isn't already Done in Plane:
1. Update the issue status to Done
2. Mark `close: complete` in the workflow state

### Step 6: Post Milestone Completion Summary

Post a comment/update on the milestone in Plane:

```markdown
## Milestone Complete: {Milestone Name}

**Completed:** YYYY-MM-DD
**Issues:** {count} total ({count} implemented, {count} skipped)
**Waves:** {count}

### Issues Summary
| Issue | Title | Status |
|-------|-------|--------|
| KEE-101 | [title] | Done |
| KEE-102 | [title] | Done (test skipped: [reason]) |

### Review Findings Summary
- Critical: {count} (all resolved)
- Medium: {count} issues created (outside milestone)
- Low: {count} issues created (backlog)

### Artifacts Produced
- Plan file: `.claude/plans/{slug}.md`
- Workflow state: archived to `.claude/workflows/archive/{slug}.yaml`
- Documentation updated: [list key docs that were updated]
```

### Step 7: Handle Cleanup

Read the `cleanup` setting from the workflow state file:

| Setting | Action |
|---------|--------|
| `archive` (default) | Move workflow file to `~/.claude/workflows/archive/{slug}.yaml` |
| `delete` | Delete the workflow file |
| `keep` | Leave the workflow file in place |

**CRITICAL: The plan file in `.claude/plans/` is NEVER touched.** It is a permanent artifact regardless of the cleanup setting.

### Step 8: Report

Tell the user:
- Milestone is closed
- Where the workflow state was moved/kept
- Summary of what was accomplished
- If medium/low triage issues were created, remind the user they exist in the backlog

---

## Rules

1. **Critical gate is absolute.** Zero open critical findings. No exceptions. No overrides.
2. **All phases must be complete or explicitly skipped.** Pending or blocked phases block closure.
3. **Plan files are permanent.** Never delete, move, or archive plan files. Only workflow state files are subject to cleanup.
4. **Post the summary before archiving.** The Plane module summary must be posted before the workflow file is archived, because the summary uses data from the workflow file.
5. **Update the workflow state file.** Mark each issue's `close` phase as complete before archiving.
6. **Wave ordering is verified.** A later wave cannot be complete if an earlier wave isn't.
7. **Parallel milestones must rebase before merge.** If the plan has a `parallel` block with siblings, always fetch and rebase onto staging before merging. Run tests after rebase.
8. **Merge order is advisory, not blocking.** Out-of-order merging is allowed with user confirmation, but the warning must be shown.
