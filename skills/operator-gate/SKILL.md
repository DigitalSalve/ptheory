---
name: operator-gate
description: |
  Stage 5 Operator Readiness Gate — binary pass/fail evaluation of 24 non-negotiable criteria.
  Determines whether exploration work can cross the contract boundary into production.
  Called by /close before a milestone can be closed. No partial credit, no negotiation.
  Use when the user says "/operator-gate", "run the gate", "readiness check",
  or automatically invoked by /close before allowing milestone closure.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Operator Gate Skill

Stage 5 Operator Readiness Gate from the Your-Workspace Architects and Operators framework. Binary pass/fail evaluation — no partial credit, no negotiation. A milestone does not close unless every criterion passes.

**This is the contract boundary enforcement.** It determines whether exploration work is ready for an operator to take into production.

**This is a global skill.** Works with any project.

## When to Use

- Called by `/close` before allowing milestone closure
- User says "/operator-gate", "run the gate", "readiness check"
- When evaluating whether a component is contract-ready

## Process

### Step 1: Locate Artifacts

Check for the existence of each required artifact at `.claude/artifacts/`:

| Artifact | Expected Location |
|----------|------------------|
| System Flow | `.claude/artifacts/system-flow.md` |
| Dependency List | `.claude/artifacts/dependencies.md` |
| Edge Cases | `.claude/artifacts/edge-cases.md` |
| Failure Paths | `.claude/artifacts/failure-paths.md` |
| Limitations | `.claude/artifacts/limitations.md` |
| Data Exposure | `.claude/artifacts/data-exposure.md` |
| Change Log | Plane issue comments (completion summaries) |
| Test Results | Plane issue comments (test results) |

### Step 2: Evaluate All 24 Criteria

**Outcomes are binary: Pass or Fail. There is no partial credit.**

---

#### Section 1: Documentation Requirements (6 criteria)

| # | Criteria | Check | Pass/Fail |
|---|---------|-------|-----------|
| 1.1 | **System Flow** | `.claude/artifacts/system-flow.md` exists AND reflects the system as built (not the original plan) | |
| 1.2 | **Dependency List** | `.claude/artifacts/dependencies.md` exists with all deps, versions, and integration points. No undisclosed third-party services. | |
| 1.3 | **Edge Cases** | `.claude/artifacts/edge-cases.md` exists with individually documented edge cases and observed behavior | |
| 1.4 | **Failure Paths** | `.claude/artifacts/failure-paths.md` exists with trigger conditions and expected system responses | |
| 1.5 | **Change Log** | Plane issue completion comments exist for all Done issues in the milestone | |
| 1.6 | **Limitations** | `.claude/artifacts/limitations.md` exists. All known limitations explicitly listed. Nothing implied. | |

---

#### Section 2: Security Minimums (4 criteria)

| # | Criteria | Check | Pass/Fail |
|---|---------|-------|-----------|
| 2.1 | **Credentials** | Grep codebase for hardcoded secrets, API keys, tokens. Zero matches = Pass. | |
| 2.2 | **Authentication Paths** | All auth paths identified in system flow or architecture docs. Even unimplemented paths documented. | |
| 2.3 | **Data Exposure** | `.claude/artifacts/data-exposure.md` exists with risks documented (scope + severity). If no risks found, document "none identified." | |
| 2.4 | **Access Scope** | System does not request/use elevated permissions beyond core function. Verified by /review Check 9. | |

---

#### Section 3: Stability Minimums (4 criteria)

| # | Criteria | Check | Pass/Fail |
|---|---------|-------|-----------|
| 3.1 | **Core Function** | All tests pass. Core user journey completes without crashes (verified by /review). | |
| 3.2 | **Abnormal Input** | Abnormal input tests exist and document behavior (not just pass/fail). Verified by /test Step 5. | |
| 3.3 | **Undisclosed Dependencies** | Dependencies artifact matches actual imports/requires. No undisclosed deps. | |
| 3.4 | **Reproducibility** | Plan file + workflow state + committed code = reproducible build. Build/start commands documented in CLAUDE.md. | |

---

#### Section 4: Operational Awareness (4 criteria)

| # | Criteria | Check | Pass/Fail |
|---|---------|-------|-----------|
| 4.1 | **Resource Estimates** | Infrastructure resource needs noted (compute, memory, storage, network). Can be rough estimates. | |
| 4.2 | **Infrastructure Implications** | What needs to exist in production is flagged (services, databases, queues, caches). | |
| 4.3 | **Monitoring Needs** | What needs to be observed in production is documented (health checks, error rates, latency). | |
| 4.4 | **Scaling Concerns** | Any scaling concerns from testing are documented. If none found, document "none identified." | |

