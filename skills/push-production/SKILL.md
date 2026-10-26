---
name: push-production
description: |
  Merges staging (or current branch) into main/production and pushes. REQUIRES explicit user confirmation.
  Resolves worktree conflicts, runs pre-deploy validation, handles merge conflicts, and ensures clean push.
  Called by the repo-orchestrator agent or directly by the user.
  Use when the user says "/push-production", "push to production", "push to main",
  "deploy to production", "ship it", or when staging is validated and ready for production.
  This is a global skill — works with any project that uses a main/production branch.
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Push Production Skill

Merges into main/production and pushes. **Always requires explicit user confirmation.** Production pushes are never automatic.

## When to Use

- User says "/push-production", "push to production", "push to main", "ship it"
- After staging has been validated and is ready for production
- Called by repo-orchestrator agent — but ONLY after user confirms

## Process

### Step 0: MANDATORY User Confirmation

**Before doing ANYTHING else:**

Ask the user: "You're about to push to production (main). This triggers a live deployment. Confirm?"

- If user confirms → proceed
- If user does not confirm → STOP. Do nothing.

**This gate cannot be bypassed. No automation, no agent, no skill can skip this step.**

### Step 1: Pre-Flight Checks

1. **Identify production branch:** Check for `main` or `master`
   ```bash
   git remote show origin | grep "HEAD branch"
   ```
2. **Uncommitted changes?** `git status --porcelain`
   - If dirty → STOP. "Commit or stash changes before pushing."
3. **What to merge?** Default: merge `staging` into production. If no staging branch, merge current branch.
4. **Remote up to date?** `git fetch origin`

### Step 2: Pre-Deploy Validation

If the project has validation scripts, run them:

```bash
# Check for common validation commands
cd backend && npm run validate:production 2>/dev/null
```

- If validation fails → STOP. "Pre-deploy validation failed. Fix issues before pushing to production."
- If no validation script → warn but proceed

### Step 3: Resolve Worktree Conflicts

Run `/resolve-worktree` targeting the production branch (main/master).

- If resolved → proceed
- If failed → STOP. Report the issue.

### Step 4: Merge Into Production

```bash
# Determine source (staging preferred, current branch fallback)
SOURCE_BRANCH=staging

# Checkout production
git checkout main

# Pull latest
git pull origin main

# Merge source
git merge $SOURCE_BRANCH --no-edit
```

### Step 5: Handle Merge Conflicts

If merge conflicts occur:
1. List conflicting files
2. **STOP and ask user.** Production merge conflicts are NEVER auto-resolved.
3. Show each conflict and ask user which version to keep
4. After user resolves all:
   ```bash
   git add .
   git commit --no-edit
   ```

### Step 6: Final Confirmation

Ask user: "Merge complete. {N} commits ready to push to production. Push now?"

- If yes → push
- If no → offer to abort: `git merge --abort` and return to previous branch

### Step 7: Push

```bash
git push origin main
```

If push fails:
1. **Do NOT force push.** Ever. On production.
2. Report the failure to the user
3. Suggest: "Pull latest and retry, or investigate the conflict."

### Step 8: Return to Working Branch

```bash
git checkout $PREVIOUS_BRANCH
```

### Step 9: Report

```markdown
Pushed to production:
- Source: {source_branch} → main
- Commits: {N} new commits merged
- Conflicts: {none / N resolved by user}
- Validation: {passed / skipped}
- Remote: origin/main updated
- Deploy: will trigger automatically on Render (or equivalent)
```

## Rules

1. **ALWAYS require user confirmation.** Twice — once before starting, once before pushing.
2. **NEVER auto-resolve merge conflicts on production.** User decides.
3. **NEVER force push to production.** If rejected, investigate.
4. **Run validation if available.** Validation failure blocks the push.
5. **Staging is the preferred source.** Don't merge feature branches directly to production unless user explicitly requests it.
6. **Always return to the working branch.** Don't leave the user on main.
