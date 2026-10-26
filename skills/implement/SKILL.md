---
name: implement
description: |
  Implements code for a single Plane issue. Reads the workflow state file for phase gating
  and the plan file for wave ordering. Loads implementation context policies if they exist.
  Use when the user says "/implement [ISSUE-ID]", "implement this issue", "work on [ISSUE-ID]",
  or "start [ISSUE-ID]".
  Part of the PTheory skill chain — writes code only. Tests, docs, and Plane updates are separate skills.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Implement Skill

Writes code for a single Plane issue. Reads the workflow state file for phase gating and the plan file for wave ordering. Loads implementation context policies as hard constraints.

**This skill ONLY writes code.** Testing → /test. Documentation → /document-code. Plane updates → /document-plane. Marking Done → /close.

**This is a global skill.** Works with any project.

## When to Use

- Starting work on a specific issue
- User says "/implement ISSUE-XX", "work on ISSUE-XX", "start this issue"
- When an issue is assigned and ready for implementation

## Process — Every Step is Mandatory

### Step 0: Read Workflow State and Plan

**GATE CHECK — Do not proceed until this passes.**

1. Find the active workflow state file at `~/.claude/workflows/`
2. Find the issue ID in the workflow state's `issues` block
3. Check prerequisite phases:
   - `milestone_phases.plan_doc_code` must be `complete`
   - `milestone_phases.plan_doc_plane` must be `complete`
   - If either is not complete → **STOP**: "Plan documentation must be complete before implementing. Run /document-code then /document-plane."
4. Check wave ordering:
   - Find this issue's wave number
   - If wave > 1, verify ALL issues in previous waves have `close: complete`
   - If previous wave is not fully closed → **STOP**: "Wave N-1 must be complete before starting Wave N."
5. Check if this issue's `implement` phase is already `complete` or `in_progress`:
   - `complete` → **STOP**: "Already implemented. Next: /document-code"
   - `in_progress` → ask user: resume or reset to pending?

**If no workflow state file exists:** Fall back to plan file only (legacy mode). Check wave ordering from plan file. Warn that workflow tracking is disabled.

### Step 0b: Read Plan File

1. Look for a plan file in `.claude/plans/` that contains this issue ID
2. If found: read the issue's `files`, `tests_to_write`, `tests_to_run`
3. If not found: proceed without plan context (standalone issue)

**COMPLETED MILESTONE RULE — Hard gate, no exceptions.**

4. Fetch the issue from Plane and check its milestone
5. If the milestone is 100% complete → **STOP**. Create a new issue in an active milestone instead.

### Step 1: Mark In Progress

1. Update the workflow state file: set `implement: in_progress` for this issue. Update `updated` date.
2. Update the Plane issue status to **In Progress**.

### Step 2: Read the Issue

1. Fetch the issue from Plane (get_issue)
2. Read the full description, acceptance criteria, and any comments
3. Identify affected files and surfaces

### Step 3: Read Affected Code

1. Read every file listed in the issue or plan's file list
2. Understand the current state before making changes
3. Check for related code that might be affected

### Step 4: Load Implementation Context (Policies)

**This step loads hard constraints. If a policy exists, it MUST be followed.**

1. Read the workflow state file's `context` block
2. For each category (platform, os, codebase, security, standards):
   - For each value in the category:
     - Check: does `~/.claude/skills/implement/policies/{category}/{value}.md` exist?
     - **YES** → Read it. These are MUST/MUST NOT constraints for all code in this session.
     - **NO** → Skip. No constraint applied. Default behavior.
3. Collect all loaded policies into the active constraint set
4. During implementation, every code decision is checked against active constraints
5. If a constraint is violated → stop and fix before proceeding (same as a failing test)

**If no context block exists in the workflow state:** Skip this step entirely. No policies loaded = current default behavior.

### Step 5: Implement the Code

1. Make the code changes
2. Follow project conventions (check CLAUDE.md for naming, imports, patterns)
3. Follow ALL loaded policy constraints (Step 4)
4. No hardcoded stubs, mock data, or TODO comments
5. No shortcuts — production-ready code only

### Step 6: Commit

- Stage specific files (not `git add .`)
- Commit message with issue ID: `fix: ISSUE-XX description` or `feat: ISSUE-XX description`

### Step 7: Mark Implement Complete

1. Update the workflow state file: set `implement: complete` for this issue. Update `updated` date.
2. Update plan file wave status if applicable

### Step 8: Report Next Steps

Tell the user:
- What was implemented (files changed, what they do)
- Commit hash
- "Next: Run `/document-code` to update repo docs, then `/document-plane` to post completion comment, then `/test` to write and run tests."

## What This Skill Does NOT Do

These are handled by other skills in the chain:

| Previously in /implement | Now handled by |
|-------------------------|---------------|
| Write tests (old Steps 6-7) | `/test` |
| Update TEST_COVERAGE.md (old Step 8) | `/document-code` (after test phase) |
| Update documentation (old Step 9) | `/document-code` (after implement phase) |
| Post Plane completion comment (old Step 11) | `/document-plane` (after implement phase) |
| Mark Done in Plane (old Step 12) | `/close` |
| Update plan file wave status (old Step 13) | Still here (Step 7) — plan file is an implementation artifact |

## What NOT to Do

- Do NOT start if prerequisites aren't complete (workflow state gates)
- Do NOT write tests — that's /test's job now
- Do NOT update documentation — that's /document-code's job
- Do NOT post Plane comments — that's /document-plane's job
- Do NOT mark the issue Done — that's /close's job
- Do NOT introduce hardcoded stubs or TODO comments
- Do NOT add work to a completed milestone — create a new issue instead
- Do NOT violate loaded policies — treat violations like failing tests
