# Policy: Sensitive Data in Version Control

**Category:** security
**Applies to:** All projects, all commits, all PRs
**Enforced by:** /sanitize-check, /commit (Step 2b), /pr (Step 2)

---

## MUST NOT

- MUST NOT commit email addresses in any tracked file (source, config, docs, scripts) — use generic labels (`# Google Account 1`, not `# Account 1 (dustin@example.com)`)
- MUST NOT use personal identifiers (email handles, usernames, aliases) as service names, container names, network names, or volume names in Docker Compose or any config committed to git — use generic names (`google-account1`, not `google-dustin`)
- MUST NOT commit API keys, tokens, or secrets as literal values — all credentials MUST be referenced via `${ENV_VAR}` and stored in `.env` (gitignored)
- MUST NOT commit private key material (`-----BEGIN ... PRIVATE KEY-----`)
- MUST NOT commit AWS access key IDs (`AKIA...`) or secret access keys
- MUST NOT commit token literals with known prefixes: `sk_live_`, `sk_test_`, `rnd_`, `ghp_`, `xoxb-`, `SG.`, `key_[a-f0-9]{40}`
- MUST NOT commit plaintext values for variables named `password`, `passwd`, `secret`, `api_key`, or `api_token` — values must be `${VAR}` references

## MUST

- MUST run `/sanitize-check` before every commit and every PR — this is a hard gate, not optional
- MUST use `.env` files (gitignored) for all credential values
- MUST use generic, role-based naming for all infrastructure identifiers in committed files (e.g. `google-account1`, `db-primary`, `worker-node1`)
- MUST ensure `.gitignore` excludes `.env`, `.env.*`, and any file patterns that could contain credentials before the first commit of a new project

## SHOULD

- SHOULD audit comments in committed config files (docker-compose.yml, k8s manifests, CI configs) for any personal identifiers before opening a PR
- SHOULD prefer `${VAR:-}` (empty default) over `${VAR:-some-literal-value}` for sensitive variables — never expose a real value as the fallback
- SHOULD treat internal IP addresses and hostnames as sensitive when hardcoded as non-optional defaults in committed files

## Why

A PR to a private repo exposed personal email addresses and personal handle-derived container names (`google-datcreative`, `dustin@bissee.com`, etc.) across multiple files. GitHub does not allow deleting individual PRs — once pushed, the data is permanent in the PR history. Prevention is the only reliable fix.

## Remediation

If sensitive data is found in a commit or PR:
1. Fix the files immediately — remove or replace with generic labels / env var references
2. Commit the fix with `fix(security): remove sensitive identifiers`
3. Push to update the PR
4. If the repo is public, treat it as a breach — rotate any exposed credentials immediately
5. If the repo is private, audit who has access and confirm no unauthorized viewers
