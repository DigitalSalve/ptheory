---
name: resolve-worktree
description: |
  Detects and resolves worktree conflicts before pushing to a target branch.
  Checks if the target branch is checked out in another worktree, identifies
  uncommitted changes, and resolves the situation (commit+remove, or notify user).
  Called by /push-staging and /push-production before merge operations.
  This is a global skill — works with any project.
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Resolve Worktree Skill

Detects and resolves worktree conflicts that would block a merge or push to a target branch.

## The Problem

Git won't let you checkout or merge into a branch that's already checked out in another worktree. This happens frequently when sessions create worktrees and crash or are abandoned without cleanup.

## When to Use

- Called by `/push-staging` or `/push-production` before merge
- User says "/resolve-worktree", "fix worktree", "worktree conflict"
- Any time a git operation fails because a branch is checked out elsewhere

## Process

### Step 1: Detect Worktrees

```bash
git worktree list
```

Parse output. Identify:
- Main worktree path and branch
- All linked worktrees, their paths, and branches
- Which worktree (if any) has the target branch checked out

### Step 2: Check Target Branch

If the target branch (e.g., `staging` or `main`) is NOT checked out in any worktree → **PASS.** No conflict. Return success.

If the target branch IS checked out in another worktree → proceed to Step 3.

### Step 3: Assess the Conflicting Worktree

Check the conflicting worktree for:

1. **Uncommitted changes?** `git -C {worktree_path} status --porcelain`
2. **Unpushed commits?** `git -C {worktree_path} log @{u}..HEAD --oneline 2>/dev/null`
3. **Is it the current session's worktree?** Compare paths.

### Step 4: Resolve

**If no uncommitted changes and no unpushed commits:**
- Safe to remove. Run `git worktree remove {path}`
- Report: "Removed abandoned worktree at {path}"

**If uncommitted changes exist:**
- Ask user: "Worktree at {path} has uncommitted changes on {branch}. Options:"
  1. Commit changes and remove worktree
  2. Stash changes and remove worktree
  3. Leave worktree, abort push
- If option 1: stage all, commit with message "chore: commit abandoned worktree changes", then remove
- If option 2: stash, remove worktree (changes recoverable via `git stash list`)
- If option 3: STOP. Return failure with explanation.

**If unpushed commits exist:**
- Ask user: "Worktree at {path} has {N} unpushed commits on {branch}. Options:"
  1. Push commits and remove worktree
  2. Leave worktree, abort push
- If option 1: push, then remove
- If option 2: STOP. Return failure.

**If it's the current session's worktree:**
- NEVER remove your own worktree (this kills the session — learned the hard way)
- Ask user: "You're currently IN a worktree on {branch}. You need to exit this worktree first or work from the main repo."
- Return failure with explanation.

### Step 5: Verify Resolution

After removal, verify:
```bash
git worktree list
```
Confirm target branch is no longer checked out in any worktree.

## Output

Return structured result:

```yaml
resolved: true|false
target_branch: staging|main
conflict_found: true|false
action_taken: removed|committed_and_removed|stashed_and_removed|aborted|none
worktree_path: /path/if/conflict
details: "human-readable explanation"
```

## Rules

1. **NEVER remove the current session's worktree.** This kills the session.
2. **Always ask before committing or stashing someone else's work.**
3. **Clean worktrees (no changes, no unpushed commits) can be removed without asking.**
4. **Report everything.** The calling skill needs to know what happened.
