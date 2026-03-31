---
name: plan-review
description: |
  Orchestrates specialist perspective reviews of an implementation plan before it's finalized.
  Runs 8 specialist agents against the draft plan and combines their findings.
  Use when /plan produces a draft, or when the user says "review the plan", "check the plan",
  or before finalizing any non-trivial implementation plan.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Plan Review Orchestrator

Runs specialist perspectives against a draft implementation plan to catch risks before code is written.

## The Eight Perspectives

| Order | Agent | What They Catch |
|-------|-------|----------------|
| 1 | backend-engineer | Schema impact, API design, auth middleware, route mounting |
| 2 | frontend-engineer | Route registration, state management, cross-platform, UI states |
| 3 | data-engineer | Migration safety, data backfill, indexes, schema sync |
| 4 | security-auditor | Auth gaps, data exposure, input validation, secrets |
| 5 | security-engineer | Platform vulns, OWASP top 11, CORS, escape sequences |
| 6 | performance-engineer | Query bottlenecks, rendering cost, bundle size, scalability |
| 7 | designer | Visual consistency, accessibility, responsive, UX patterns |
| 8 | devops-engineer | Deployment config, env vars, CI/CD, start commands |

## Process

### Step 1: Read the Draft Plan

1. Read the plan file from `.claude/plans/`
2. Read the issue descriptions from Plane
3. Read the project scope and project index for context

### Step 2: Run Perspectives

Run each specialist agent against the plan. Each receives:
- The draft plan
- The project scope
- The project index (tech stack, file locations)
- The issue descriptions

Each returns a table of risks with severity and recommendations.

Run agents in parallel where possible (backend + frontend + data can run simultaneously since they check different things).

### Step 3: Combine Findings

```markdown
## Plan Review: {milestone/plan name}

**Date:** YYYY-MM-DD
**Plan file:** `.claude/plans/{slug}.md`

### Findings by Perspective

| # | Perspective | Risk | Severity | Recommendation |
|---|------------|------|----------|----------------|
| 1 | Backend | [risk] | HIGH | [fix] |
| 2 | Security | [risk] | CRITICAL | [fix] |
| 3 | Data | [risk] | MEDIUM | [fix] |

### Summary
- Critical: [N] (must address before implementing)
- High: [N] (should address before implementing)
- Medium: [N] (address during implementation)
- Low: [N] (nice to have)
- No risk: [N] perspectives found nothing

### Recommendation
- Any CRITICAL → Revise plan before proceeding
- Only HIGH/MEDIUM/LOW → Note risks and proceed
- All clean → Proceed to implementation
```

### Step 4: Report to User

Present the combined findings. If CRITICAL risks exist, recommend plan revision. If only lower severity, note them as implementation considerations.

Do NOT automatically revise the plan. Present findings and let the architect decide.

## Rules

1. **Run all eight.** Don't skip perspectives unless the plan clearly doesn't touch that domain.
2. **Parallel where possible.** Backend, frontend, data, security-auditor, and security-engineer can run simultaneously.
3. **Don't invent risks.** If a perspective finds nothing, that's fine — report it as clean.
4. **Don't revise the plan.** Present findings. The architect decides what to change.
5. **CRITICAL findings are blockers.** Recommend the plan be revised — don't just note them.
