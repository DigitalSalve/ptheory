---
name: commit
description: |
  Standardized commit workflow with pre-commit checks.
  Use when the user says "/commit", "commit this", "commit changes", or when finishing implementation work.
  Runs tests, validates schema, stages files, and creates a properly formatted commit message.
allowed-tools: Read, Glob, Grep, Bash
---

# Commit Skill

Standardized commit workflow. Never skip pre-commit checks.

## Process

### Step 1: Check what changed

```bash
git status
git diff --stat
```

### Step 2: Run pre-commit checks

Discover and run the project's test/validation commands:
- Check `package.json` for test scripts
- Check for `flutter test` if Flutter project
- Check for validation scripts (`validate:production`, `lint`, etc.)
- Check for schema sync scripts if DB changes present

All checks must pass before committing.

### Step 2b: Run sanitize check on staged changes

Before staging, scan what's about to be committed for sensitive data:

```bash
git diff --cached | grep "^+" | grep -v "^+++" | \
  grep -v "node_modules\|\.venv\|vendor\|\.example\|test@\|example\.com" | \
  grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

git diff --cached | grep "^+" | grep -v "^+++" | grep -E "AKIA[0-9A-Z]{16}"

git diff --cached | grep "^+" | grep -v "^+++" | \
  grep -E "(sk_live_|sk_test_|rnd_|ghp_|xoxb-|SG\.[a-zA-Z0-9]{20,}|key_[a-f0-9]{40})"

git diff --cached | grep "^+" | grep -v "^+++" | grep "BEGIN.*PRIVATE KEY"

git diff --cached | grep "^+" | grep -v "^+++" | \
  grep -iE "(password|passwd|secret|api_key|api_token)\s*=\s*[^$\"{][^\s]+"
```

**If any scan returns matches: STOP.** Report findings and do not commit. See `/sanitize-check` for fix guidance.

### Step 3: Stage specific files

```bash
git add path/to/specific/file1 path/to/specific/file2
```

- Never use `git add .` or `git add -A`
- Never stage `.env`, credentials, or secrets
- Review each file being staged

### Step 4: Write commit message

Format: `type: description (ISSUE-ID)`

Types: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

```bash
git commit -m "$(cat <<'EOF'
feat: add favorites system with bookmark UI (KEE-23)

Backend: user_favorites table, 4 CRUD endpoints.
Flutter: FavoriteButton widget, API methods, candidate card integration.

Patch: KEE-23
EOF
)"
```

- First line: type + concise description + issue ID
- Body: what changed and why (not how)
- Keep first line under 72 characters

### Step 5: Verify

```bash
git log --oneline -1
git status
```

## Rules

- Never commit with `--no-verify`
- Never commit secrets or `.env` files
- Never use `git add .` — stage specific files
- Always run tests before committing
- Always include issue ID when one exists
