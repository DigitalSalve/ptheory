---
name: ptheory-update
description: |
  Governs any change to the PTheory framework itself. When you add, modify, rename, or delete
  a skill, agent, or policy — this skill documents the change properly: spec, Plane, lifecycle doc.
  This is the /document-code + /document-plane equivalent for the framework, not a project.
  Use when the user says "/ptheory-update", "update ptheory", or after any framework change.
  Also use proactively — if you just created a skill/agent/policy, run this before moving on.
  This is a global skill — it maintains the PTheory system documentation.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# PTheory Update Skill

Documents any change to the PTheory framework. Run this after creating, modifying, renaming, or deleting any skill, agent, or policy.

- `/ptheory-sync` fixes drift after the fact (reactive)
- `/ptheory-update` documents changes as they happen (proactive)

## When to Use

- Just created a new skill → run this
- Just modified an agent → run this
- Just added a policy → run this
- Just renamed or deleted anything → run this
- User says "/ptheory-update" or "update ptheory docs"
- Before ending a session where framework changes were made

## Process

### Step 1: Identify What Changed

Ask yourself (or the user):
- What was created, modified, renamed, or deleted?
- Which category: skill (chain/utility), agent (orchestrator/advisor/specialist), policy?
- Why was the change made?

If you just made the change in this session, you already know. If the user is telling you about a change, gather the details.

### Step 2: Update PTHEORY_SYSTEM_SPEC.md

Location: `~/.claude/PTHEORY_SYSTEM_SPEC.md`

For each change:

| Change Type | Spec Update |
|-------------|-------------|
| New skill | Add row to appropriate skill table (chain or utility) in section 2.2. Add to directory structure in Part 3. Add to bootstrappable artifacts in Part 4. |
| Modified skill | Update description in skill table if it changed. Note modification in amendment log. |
| Renamed skill | Update old name → new name in skill table, directory structure, chain flow diagram if applicable. |
| Deleted skill | Remove from skill table, directory structure, bootstrappable artifacts. |
| New agent | Add row to appropriate agent table (orchestrator, advisor, specialist). Add to directory structure. |
| Modified agent | Update description/role in agent table. Note in amendment log. |
| New policy | Add to policy directory section 2.4. Add to directory structure. |
| Schema change | Update workflow state section 2.3 if phases changed. |

**Version bump:**
- New skill/agent/policy → minor bump (0.3.0 → 0.4.0)
- Modified existing → patch bump (0.3.0 → 0.3.1)
- Renamed/deleted → minor bump

**Amendment log:** Add dated entry describing what changed and why.

### Step 3: Update Plane Lifecycle Flow Document

Find the document: search Plane documents for "PTheory" or "Lifecycle Flow"

Update the relevant sections:
- Skill inventory tables
- Agent inventory tables
- Chain flow diagram (if a chain skill was added/removed/renamed)
- File locations tree

### Step 4: Update Plane Issues

For each change, find or create the relevant Plane issue in the PTheory project:

| Situation | Action |
|-----------|--------|
| Issue exists for this work (e.g., KEE-230 for /document-review) | Post completion comment, mark Done if complete |
| No issue exists | Create one in the appropriate milestone with completion comment |
| Change is a bug fix or improvement to existing | Create issue or update existing |

Completion comment format (per /document-plane standards):
```markdown
Implemented: [one-line what and why]

| File | Change |
|------|--------|
| `~/.claude/skills/foo/SKILL.md` | Created — [purpose] |

Verified: skill exists, spec updated to v{X}, Plane doc updated.
```

### Step 5: Verify with /ptheory-sync

Run `/ptheory-sync` logic (or invoke the skill) to confirm:
- No drift between filesystem and spec
- All changes reflected in both spec and Plane doc

If drift found → fix it before finishing.

### Step 6: Report

```markdown
## PTheory Update Complete

**Spec:** v{old} → v{new}
**Changes:** {N} items updated

| # | Type | Item | Action |
|---|------|------|--------|
| 1 | Skill | /ptheory-update | Created, added to spec + Plane |
| 2 | Policy | database-migrations.md | Created, added to spec |

**Plane issues updated:** KEE-XXX (Done), KEE-YYY (comment posted)
**Sync verified:** No drift
```

## Rules

1. **Run after every framework change.** No exceptions. If you created a skill, run this before moving on.
2. **Spec is the source of truth.** The spec must always reflect what exists in the filesystem.
3. **Plane tracks the work.** Every change to the framework should have a Plane issue.
4. **Version bump every time.** Even small changes get a patch bump so there's a version trail.
5. **Verify with sync.** Don't trust your own edits — run sync to confirm.
6. **Don't skip this because you're in a hurry.** Undocumented framework changes are how PTheory drifts into the same mess it's designed to prevent.