**Note:** Full solutions not required for Section 4. The concerns must be surfaced. The operator fills in the details during productization.

For Section 4, check `.claude/artifacts/operational-awareness.md`. If it doesn't exist, the gate creates a template and marks all 4 criteria as FAIL with a note to the architect to surface these concerns.

---

#### Section 5: Handoff Packet Completeness (6 criteria)

| # | Criteria | Check | Pass/Fail |
|---|---------|-------|-----------|
| 5.1 | **Tested System Flow** | `.claude/artifacts/system-flow.md` exists as a discrete document (not just inline in other docs) | |
| 5.2 | **Modules and Services** | List of all modules/services exists (in system flow or dependency manifest) | |
| 5.3 | **Dependencies** | `.claude/artifacts/dependencies.md` exists with versions | |
| 5.4 | **Operational Concerns** | `.claude/artifacts/operational-awareness.md` exists as a discrete list | |
| 5.5 | **Production Requirements** | Initial production requirements identified (in operational awareness or separate doc) | |
| 5.6 | **Usage Observations** | Observations from testing recorded (in Plane test result comments or discrete doc) | |

---

### Step 3: Produce Gate Report

```markdown
## Operator Readiness Gate Report

**Milestone:** {name}
**Date:** YYYY-MM-DD
**Overall:** PASS / FAIL

### Results

| # | Section | Criteria | Result |
|---|---------|----------|--------|
| 1.1 | Documentation | System Flow | PASS/FAIL |
| 1.2 | Documentation | Dependency List | PASS/FAIL |
| ... | ... | ... | ... |
| 5.6 | Handoff Packet | Usage Observations | PASS/FAIL |

**Passed:** X/24
**Failed:** X/24

### Deficiencies (if any FAIL)

| # | Criteria | What's Missing | Remediation |
|---|---------|---------------|-------------|
| 1.3 | Edge Cases | No edge case catalog found | Create .claude/artifacts/edge-cases.md with observed behaviors |
| ... | ... | ... | ... |

### Verdict

**PASS** — All 24 criteria satisfied. Milestone may close. Component is contract-ready.

OR

**FAIL** — [N] deficiencies found. Returned to architect for remediation.
Deficiencies created as CRITICAL issues in the current milestone.
```

### Step 4: Handle Results

**If ALL PASS:**
- Return PASS to `/close`
- `/close` proceeds with milestone closure
- Component is declared contract-ready

**If ANY FAIL:**
- Return FAIL to `/close`
- `/close` blocks milestone closure
- Create CRITICAL issues for each deficiency (inside current milestone)
- Tell the user: "Operator gate failed on [N] criteria. Deficiencies returned to architect. Resolve and re-run /operator-gate."
- The chain loops back to /plan → /implement for remediation

---

## Artifact Directory

The gate expects artifacts at `.claude/artifacts/` in the project repo:

```
.claude/artifacts/
├── system-flow.md           # How the system works (as built)
├── dependencies.md          # All deps with versions + integration points
├── edge-cases.md            # Each edge case with observed behavior
├── failure-paths.md         # Trigger conditions + system responses
├── limitations.md           # Known limitations (nothing implied)
├── data-exposure.md         # Data exposure risks with scope + severity
└── operational-awareness.md # Resource estimates, infra, monitoring, scaling
```

These are produced by `/document-code` (after implement and review phases) and `/review` (structured outputs). The gate only evaluates — it doesn't create.

---

## Rules

1. **Binary. No partial credit.** Every criterion is Pass or Fail. 23/24 is still FAIL.
2. **No negotiation.** The criteria are non-negotiable. If it fails, fix it.
3. **Deficiencies go back to the architect.** Created as CRITICAL issues. The chain loops.
4. **The gate doesn't create artifacts.** It evaluates what the chain already produced. If artifacts are missing, that's a FAIL.
5. **Section 4 is surfacing, not solving.** The architect flags operational concerns. The operator solves them in productization.
6. **Verbal explanations don't count.** If it's not in a file, it doesn't exist.

---

## Source

Your-Workspace Ventures | Architects and Operators Framework | Stage 5 Operator Readiness Gate — Non-Negotiable Acceptance Criteria
