---
name: cleanup-branches
description: |
  Audits and cleans up stale git worktrees and branches — both local AND remote. Lists all
  worktrees and branches, compares each against the primary branch (staging or main), identifies
  which have unique uncommitted work vs which are stale, and deletes stale ones after user
  confirmation. Always asks before touching remote branches. Also surfaces stashes and untracked
  files that may contain salvageable work.
  Use when the user says "/cleanup-branches", "clean up worktrees", "clean up branches",
  "resolve worktrees", "too many branches", "branch cleanup", or "prune branches".
  This is a global skill — works with any git repository.
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Cleanup Branches Skill

Audits all git worktrees and branches (local AND remote), classifies each as stale or active, and bulk-removes stale ones. Always asks before deleting remote branches. Surfaces any work worth saving before deletion.

## When to Use

- User says "/cleanup-branches", "clean up branches", "clean up worktrees", "prune branches"
- Multiple abandoned `claude/*` worktree branches have accumulated
- Before starting a new milestone to ensure a clean repo state
- When `git worktree list` or `git branch` shows excessive entries

## Protected Branch Names

These branch names are **always protected** — never delete locally or remotely:

`main`, `master`, `staging`, `production`, `develop`, `dev`, `release`, `trunk`

Also protect: the current branch, and any branch currently checked out in a worktree.

## Process

### Step 1: Identify Primary Branch

Determine the repo's primary integration branch. Check which of these exist and is the current branch:

```bash
git branch --show-current
git rev-parse --verify staging 2>/dev/null && echo "staging exists"
git rev-parse --verify main 2>/dev/null && echo "main exists"
```

**Primary branch priority:** Use whichever branch the main worktree is on. Typically `staging` (development integration) or `main` (production). If both exist, compare branches against both.

### Step 2: List All Worktrees

```bash
git worktree list --porcelain
```

Parse output to build a map of:
- Main worktree path and branch
- All linked worktrees, their paths, and branches
- Which worktrees are the current session (never touch these)

### Step 3: Check Worktree Status

For each linked worktree, check for uncommitted changes:

```bash
git -C {worktree_path} status --porcelain
```

### Step 4: List and Classify All Local Branches

For every local branch, compute its relationship to the primary branch:

```bash
PRIMARY_SHA=$(git rev-parse {primary_branch})
for branch in $(git branch | sed 's/[+* ]//g'); do
  SHA=$(git rev-parse "$branch")
  AHEAD=$(git rev-list {primary_branch}.."$branch" --count 2>/dev/null)
  BEHIND=$(git rev-list "$branch"..{primary_branch} --count 2>/dev/null)
done
```

Classify each branch into one of these categories:

| Category | Criteria | Action |
|----------|----------|--------|
| **IDENTICAL** | Same SHA as primary branch, 0 ahead | Safe to delete |
| **STALE** | 0 commits ahead, N commits behind | Safe to delete — no unique work |
| **HAS UNIQUE WORK** | >0 commits ahead | Inspect commits; check if already merged into primary or main |
| **PROTECTED** | `main`, `staging`, etc. or current branch | Never delete |

For branches with unique work, check if that work is already on the primary branch:

```bash
# Show the unique commits
git log {primary_branch}..{branch} --oneline

# Check if all those commits exist on primary or main
git branch --contains {branch_tip_sha}
```

If all unique commits are already reachable from main or staging, the branch is **MERGED** and safe to delete.

### Step 5: List and Classify All Remote Branches

Fetch the remote branch list without pulling:

```bash
git fetch --prune
git branch -r
```

For each remote branch (e.g. `origin/feature/foo`), strip the `origin/` prefix and apply the same classification as local branches — comparing against `origin/main` or `origin/staging`.

Skip any remote branch whose name matches the protected list (`main`, `master`, `staging`, `production`, `develop`, `dev`, `release`, `trunk`).

Also note which remote branches have **no corresponding local branch** — these are often safe orphans.

### Step 6: Surface Stashes

```bash
git stash list
```

Report any stashes, noting which branch they were created on (visible in the stash description). Stashes survive branch deletion.

### Step 7: Present Full Report to User

Present a clear summary grouped by category, with local and remote sections separate:

```
## Branch Audit Report

### Protected (will NOT be touched)
- main — production branch
- staging — current branch (main worktree)

### Local — Safe to Delete (no unique work)
- claude/foo — identical to staging
- claude/bar — 0 ahead, 45 behind (stale)
- claude/baz — 6 ahead, all already on main (merged)

### Local — Has Unique Work (needs review)
- feature/xyz — 3 commits ahead of staging:
  - abc1234 feat: add widget
  - def5678 fix: widget color

### Remote — Safe to Delete (no unique work)
- origin/feature/old-thing — 0 ahead, stale
- origin/fix/something — already merged into main

### Remote — Has Unique Work (needs review)
- origin/feature/xyz — 3 commits ahead, not yet in main

### Active Worktrees
- /path/to/worktree (claude/current-session) — THIS SESSION, will not touch

### Stashes
- stash@{0}: WIP on feature/old — may contain work

### Untracked Files of Note
- backend/db/migrations/20260305_something.sql — untracked migration file
```

### Step 8: Confirm Local Deletions

Ask the user to confirm deletion of local "Safe to Delete" branches:

"I found {N} local branches safe to delete. Delete them all?"

Options:
1. Delete all safe local branches
2. Let me pick which ones to keep
3. Cancel

### Step 9: Execute Local Cleanup

**Remove worktrees first** (for any branches that have a linked worktree):

```bash
git worktree remove {path}
```

**Then delete local branches:**

```bash
git branch -D {branch1} {branch2} {branch3} ...
```

Use `-D` (force) since stale branches behind primary won't be considered "merged" by git.

**Never delete in the same command as the current worktree branch.**

### Step 10: Confirm Remote Deletions (ALWAYS ASK SEPARATELY)

**Always ask the user explicitly before deleting any remote branches**, even if they are clearly stale. Present the list and ask:

"I found {N} remote branches safe to delete from GitHub. Delete them?"

Options:
1. Delete all safe remote branches
2. Let me pick which ones to keep
3. Skip — leave remote branches as-is

If confirmed, delete in a single command:

```bash
git push origin --delete {branch1} {branch2} {branch3} ...
```

### Step 11: Verify and Report

```bash
git worktree list
git branch
git branch -r
```

Report final state:
- How many local branches deleted / remain
- How many remote branches deleted / remain
- Any stashes still present
- Any untracked files mentioned

## Rules

1. **NEVER delete protected branches**: `main`, `master`, `staging`, `production`, `develop`, `dev`, `release`, `trunk` — locally or remotely.
2. **NEVER remove the current session's worktree.** This kills the session.
3. **NEVER delete branches with unique unmerged work without explicit user approval per branch.**
4. **ALWAYS ask separately before deleting remote branches.** Local and remote confirmations are two distinct steps.
5. **Clean worktrees (no changes, no unique commits) can be removed without per-worktree confirmation** — batch confirmation is sufficient.
6. **Always present the full audit before deleting anything.** User sees what will happen first.
7. **Stashes are preserved.** Branch deletion does not affect stashes. Mention this to reassure the user.
8. **Untracked files in worktree directories may be lost on worktree removal.** Warn if any are found.
9. **Batch deletions into a single command** for efficiency — one `git branch -D` for locals, one `git push origin --delete` for remotes.
10. **Run from the main worktree**, not from a linked worktree, when possible. If running from a linked worktree, skip self-deletion.
