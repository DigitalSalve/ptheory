---
name: onboard
description: |
  New session startup — read project context, check state, identify work to do.
  Use when the user says "/onboard", "get up to speed", "what's going on",
  "catch me up", "start session", or at the beginning of a new work session.
  Reads project docs, checks git state, reviews Plane backlog, and identifies priorities.
allowed-tools: Read, Glob, Grep, Bash
---

# Onboard Skill

Quick session startup to understand project state and identify what to work on.

## Process

### Step 1: Read project context

1. Check for `AI.md` at project root — read it (entry point)
2. Check for `.claude/CLAUDE.md` or root `CLAUDE.md` — read it (project config)
3. Identify project type (Flutter, Node, React, etc.)

### Step 2: Check git state

```bash
echo "=== Branch ==="
git branch --show-current

echo "=== Uncommitted changes ==="
git status --short

echo "=== Recent commits (last 10) ==="
git log --oneline -10

echo "=== Stashed changes ==="
git stash list
```

Flag:
- Uncommitted changes that need attention
- Work-in-progress branches
- Stashed changes that might be forgotten

### Step 3: Check project health

Run a quick health check:
- Are dependencies installed?
- Do tests pass?
- Is the schema in sync?
- Is the API healthy?

(Use the /status skill approach but keep it brief)

### Step 4: Check Plane backlog (if Plane MCP/API available)

Look for:
- Issues assigned to current user that are In Progress
- High-priority unassigned issues
- Recently updated issues

### Step 5: Check coordination files (if project uses them)

Look for:
- Active work items (`docs/08-status/coordination/active-work/`)
- Pending directives (`docs/08-status/coordination/directives/`)
- Unanswered Q&A (`docs/08-status/coordination/qa/`)

### Step 6: Summarize

Present a brief session start summary:

```
📋 Session Start Summary
━━━━━━━━━━━━━━━━━━━━━━━

🔀 Branch: feature/xyz
📝 Uncommitted: 3 files modified
✅ Tests: passing
✅ Schema: in sync
🟢 API: healthy

🎯 In Progress:
- KEE-42: Add favorites system (3 sub-tasks remaining)

⚡ Suggested next:
- Continue KEE-42 (already in progress)
- Or pick up KEE-45 (high priority, unassigned)
```

## Rules

- Keep it fast — don't run full test suites, just quick checks
- Don't make changes — just report state
- Highlight anything that needs immediate attention (uncommitted work, failing tests)
- Suggest concrete next steps based on what you find
