---
name: test
description: |
  Writes and runs tests as a separate chain phase. Reads the workflow state file and plan file
  for test strategy. Marks test phase complete when all tests pass.
  Use when the user says "run tests", "test this", "write tests", "add tests", "/test",
  or automatically invoked by the chain after /implement + /document-code + /document-linear complete.
  Part of the PTheory skill chain — handles ALL testing. /implement no longer writes tests.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Test Skill

Writes and runs tests as a dedicated chain phase. Reads the workflow state file for gating and the plan file for test strategy.

**This is a global skill.** Works with any project. Supports Flutter (flutter_test), Node/TypeScript (vitest/jest), and general test suites.

## Two Modes

- **Chain mode:** Invoked after /implement → /document-code → /document-linear. Reads workflow state. Writes and runs tests per the plan. Marks `test: complete`.
- **Standalone mode:** User says "/test" or "run tests" outside the chain. Discovers and runs tests without workflow state tracking.

## Chain Mode Process

### Step 0: Read Workflow State

1. Find the active workflow state file at `~/.claude/workflows/`
2. Find the issue being tested
3. Check prerequisites:
   - `implement_doc_code` must be `complete`
   - `implement_doc_linear` must be `complete`
   - If not → **STOP**: "Implementation documentation must be complete before testing."
4. Check if `test` is already `complete` → **STOP**: "Already tested. Next: /document-code"
5. If `test` is `in_progress` → ask user: resume or reset?

### Step 1: Mark In Progress

Update workflow state: set `test: in_progress`. Update `updated` date.

### Step 2: Read Test Strategy from Plan

1. Find the plan file in `.claude/plans/` for this milestone
2. Read the issue's `tests_to_write` — test files to create
3. Read the issue's `tests_to_run` — existing tests for regression
4. This is the test contract — follow it

### Step 3: Discover Test Infrastructure

1. Check for test frameworks: `package.json` scripts, `vitest.config.*`, `jest.config.*`, `test/` dir
2. Check for test coverage index (`docs/08-status/TEST_COVERAGE.md` or equivalent)
3. Check existing test files for patterns and conventions
4. Follow existing patterns — don't introduce new frameworks

### Step 4: Check Existing Coverage

1. Read the test coverage index if it exists
2. Check if tests already exist for this feature area — extend, don't duplicate
3. Note which feature area the new tests belong to

### Step 5: Write Tests

1. Write the test files specified in the plan's `tests_to_write`
2. Follow project conventions:
   - **Colocated:** `src/foo.ts` → `src/foo.test.ts`
   - **Mirrored:** `lib/foo.dart` → `test/foo_test.dart`
3. Cover: happy path + error cases + edge cases
4. Mock external dependencies (DB, HTTP, file system)
5. **Abnormal input tests (Operator Gate requirement):**
   - Test with null, undefined, empty strings, very large values, negative numbers
   - Test with special characters, SQL injection patterns, XSS patterns
   - Test with malformed JSON, missing required fields, extra unexpected fields
   - Document the behavior under each abnormal condition (not just pass/fail — what happened)
   - These results feed into `/review` Check 10 (Stability Baseline)

### Step 5b: Import Validation Tests (TypeScript/Node projects)

**CRITICAL — prevents mocked tests from hiding real import errors.**

1. For every new or modified route/module file, write an import validation test:
```typescript
it("imports without error", async () => {
  await expect(import("../routes/my-route.js")).resolves.toBeDefined();
});
```
2. This test does a REAL import — no mocks. If the module has a bad import, this catches it.
3. If the project already has an import validation test file (e.g., `route-imports.test.ts`), add to it. If not, create one.
4. **Rule:** Every `vi.mock()` in a test file requires a corresponding real import validation test somewhere.

### Step 5c: Smoke Boot Test (API/server projects)

1. Start the server entry point: `npm run start` (or equivalent)
2. Wait for it to reach the health endpoint (or bind to a port)
3. If it starts → pass. Kill the server.
4. If it crashes → **FAIL. Stop. Fix before proceeding.** Tests passing with a server that won't start means the tests are wrong.
5. This is the ultimate integration test — everything must load for the server to boot.

### Step 6: Run All Tests

1. Run the full test suite for the project
2. Run all tests from the plan's `tests_to_run` list (regression)
3. Run all tests mapped to the affected feature area in the coverage index
4. **ALL tests must pass.** If any fail → fix before proceeding.

### Step 7: Mark Test Complete

Update workflow state: set `test: complete`. Update `updated` date.

### Step 8: Report Next Steps

Tell the user:
- Tests written (file list)
- Test results (pass/fail counts)
- "Next: Run `/document-code` to update TEST_COVERAGE.md, then `/document-linear` to post test results."

---

## Standalone Mode Process

When invoked outside the chain (no workflow state, or user just wants to run tests):

### Step 1: Discover and Run

1. Find test commands from package.json, CLAUDE.md, or convention
2. Common commands:
   - **Node/TypeScript:** `npm test`, `npx vitest run`
   - **Flutter/Dart:** `flutter test`
   - **Python:** `pytest`
3. Run and report results

### Step 2: Write Mode (if requested)

If user says "write tests" or "add tests":
1. Check test coverage index for existing coverage
2. Read the source code to understand what to test
3. Write tests following project conventions
4. Run to verify they pass
5. Report results

---

## Test Conventions

### TypeScript (vitest)

```typescript
import { describe, it, expect, vi } from "vitest";
import { functionToTest } from "./source.js";

describe("functionToTest", () => {
  it("returns expected result for valid input", () => {
    expect(functionToTest("good")).toBe("expected");
  });

  it("throws for invalid input", () => {
    expect(() => functionToTest("")).toThrow();
  });
});
```

- Use `.js` extension on imports in ESM projects
- Mock with `vi.mock()` for DB/external deps
- Hono routes: use `app.request()` pattern

### Flutter (flutter_test)

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ClassName', () {
    test('does expected thing', () {
      expect(result, expectedValue);
    });
  });
}
```

- Always `SharedPreferences.setMockInitialValues({})` in setUp if needed
- Widget tests: wrap in `MaterialApp` + `ProviderScope` (if Riverpod)
- Use `mocktail` for mocking
- Call `tester.pumpAndSettle()` to resolve async

### What to Test (Priority)

1. **Pure functions** — no deps, highest value
2. **Validation/parsing** — models, schemas, input sanitization
3. **Route handlers / widgets** — with mocked deps
4. **Middleware / guards** — auth, permissions
5. **User flows** — reusable end-to-end flow tests

---

## Rules

1. **In chain mode, gate enforcement is mandatory.** implement_doc_code + implement_doc_linear must be complete.
2. **Follow the plan's test strategy.** Write what it says, run what it says.
3. **All tests must pass before marking complete.** No exceptions.
4. **Don't update TEST_COVERAGE.md.** That's /document-code's job (after test phase).
5. **Don't post results to Plane.** That's /document-linear's job (after test phase).
6. **Update the workflow state file.** Mark in_progress at start, complete at end.
7. **Extend existing tests, don't duplicate.** Check the coverage index first.
