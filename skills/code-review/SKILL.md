---
name: code-review
description: |
  Code review checklist — conventions, security, tests, documentation.
  Use when the user says "/code-review", "check my code", "review the code",
  or before creating a PR. Audits staged or recent changes for code quality and completeness.
  This is NOT the QA/journey review (/review). This checks code-level concerns only.
  This is a global skill — works with any project.
allowed-tools: Read, Glob, Grep, Bash
---

# Code Review Skill

Structured code review for quality, security, and completeness. This is a **quality gate**, not a lifecycle phase — it does NOT update the workflow state file.

**This is NOT the QA/journey review.** That's `/review`. This skill checks code conventions, security, test coverage, and documentation completeness.

## When to Use

- Before creating a PR
- User says "/code-review", "check my code", "review the code quality"
- Can be invoked within /implement or standalone
- Does NOT participate in the workflow chain — no phase tracking

## Process

### Step 1: Identify what to review

```bash
git diff --stat HEAD~1   # last commit
git diff --staged        # staged changes
git diff main...HEAD     # branch changes
```

### Step 2: Read every changed file

Read each file completely. Do not skim.

### Step 3: Check against this checklist

**Correctness**
- [ ] Does the code do what the issue/task requires?
- [ ] Are edge cases handled (null, empty, invalid input)?
- [ ] Are error states handled gracefully?

**Conventions**
- [ ] File naming follows project conventions
- [ ] Code naming follows project conventions (check CLAUDE.md)
- [ ] Import order is correct
- [ ] No hardcoded values that should be config/env
- [ ] **Import sources match existing patterns.** Do other files in the same directory import from the same modules? If new file imports from `foo.js` but siblings import from `bar.js` for the same purpose → flag as CRITICAL.
- [ ] **All imports resolve.** Every imported name must exist as an export in the target module. Grep to verify — don't trust that it "looks right."

**Security (Top 11 — mandatory, per security-engineer agent + owasp.md policy)**
- [ ] 1. **SQL Injection** — parameterized queries only, no string concatenation in SQL
- [ ] 2. **XSS** — no `innerHTML`/`dangerouslySetInnerHTML` without sanitization
- [ ] 3. **CSRF** — SameSite on cookies, CSRF tokens on state-changing forms
- [ ] 4. **Broken Auth** — auth middleware on all protected routes, rate limiting on login
- [ ] 5. **ADOR** — ownership checks on every resource access, no IDOR via predictable IDs
- [ ] 6. **Open Redirects** — redirect URLs validated against allowlist
- [ ] 7. **Directory Traversal** — file paths from user input sanitized, `../` blocked
- [ ] 8. **Exposed APIs** — no unprotected endpoints that should be protected
- [ ] 9. **Default Creds** — no hardcoded passwords/keys/tokens in source
- [ ] 10. **Outdated Libs** — `npm audit` or equivalent clean
- [ ] 11. **Misconfigured CORS** — explicit allowlist, no wildcard with credentials
- [ ] All authentication paths identified and documented (Operator Gate)
- [ ] No elevated permissions beyond core function requirements (Operator Gate: access scope)
- [ ] Data exposure risks documented with scope and severity (Operator Gate)

**Tests**
- [ ] New code has corresponding tests
- [ ] Tests cover happy path + error cases
- [ ] All tests pass

**Documentation**
- [ ] Affected docs updated
- [ ] New features have feature notes
- [ ] API changes reflected in docs

**No Shortcuts**
- [ ] No TODO comments introduced
- [ ] No hardcoded stubs or mock data
- [ ] No base64 storage where file storage should be used
- [ ] No `console.log` left in production code

### Step 4: Report findings

```markdown
## Code Review

**Files reviewed:** X files

### Passed
- Correctness: OK
- Conventions: OK

### Issues Found
1. **[SEVERITY]** file:line — description
2. **[SEVERITY]** file:line — description

### Suggestions (non-blocking)
- Consider extracting X into a shared utility

### Verdict
[APPROVE / REQUEST CHANGES]
```

Severities: **CRITICAL** (must fix), **MAJOR** (should fix), **MINOR** (nice to fix)
