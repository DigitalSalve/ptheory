---
name: onboard-migrate
description: |
  Translates discovered project state into Plane project structure. Third phase of PTheory onboarding.
  After /onboard-discover produces a project index, this skill creates the Plane project, milestones,
  and issues from discovered features, gaps, and planned work.
  Use when the user says "/onboard-migrate", "create linear from scan", "migrate to linear",
  or automatically after /onboard-discover completes.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# Onboard Migrate Skill

Translates the project index from /onboard-discover into Plane project structure. Creates projects, milestones, and issues from discovered features, gaps, and planned work.

**This is phase 3 of the onboarding chain:**
```
/onboard-project → /onboard-discover → /onboard-migrate → /onboard-customize
```

**This is a global skill.** Works with any project.

## Prerequisites

- /onboard-project completed (infrastructure exists)
- /onboard-discover completed (`.claude/project-index.yaml` exists)
- User has reviewed the project index

## Process

### Step 1: Read Project Index

1. Read `.claude/project-index.yaml` from /onboard-discover
2. Read the scope document for project boundaries
3. If no project index exists → **STOP**: "Run /onboard-discover first."

### Step 2: Check Existing Plane State

1. Search Plane for an existing project matching this repo
2. If found → read existing milestones and issues to avoid duplicates
3. If not found → will create in Step 4

### Step 3: Build Migration Plan

From the project index, build a plan of what to create:

#### Features → Issues

| Feature Status | Plane Action |
|---------------|---------------|
| **implemented + tested** | Create issue as **Done** (historical record, breadcrumb) |
| **implemented, no tests** | Create issue as **Done** + create **test debt** issue (Todo) |
| **partial** | Create issue as **In Progress** with notes on what's missing |
| **stubbed** | Create issue as **Todo** with acceptance criteria for full implementation |
| **planned** | Create issue as **Todo** |

#### Gaps → Issues

| Gap Type | Priority | Milestone Binding |
|----------|----------|-------------------|
| test_debt | Medium | Current active or "Test Debt" milestone |
| stub_content | Medium | Current active milestone |
| incomplete_wiring | High | Current active milestone |
| schema_drift | High | Current active milestone |
| config_gap | Low | Backlog, no milestone |
| doc_drift | Low | Backlog, no milestone |

#### Milestones

Group issues into milestones based on:
- Feature areas (auth, events, admin, etc.)
- Implementation status (completed features group together, active work groups together)
- User-stated priorities (from interview)

### Step 4: User Confirmation

Present the migration plan to the user:

```
## Plane Migration Plan: [Project Name]

**Plane project:** [Create new / Update existing: NAME]

**Milestones to create:** [count]
- [Milestone 1]: [N] issues ([N] Done, [N] Todo, [N] In Progress)
- [Milestone 2]: [N] issues
- ...

**Issues to create:** [total count]
- Done (historical): [count]
- In Progress: [count]
- Todo: [count]
- Backlog (gaps): [count]

Create this structure in Plane?
```

Wait for user confirmation. Do not proceed without it.

### Step 5: Create Plane Project

If no existing project:
1. Create the project in Plane
2. Set name, description (from scope + index), icon
3. Link to initiative if user specifies one
4. Set lead to current user

If existing project:
1. Update description if it's bare
2. Don't overwrite existing content

### Step 6: Create Milestones

For each milestone in the migration plan:
1. Check if it already exists in the project (by name match)
2. If exists → skip (don't duplicate)
3. If new → create with description

### Step 7: Create Issues

For each issue in the migration plan:
1. Check if a similar issue already exists (title match or description match)
2. If exists → skip, note as "already tracked"
3. If new → create with:
   - Title: `[TYPE] Feature/gap description`
   - Description: from project index notes + acceptance criteria
   - Status: per the feature status mapping (Step 3)
   - Milestone: assigned per grouping
   - Labels: appropriate type labels
   - Priority: based on gap severity or feature importance

### Step 8: Populate Scope Document

If the scope document is bare (just the template from /scope):
1. Read all discovered features → add to "In Scope" section
2. Read user interview responses for exclusions → add to "Out of Scope"
3. Add tech stack to "Technical Scope"
4. Add platform info to "Product Definition"

Do NOT overwrite an already-populated scope document. Only fill empty sections.

### Step 9: Report

```
## Plane Migration Complete: [Project Name]

**Project:** [name] ([link])

**Created:**
- [N] milestones
- [N] issues ([N] Done, [N] Todo, [N] In Progress, [N] Backlog)

**Skipped (already existed):**
- [N] milestones
- [N] issues

**Scope document:** [updated / already populated]

**Next step:** Run /onboard-customize to generate project-specific skills and agents.
```

---

## Rules

1. **User confirmation before creating anything in Plane.** Always show the plan first.
2. **Don't duplicate.** Check for existing milestones and issues before creating.
3. **Historical issues are valuable.** Creating Done issues for implemented features gives the project a complete history in Plane from day one.
4. **Gap issues get appropriate priority.** Don't make everything urgent.
5. **Scope population is additive.** Fill empty sections, don't overwrite populated ones.
6. **Idempotent.** Re-running detects existing items and only creates what's missing.
