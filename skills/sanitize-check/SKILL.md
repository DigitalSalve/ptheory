---
name: sanitize-check
description: |
  Scans staged git changes and PR diffs for sensitive data before committing or
  opening a pull request. Catches email addresses, personal identifiers embedded
  in service/container names, internal IPs in hardcoded defaults, API keys,
  tokens, passwords, and private key material. Blocks the workflow and reports
  findings if anything is detected.
  Called automatically by the /pr and /commit skills as a pre-flight gate.
  Can also be run standalone: "/sanitize-check", "scan for secrets", "check for sensitive data".
allowed-tools: Bash, Grep, Read
---

# Sanitize Check Skill

Scans the diff about to be committed or pushed for sensitive data. Blocks and reports before anything reaches GitHub.

## When to Run

- **Always** — called by `/pr` before creating a PR
- **Always** — called by `/commit` before committing
- Standalone when user says "/sanitize-check", "scan for secrets", "check for sensitive data"

## What to Scan

### 1. Scope

For pre-commit: scan `git diff --cached` (staged changes only).
For pre-PR: scan `git diff main..HEAD` (everything on the branch vs base).

```bash
git diff --cached          # staged (pre-commit)
git diff main..HEAD        # full branch diff (pre-PR)
```

Only look at **added lines** (lines starting with `+`, excluding `+++` file headers).

### 2. Patterns to Flag

Run each check against added lines only. Any match is a FAIL.

| Category | Pattern | Example |
|----------|---------|---------|
| Email addresses | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | `dustin@bissee.com` |
| Personal handles in identifiers | service/container/network names containing a username/handle fragment derived from an email or personal alias | `google-datcreative`, `mcp-google-dustin` |
| Hardcoded private IPs as defaults | literal IPs in `:-` default expressions in compose/env | `${HOST:-172.20.30.141}` |
| API keys / tokens | bare token patterns: 20+ char alphanumeric strings assigned to key/token/secret vars | `API_KEY=abc123xyz...` |
| Private key material | `-----BEGIN ... PRIVATE KEY-----` | RSA/EC/ED25519 key blocks |
| Passwords in plaintext | variable assignment where name contains `password`/`passwd`/`secret` and value is a literal string (not a `${}` reference) | `DB_PASSWORD=hunter2` |
| AWS key patterns | `AKIA[0-9A-Z]{16}` | AWS access key IDs |
| Generic secrets | `sk_`, `rnd_`, `ghp_`, `xoxb-`, `SG.` prefixes | Stripe, Render, GitHub, Slack, SendGrid tokens |

### 3. Allowed / Ignore

Do NOT flag:
- Lines in `workers/node_modules/`, `.venv/`, `vendor/`, `*.lock` files — third-party deps
- Commented-out lines that are already commented (start with `#`) only if they don't contain actual credential values
- `.env.example` or `*.example` files — placeholders are expected
- Variable references like `${SOME_VAR}` — these read from env, not hardcoded
- Test fixture files with obviously fake data (`example.com`, `test@test.com`, `foo@bar.com`)

### 4. Bash scan commands

```bash
# Email addresses in added lines (excluding node_modules, .venv, examples)
git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -v "node_modules\|\.venv\|vendor\|\.example\|test@\|example\.com\|foo@" | \
  grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# AWS key IDs
git diff main..HEAD | grep "^+" | grep -v "^+++" | grep -E "AKIA[0-9A-Z]{16}"

# Common token prefixes
git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -E "(sk_live_|sk_test_|rnd_|ghp_|xoxb-|SG\.[a-zA-Z0-9]|key_[a-f0-9]{40})"

# Private key material
git diff main..HEAD | grep "^+" | grep -v "^+++" | grep "BEGIN.*PRIVATE KEY"

# Plaintext password/secret assignments (value is not a ${} reference)
git diff main..HEAD | grep "^+" | grep -v "^+++" | \
  grep -iE "(password|passwd|secret|api_key|api_token)\s*=\s*[^$\"{][^\s]+"
```

## Process

### Step 1: Determine scan scope

Check what context we're in:
- Called from `/commit` → scan `git diff --cached`
- Called from `/pr` or standalone → scan `git diff {base}..HEAD`

### Step 2: Run all pattern scans

Run each scan from section 2 above. Collect all matching lines with their file path and line context.

### Step 3: Evaluate results

**If no matches:** Report clean and allow the workflow to continue.

```
✓ Sanitize check passed — no sensitive data detected in diff.
```

**If matches found:** STOP. Do not create the commit or PR. Report each finding:

```
✗ Sanitize check FAILED — sensitive data detected:

  [EMAIL] docker-compose.yml
    + # Google Account 1 (dustin@example.com)

  [TOKEN] connectors/google/server.py
    + API_KEY=sk_live_abc123...

Fix these before proceeding. Remove the sensitive values and use environment
variable references (${VAR_NAME}) or .env files (gitignored) instead.
```

### Step 4: Guide the fix

For each finding, suggest the correct pattern:
- **Emails in comments** → remove or replace with generic label (`# Google Account 1`)
- **Hardcoded credentials** → move to `.env` (gitignored) and reference as `${VAR_NAME}`
- **Personal identifiers in names** → use generic names (`google-account1` not `google-dustin`)
- **Private keys** → never commit; use secret manager or env var

### Step 5: Re-run after fix

Once the user has fixed the findings, re-run the scan to confirm clean before proceeding.

## Rules

1. **Block on any finding** — do not proceed with commit or PR creation until clean.
2. **Never suppress or whitelist a real credential** — if it looks like a real token, flag it.
3. **Scan added lines only** — do not flag pre-existing issues in unchanged lines (handle separately if asked).
4. **Report file + context** — always show which file and the offending line so it's actionable.
5. **Skip dependency directories** — `node_modules`, `.venv`, `vendor`, lock files are never project code.
