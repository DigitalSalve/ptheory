---
name: onboard-project
description: |
  First-time project setup for PTheory. Runs after /scope succeeds but before the chain can proceed.
  Creates missing documentation hierarchy, agents, project-specific skills, Plane project,
  coordination directories, and verifies tool access.
  Use when the user says "/onboard-project", "set up this project for PTheory", "bootstrap this repo",
  or automatically when the workflow state onboarded field is false/missing.
  This is a global skill — it onboards any project into the PTheory system.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Onboard Project Skill

First-time project setup that bridges "PTheory exists globally" and "this project can use PTheory." Runs once per project, then sets `onboarded: true` in the workflow state so it never blocks again.

**This is a global skill.** It onboards any project into PTheory regardless of tech stack.

## When to Use

- Automatically: workflow state `onboarded` field is `false` or missing (chain blocks after /scope)
- Manually: user says "/onboard-project", "set up PTheory for this project", "bootstrap"
- Only runs its full setup once. Subsequent runs are idempotent (check + skip what exists).

## Chain Position

```
/scope read (scope exists)
  ↓
ONBOARDING GATE: workflow state `onboarded` == true?
  → YES → skip, proceed to entry gate
  → NO/MISSING → /onboard-project runs → sets onboarded: true → proceed
  ↓
ENTRY GATE → /plan → ...
```

---

## Process

### Step 0: Gather Project Context

Before creating anything, understand the project:

1. **Read the scope document** (already loaded by /scope) — project name, platforms, tech stack, boundaries
2. **Scan the repo** — what already exists?
   - `ls` the root for CLAUDE.md, AI.md, docs/, .claude/
   - Check for package.json, pubspec.yaml, Cargo.toml, go.mod, etc. to detect tech stack
   - Check for existing test directories
   - Check for deployment configs (render.yaml, vercel.json, Dockerfile, etc.)
3. **Read existing CLAUDE.md** if one exists — don't overwrite a project that's partially set up
4. **Determine what's missing** — build a checklist of what needs to be created

### Step 1: Documentation Hierarchy

**Check:** Does `docs/` exist with the 8-layer structure?

**If missing:** Create the directory structure and navigation spine:

```
docs/
├── README.md              # Navigation spine (from PTheory template)
├── 01-orientation/        # How to approach this repo
├── 02-canon/              # Mandates, policies, scope
│   └── PROJECT_SCOPE.md   # Already exists (created by /scope)
├── 03-architecture/       # System construction, data, boundaries
├── 04-behavior/           # User flows, API contracts
├── 05-integrations/       # External APIs
├── 06-operations/         # SOPs, deployment, processes
│   └── processes/         # Operational procedures
├── 07-guides/             # Feature documentation
│   └── templates/         # Feature note template, SOP template
└── 08-status/             # Progress, reports, decisions
    └── coordination/      # Agent coordination
        ├── active-work/
        ├── feature-requests/
        ├── directives/
        └── qa/
```

**If partially exists:** Create only the missing directories. Never delete existing content.

**Populate spine:** Generate `docs/README.md` from the PTheory template, filling in project name. Link to any existing docs found in the scan.

### Step 2: Project Entry Points (CLAUDE.md / AI.md)

**Check:** Do CLAUDE.md and/or AI.md exist?

**If CLAUDE.md missing:** Generate from template using project context:
- Project name and description (from scope)
- Tech stack (detected from repo scan)
- Directory structure (actual, from repo scan)
- Available commands (detected from package.json scripts, Makefile, etc.)
- Environment variables (detected from .env.example, render.yaml, etc.)
- Testing commands (detected from test config files)
- Deployment info (detected from deploy configs)

**If AI.md missing:** Generate from template:
- Link to CLAUDE.md
- Link to docs/README.md
- Behavior rules (from PTheory standard set)
- Hard rules (from PTheory standard set, adapted for project)

**If either exists:** Read it, verify it links to docs/README.md. Don't overwrite — only suggest additions.

### Step 3: Create `.claude/` Directory Structure

**Check:** Does `.claude/` exist with agents/ and skills/ directories?

**If missing:** Create the directories:
```
.claude/
├── agents/      # Project-specific agents (populated by /onboard-customize)
├── skills/      # Project-specific skills (populated by /onboard-customize)
└── plans/       # Plan files (populated by /plan)
```

**Note:** Agent and skill generation has moved to `/onboard-customize` (phase 4 of the onboarding chain). That skill runs after `/onboard-discover` scans the project and has the full project index to work from. This step only creates the empty directories.

### Step 4: Verify Plane Access

**Check:** Does a Plane project exist for this project?

1. Search Plane for a project matching the project name (from scope)
2. **If found:** Read it, verify it has milestones. Store the project ID.
3. **If not found:** Ask the user if they want to create one.
   - If yes: create the project in Plane with the project name, link to initiative if applicable
   - If no: note that Plane integration will be limited (no milestone tracking, no triage issues)

