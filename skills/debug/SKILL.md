---
name: debug
description: |
  Structured debugging workflow — reproduce, isolate, fix, test, document.
  Use when the user says "/debug", "debug this", "why is this broken",
  "this isn't working", or when investigating any error or unexpected behavior.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent
---

# Debug Skill

Structured debugging. Don't guess — investigate systematically.

## Process

### Step 1: Understand the symptom

Ask or determine:
- What is the expected behavior?
- What is the actual behavior?
- When did it start? What changed?
- Is it reproducible? How?

### Step 2: Reproduce

Find the minimal steps to reproduce. If it's an API error:
```bash
curl -X GET http://localhost:3000/api/endpoint
```

If it's a UI issue, identify the screen and action.

### Step 3: Read the code path

Trace the full execution path:
1. Entry point (route handler, screen, button tap)
2. Business logic (service, library function)
3. Data layer (DB query, API call)
4. Response/rendering

Read every file in the path. Do not assume.

### Step 4: Isolate the cause

Use these techniques in order:
1. **Read error messages** — stack traces point to the exact line
2. **Check recent changes** — `git log --oneline -10`, `git diff HEAD~3`
3. **Check data** — is the DB/API returning what's expected?
4. **Check config** — env vars, feature flags, permissions
5. **Add targeted logging** — only if steps 1-4 don't reveal the cause

### Step 5: Fix

- Fix the root cause, not the symptom
- Don't add workarounds or try/catch that swallow errors
- If the fix is in multiple files, understand why before changing

### Step 6: Write a regression test

Create a test that would have caught this bug:
```
it("returns groups with null state (national level)", () => { ... })
```

### Step 7: Verify

- Run the reproduction steps — bug is gone
- Run full test suite — no regressions
- The new regression test passes

### Step 8: Document

If this was a Linear issue, post the completion comment with root cause analysis.

## Common Debugging Patterns

### API returns wrong data
1. Check the route handler query
2. Check DB schema matches expectations
3. Check for WHERE clause filtering too aggressively

### UI shows stale/wrong data
1. Check if the API response is correct (network tab / curl)
2. Check if the model parsing is correct (fromJson)
3. Check if state is being updated (setState / provider invalidation)

### Auth/permission errors
1. Check token is present and valid
2. Check middleware is running in the right order
3. Check role/permission logic

### "Works locally, broken in production"
1. Check env vars on production
2. Check database state (missing migration?)
3. Check CORS, SSL, domain configuration

## Rules

- Never add `try/catch` that silently swallows errors as a "fix"
- Never add TODO comments instead of actually fixing
- Always write a regression test
- Fix root cause, not symptoms
