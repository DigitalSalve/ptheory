---
name: ptheory-sync
description: |
  Self-documentation for the PTheory framework. Scans all skills, agents, and policies,
  compares against PTHEORY_SYSTEM_SPEC.md and Plane, and updates everything to match reality.
  Use when the user says "/ptheory-sync", "sync ptheory docs", "update the spec",
  "are the ptheory docs current", or after making changes to any PTheory skill/agent/policy.
  This is the framework eating its own dog food — PTheory documenting PTheory.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# PTheory Sync Skill

Keeps PTheory's documentation in sync with its actual state. Scans reality, compares to docs, updates docs.

- Prevents drift between what exists and what's documented
- Run after any change to skills, agents, or policies
- The framework's own documentation chain

## When to Use

- After creating, renaming, or deleting any skill, agent, or policy
- User says "/ptheory-sync", "sync ptheory", "update the spec"
- Before declaring any PTheory component as contract-ready
- Periodically to catch undocumented drift

## What It Syncs

| Source of Truth | Documents Updated |
|----------------|-------------------|
| `~/.claude/skills/*/SKILL.md` | PTHEORY_SYSTEM_SPEC.md skill inventory |
| `~/.claude/agents/*.md` | PTHEORY_SYSTEM_SPEC.md agent inventory |
| `~/.claude/skills/implement/policies/**/*.md` | PTHEORY_SYSTEM_SPEC.md policy directory |
| `~/.claude/workflows/SCHEMA.md` | PTHEORY_SYSTEM_SPEC.md workflow state section |
| All of the above | Plane lifecycle flow document |
| Plane PTheory issues | Cross-check: Done issues vs created artifacts |

## Process

### Step 1: Scan Reality

1. List all skill directories at `~/.claude/skills/*/SKILL.md`
2. List all agent files at `~/.claude/agents/*.md`
3. List all policy files at `~/.claude/skills/implement/policies/**/*.md`
4. Read the workflow state schema at `~/.claude/workflows/SCHEMA.md`
5. For each skill/agent, read the frontmatter (name, description)

### Step 2: Read Current Documentation

1. Read `~/.claude/PTHEORY_SYSTEM_SPEC.md`
2. Read the Plane lifecycle flow document (search Plane for "PTheory" documents)
3. Read the workflow chain design plan at `~/.claude/plans/workflow-chain-design.md`

### Step 3: Diff — What's Different?

Compare reality (Step 1) against documentation (Step 2):

| Check | What It Catches |
|-------|----------------|
| Skills in filesystem but not in spec | New skill created, never documented |
| Skills in spec but not in filesystem | Documented skill deleted or renamed |
| Agents in filesystem but not in spec | New agent created, never documented |
| Agents in spec but not in filesystem | Documented agent deleted or renamed |
| Policies in filesystem but not in spec | New policy written, never documented |
| Skill name in frontmatter doesn't match directory name | Rename happened partially |
| Workflow schema phases don't match spec | Schema updated but spec not |
| Spec says "TO BUILD" but file exists | Built but spec not updated |
| Spec says "CREATED" but file missing | Deleted but spec not updated |

### Step 4: Report Drift

```markdown
## PTheory Sync Report

**Date:** YYYY-MM-DD
**Spec version:** {current version}

### Drift Found

| # | Type | Item | Issue |
|---|------|------|-------|
| 1 | Skill | /foo | In filesystem, not in spec |
| 2 | Agent | bar-agent | In spec as "TO BUILD", exists in filesystem |
| 3 | Policy | security/hipaa.md | In spec, not in filesystem |

### No Drift (confirmed in sync)
- [N] skills match
- [N] agents match
- [N] policies match
```

### Step 5: Fix Drift

For each drift item:

1. **Skill/agent/policy exists but not in spec** → Add to PTHEORY_SYSTEM_SPEC.md in the correct table
2. **Spec says exists but file missing** → Remove from spec or flag as "DELETED"
3. **Spec says "TO BUILD" but file exists** → Update to "CREATED"
4. **Name mismatch** → Update spec to match filesystem (filesystem is truth)

### Step 6: Update PTHEORY_SYSTEM_SPEC.md

1. Update the skill inventory table
2. Update the agent inventory table
3. Update the policy directory section
4. Update the workflow state section if schema changed
5. Increment the version (patch bump: 0.2.0 → 0.2.1)
6. Add entry to the amendment log

### Step 7: Update Plane Lifecycle Flow Document

1. Find the PTheory lifecycle flow document in Plane
2. Update skill/agent lists to match current state
3. Update the chain flow diagram if new skills affect the chain

### Step 8: Cross-Check Plane Issues

1. List all PTheory project issues in Plane
2. For each Done issue that creates an artifact (skill, agent, policy):
   - Verify the artifact exists in the filesystem
   - If missing → flag as "Done but artifact not found"
3. For each artifact in filesystem:
   - Check if a Done issue tracks its creation
   - If no issue → note as "created without tracking"

### Step 9: Report

```markdown
## Sync Complete

**Spec updated to:** v{new version}
**Changes:** {N} drift items fixed
**Plane doc:** updated / no changes needed
**Cross-check:** {N} issues verified, {N} discrepancies

### Changes Made
| # | File | Change |
|---|------|--------|
| 1 | PTHEORY_SYSTEM_SPEC.md | Added /foo skill to inventory |
| 2 | Plane doc | Updated agent table |
```

## Rules

1. **Filesystem is truth.** If a file exists, the docs should reflect it. If a file doesn't exist, the docs shouldn't claim it does.
2. **Don't create missing artifacts.** This skill documents — it doesn't build. If a skill is missing, report it. Don't create it.
3. **Don't delete artifacts.** If a file exists but isn't in the spec, add it to the spec. Don't delete the file.
4. **Version bump on every sync.** Even if nothing changed, bump the patch version so there's a record.
5. **Amendment log entry on every sync.** What changed and why.