### Step 6: Settings and Permissions

**Check:** Does `.claude/settings.json` exist?

**If missing:** Create with sensible defaults:
- Tool permissions appropriate for the detected tech stack
- Hook configurations if the project needs them

**If exists:** Don't modify. Flag if it's missing permissions that the chain skills need.

### Step 7: Tool and MCP Verification

Check that required tools are accessible:

| Tool | Required For | Check |
|------|-------------|-------|
| Plane MCP/API | /document-plane, /close, entry gate | Try listing issues |
| Git | /commit, /pr | `git status` |
| Node/npm | TypeScript projects | `node --version` |
| Flutter | Dart projects | `flutter --version` |
| Project-specific CLIs | Deploy, DB | Check per deploy config |

**If missing:** Don't block onboarding. Report what's missing and what chain steps will be affected.

### Step 8: Coordination Directories

**Check:** Does `docs/08-status/coordination/` exist with subdirs?

**If missing:** Create:
```
docs/08-status/coordination/
├── active-work/
│   ├── ACTIVE_WORK.md
│   └── ACTIVE_WORK_LOG.md
├── feature-requests/
├── directives/
│   └── DIRECTIVES.md
└── qa/
```

### Step 9: Set Onboarded Flag

Update the workflow state file: set `onboarded: true`. Update the `updated` date.

If no workflow state file exists yet (onboarding ran before /plan created one), create a minimal one:

```yaml
workflow: onboarding
project: {project name from scope}
onboarded: true
scope_document: {path to scope document}
created: {today}
updated: {today}
cleanup: keep
```

This minimal file will be replaced by /plan when it creates the full workflow state file, but the `onboarded: true` flag persists.

### Step 10: Report

Generate an onboarding report:

```markdown
## Project Onboarding Complete: {Project Name}

**Date:** YYYY-MM-DD
**Tech stack detected:** [list]

### Created
- [x] docs/ hierarchy (8 layers)
- [x] CLAUDE.md with project context
- [x] .claude/agents/ (X agents)
- [x] .claude/skills/ (X project-specific skills)
- [x] docs/08-status/coordination/ directories

### Already Existed (unchanged)
- [x] AI.md
- [x] docs/02-canon/PROJECT_SCOPE.md

### Skipped (user declined or not applicable)
- [ ] Plane project (user declined)

### Requires Manual Action
- [ ] Set RENDER_API_KEY in .env for deploy access
- [ ] Install Flutter SDK for mobile builds

### Next Step
Project is onboarded. Run /plan or start the chain with a request.
```

---

## Rules

1. **Never overwrite existing files.** If CLAUDE.md exists, don't replace it. Suggest additions.
2. **Never delete anything.** Only create or append.
3. **Idempotent.** Running again on an onboarded project checks everything, creates nothing, reports "already onboarded."
4. **Ask before creating Plane projects.** Don't auto-create — the user may have a specific workspace setup.
5. **Tech stack detection is best-effort.** If detection is wrong, the user can correct later. Don't block on ambiguity.
6. **Missing tools don't block onboarding.** Report them, but set `onboarded: true` anyway. The chain skills will handle missing tools at their own phase.
7. **Project-specific skills override global.** When both exist, the repo-level `.claude/skills/` version takes precedence.
8. **Scope document must already exist.** /onboard-project runs AFTER /scope read succeeds. It does not create the scope — that's /scope's job.

---

## Onboarding Chain

/onboard-project is phase 1 of a 4-phase onboarding chain:

```
/scope read (scope must exist first)
  ↓
/onboard-project (phase 1 — THIS SKILL — infrastructure setup)
  ↓
/onboard-discover (phase 2 — scan codebase, index features, interview user)
  ↓
/onboard-migrate (phase 3 — translate discovered state into Plane project)
  ↓
/onboard-customize (phase 4 — generate project-specific skills and agents)
```

Each phase can be run independently, but the full chain gives the most complete onboarding.

## What This Is NOT

- **Not /scope.** /scope creates and manages the scope document. /onboard-project assumes scope exists.
- **Not /onboard-discover.** Discovery scans the codebase and interviews the user. This skill just sets up directories.
- **Not /onboard-migrate.** Migration creates Plane structure from discoveries. This skill doesn't touch Plane (except verifying access).
- **Not /onboard-customize.** Customization generates project-specific skills and agents from the project index. This skill just creates empty directories for them.
- **Not /bootstrap.** /bootstrap (future, P3) is the full PTheory ecosystem setup for a brand-new project from scratch.
- **Not /onboard.** The existing /onboard skill is a per-session startup helper. /onboard-project is a one-time project setup.
