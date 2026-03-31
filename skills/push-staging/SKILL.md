---
name: push-staging
description: |
  Merges current branch into staging and pushes. The primary push target for development work.
  Resolves worktree conflicts, handles merge conflicts, and ensures clean push.
  Called by the repo-orchestrator agent or directly by the user.
  Use when the user says "/push-staging", "push to staging", "merge to staging",
  "deploy to staging", or when finishing implementation work.
  This is a global skill — works with any project that uses a staging branch.
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Push Staging Skill

Merges current branch into staging and pushes to remote. This is the default push target — staging is where all development work goes first.

## When to Use

- User says "/push-staging", "push to staging", "merge to staging"
- After implementation work is committed and ready for integration
- Called by repo-orchestrator agent as part of the push workflow

## Process

### Step 1: Pre-Flight Checks

1. **Uncommitted changes?** `git status --porcelain`
   - If dirty → STOP. "Commit or stash changes before pushing."
2. **Current branch?** `git branch --show-current`
   - If already on staging → just push: `git push origin staging`
   - If on another branch → proceed to merge flow
3. **Remote up to date?** `git fetch origin`

### Step 2: Resolve Worktree Conflicts

Run `/resolve-worktree` targeting the `staging` branch.

- If resolved → proceed
- If failed → STOP. Report the issue to the user.

### Step 3: Merge Into Staging

```bash
# Save current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Checkout staging
git checkout staging

# Pull latest
git pull origin staging

# Merge current branch
git merge $CURRENT_BRANCH --no-edit
```

### Step 4: Handle Merge Conflicts

If merge conflicts occur:
1. List conflicting files
2. For each conflict:
   - Show the conflict markers
   - Attempt auto-resolution (prefer the incoming branch for code, prefer staging for config)
   - If can't auto-resolve → ask user which version to keep
3. After resolving all conflicts:
   ```bash
   git add .
   git commit --no-edit
   ```

### Step 5: Push

```bash
git push origin staging
```

If push fails (rejected):
1. Pull with rebase: `git pull --rebase origin staging`
2. Retry push
3. If still fails → report to user

### Step 6: Return to Working Branch

```bash
git checkout $CURRENT_BRANCH
```

### Step 7: Report

```markdown
Pushed to staging:
- Branch: {current_branch} → staging
- Commits: {N} new commits merged
- Conflicts: {none / N resolved}
- Remote: origin/staging updated
```

## Rules

1. **Staging is the default target.** No user confirmation needed — staging is safe to push to.
2. **Always resolve worktrees first.** Don't try to checkout a branch that's in another worktree.
3. **Always return to the working branch.** Don't leave the user on staging.
4. **Never force push.** If push is rejected, rebase and retry. If that fails, report.
5. **Merge conflicts require resolution.** Don't skip or abort — resolve them.
