---
name: pr
description: |
  Create pull requests with standardized format, pre-checks, and proper descriptions.
  Use when the user says "/pr", "create a PR", "open a pull request", "submit PR",
  or when finishing a branch of work that needs review.
  Runs pre-checks, generates description from commits, and creates via gh CLI.
allowed-tools: Read, Glob, Grep, Bash
---

# Pull Request Skill

Create well-structured pull requests with pre-checks and standardized descriptions.

## Process

### Step 1: Pre-flight checks

```bash
# Verify clean state and correct branch
git status
git branch --show-current
git log --oneline main..HEAD  # or appropriate base branch
```

Verify:
- Not on `main` or `master` (should be on a feature branch)
- Working tree is clean (commit or stash changes first)
- Branch has commits ahead of base

### Step 2: Run sanitize check

**Before anything else**, scan the branch diff for sensitive data:

```bash
git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -v "node_modules\|\.venv\|vendor\|\.example\|test@\|example\.com" | \
  grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

git diff main..HEAD | grep "^+" | grep -v "^+++" | grep -E "AKIA[0-9A-Z]{16}"

git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -E "(sk_live_|sk_test_|rnd_|ghp_|xoxb-|SG\.[a-zA-Z0-9]{20,}|key_[a-f0-9]{40})"

git diff main..HEAD | grep "^+" | grep -v "^+++" | grep "BEGIN.*PRIVATE KEY"

git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -iE "(password|passwd|secret|api_key|api_token)\s*=\s*[^$\"{][^\s]+"
```

**If any scan returns matches: STOP.** Report each finding with file and line context. Do not proceed until clean. See `/sanitize-check` skill for full guidance on fixing findings.

### Step 3: Run project validation

Discover and run available checks:
- `npm test` or `flutter test` (tests must pass)
- `npm run lint` or `flutter analyze` (no lint errors)
- `npm run validate:production` (if backend changes)
- `npm run check:schema-migrations` (if schema changes)

All checks must pass before creating the PR.

### Step 3: Push branch

```bash
git push -u origin $(git branch --show-current)
```

### Step 4: Analyze changes for description

```bash
# Get all commits on this branch
git log --oneline main..HEAD

# Get full diff stats
git diff --stat main..HEAD

# Get the actual diff for summary
git diff main..HEAD
```

### Step 5: Create PR via gh CLI

```bash
gh pr create --title "type: concise description" --body "$(cat <<'EOF'
## Summary
- What changed and why (1-3 bullets)

## Changes
- File-level description of key changes

## Testing
- [ ] Tests written and passing
- [ ] Existing tests still pass
- [ ] Manual verification steps

## Related
- Plane issue: KEE-XX (if applicable)
- Related PRs or docs
EOF
)"
```

### Step 6: Report

Output the PR URL and summary to the user.

## Title Format

`type: concise description (ISSUE-ID)`

Types: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

Examples:
- `feat: add favorites system with bookmark UI (KEE-23)`
- `fix: resolve CORS error on profile photo upload`
- `chore: update dependencies and fix TypeScript warnings`

## Rules

- Never create a PR with failing tests
- Never create a PR from `main` or `master`
- Always push the branch before creating the PR
- Always include a summary of what changed and why
- Always include testing checklist
- Include Plane issue ID when one exists
- Never force-push to a PR branch without explicit approval
