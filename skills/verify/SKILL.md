---
name: verify
description: |
  Runs test suites and verifies implementation completeness against completion standards.
  Use when the user says "/verify", "verify the milestone", "run flow tests",
  "check everything works", or after completing a set of issues. Also use to
  verify that all Done issues meet completion standards.
allowed-tools: Read, Glob, Grep, Bash, Agent, TodoWrite
---

# Verify Skill

Runs all tests, audits Done issues for compliance, and produces a verification report.

## When to Use

- After completing a milestone or wave of issues
- User says "/verify", "verify everything", "check it all works"
- Before pushing to main
- When auditing whether Done issues actually meet completion standards

## Process

### Step 1: Discover Test Infrastructure

1. Check project for test frameworks (look for test directories, config files)
2. Identify test commands (check package.json scripts, CLAUDE.md, README)
3. Find any reusable flow test suites

### Step 2: Run Full Test Suite

Run all test commands the project supports. Record results: total tests, pass/fail counts, duration.

### Step 3: Run Reusable Flow Tests

Check for flow test directories (e.g., `test/flows/`, `tests/integration/`). Run each suite and record results.

If flow tests don't exist, note as a gap.

### Step 4: Check Plan File Completion

If a plan file exists in `.claude/plans/`:
1. Read the plan file
2. For each wave, verify `status: complete` if all its issues are Done in Plane
3. Flag any wave marked `pending` where all issues are Done — plan file wasn't updated
4. Flag any wave marked `complete` where issues are NOT Done — premature completion
5. Check `done_criteria` at the bottom — all should be true for a finished milestone

### Step 5: Cross-Reference Test Index

**ENFORCEMENT CHECK — This step catches missing documentation.**

1. List all test files on disk:
   - Backend: `find backend -name "*.test.ts" -not -path "*/node_modules/*"`
   - Flutter: `find test -name "*_test.dart"`
2. Read the test coverage index (e.g., `docs/08-status/TEST_COVERAGE.md`)
3. Compare: flag any test file on disk that is NOT in the index
4. Compare: flag any index entry that references a file that doesn't exist on disk
5. Cross-reference plan file `tests_to_write` — flag any planned test that wasn't created
6. Report all discrepancies as **NON-COMPLIANT**

### Step 6: Audit Plane Issues

For each Done issue in the milestone:

1. **Check for completion comment** — must have: Fix description, Files changed, Commit hash, Verification steps, Test results
2. **Check test results** — must show actual pass/fail numbers, not "Pending"
3. **Check test index entry** — the issue must appear in the Issue → Test Mapping in TEST_COVERAGE.md
4. **Check acceptance criteria** — verify against the issue description
5. **Flag non-compliant issues** — list any that don't meet the standard, including missing index entries

### Step 7: Produce Verification Report

```markdown
# Verification Report — [Milestone/Feature Name]
Date: YYYY-MM-DD

## Test Results

### [Framework 1]
- Files: X test files
- Tests: X/X passed
- Duration: Xms

### [Framework 2]
- Files: X test files
- Tests: X/X passed

## Issue Compliance Audit

### Compliant (X/Y)
- ISSUE-XX: Title — all checks pass

### Non-Compliant (X/Y)
- ISSUE-XX: Title — MISSING: [tests / completion comment / docs update]

## Gaps Found
- [Any missing flow tests, documentation gaps, or untested paths]

## Recommendation
[Ready to push / Needs fixes before push]
```

### Step 8: Fix Non-Compliance

If non-compliant issues are found:
1. List them clearly with what's missing
2. Ask user whether to fix now or create follow-up issues
3. If fixing, use the /implement workflow for each

## Reusable Flow Test Principles

Flow tests cover entire user journeys, not individual units:
- **Entry point** → user can reach the feature
- **Core action** → user can perform the main action
- **Result** → expected outcome occurs
- **Navigation** → back/forward works correctly
- **Error handling** → graceful failure on bad input

Flow tests are **reusable** — they run every time to catch regressions across the entire flow.
