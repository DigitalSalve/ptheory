---
name: review-orchestrator
description: |
  Orchestrates all three review skills in sequence: /code-review, /review-ux, /review-architecture.
  Combines findings into a unified report. Use when the user says "/review", "full review",
  "review everything", or automatically after /test completes in the PTheory chain.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, Skill, TodoWrite
---

# Review Orchestrator Agent

Runs all three review skills and combines findings into one report.

## The Three Reviews

| Order | Skill | What It Checks |
|-------|-------|---------------|
| 1 | `/code-review` | Code conventions, security, test coverage, naming |
| 2 | `/review-ux` | User journey, states, edge cases, data flow, accessibility |
| 3 | `/review-architecture` | Layer alignment (UI↔API↔DB), route registration, schema sync, dependency gaps |

## Process

### Step 1: Read Context

1. Read the active workflow state file at `~/.claude/workflows/`
2. Identify which issue(s) are being reviewed
3. Confirm gate prerequisites are met (test phases complete)

### Step 2: Run Reviews in Sequence

**Run 1: /code-review**
- Read `~/.claude/skills/code-review/SKILL.md` and execute
- Collect findings

**Run 2: /review-ux**
- Read `~/.claude/skills/review-ux/SKILL.md` and execute
- Collect findings + artifact outputs (edge cases, failure paths, data exposure)

**Run 3: /review-architecture**
- Read `~/.claude/skills/review-architecture/SKILL.md` and execute
- Collect findings + artifact outputs (alignment report, dependency gaps)

### Step 3: Combine Findings

```markdown
## Combined Review: {Issue ID} — {Issue Title}

**Date:** YYYY-MM-DD
**Overall:** PASS | PASS WITH FINDINGS | FAIL

### Code Review
| # | Finding | Priority |
|---|---------|----------|

### UX Review
| # | Finding | Priority |
|---|---------|----------|

### Architecture Review
| # | Finding | Priority |
|---|---------|----------|

### Summary
- Code: [N] findings ([N] crit, [N] med, [N] low)
- UX: [N] findings ([N] crit, [N] med, [N] low)
- Architecture: [N] findings ([N] crit, [N] med, [N] low)

### Recommendation
- Any CRITICAL → Loop back to /plan
- Only MEDIUM/LOW → Proceed to /close
- All PASS → Proceed to /close
```

### Step 4: Update Workflow State

Mark review phases complete:
- `review: complete`
- `review_code: complete`
- `review_ux: complete`
- `review_architecture: complete`

### Step 5: Hand Off

- Pass combined findings to `/document-code` then `/document-plane`
- If scope amendments recommended, suggest `/scope amend` first

## Rules

1. **Run all three.** Don't skip unless explicitly told to.
2. **Sequential.** Each review may inform the next.
3. **Combine before documenting.** /document-plane gets ONE report.
4. **Highest severity wins.** Any CRITICAL = overall FAIL.
5. **Don't duplicate.** Same finding in two reviews → report once under the more specific review.
