---
name: document-code
description: |
  Updates codebase documentation artifacts after a chain phase completes. Touches repo files only — never Plane.
  Runs after /plan, /implement, /test, and /review as part of the PTheory skill chain.
  Use when the user says "/document-code", or automatically invoked by the chain after each phase.
  This is a global skill — works with any project that has a documentation hierarchy.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Document Code Skill

Updates codebase documentation after a chain phase completes. This skill touches **repo files only** — never Plane. Its counterpart `/document-plane` handles Plane updates.

**This is a global skill.** It works with any project. The documentation locations are discovered from the project's structure, not hardcoded.

## When to Use

- Automatically after each chain phase: plan, implement, test, review
- User says "/document-code" or "update the docs"
- Chain enforcement: the workflow state file gates the next phase on this being complete

## Process

### Step 0: Read Workflow State

1. Find the active workflow state file at `~/.claude/workflows/`
2. Determine which phase just completed (look for the most recent `complete` phase whose `_doc_code` is still `pending`)
3. If no workflow state file exists, ask the user what phase to document for

### Step 1: Gate Check

1. Read the prerequisite phase for this doc_code phase (see prerequisite chain in SCHEMA.md)
2. If the prerequisite is NOT `complete` → **STOP**. Tell the user what needs to finish first.
3. If the prerequisite IS `complete` → proceed

### Step 2: Mark In Progress

Update the workflow state file: set the relevant `_doc_code` phase to `in_progress`. Update the `updated` date.

### Step 3: Do the Documentation Work

**OUTPUT FORMAT RULES (all artifacts):**
- **TL;DR first.** Every document starts with 3 bullet points max summarizing what this file is.
- **Tables over prose.** Edge cases, failure paths, dependencies, limitations — all tables.
- **No prose blocks longer than 3 sentences.** If you need more, break into a table or list.
- **Headers answer questions.** Not "System Flow" → "How requests move through the system."
- **One fact per line.** No compound sentences packing multiple ideas.
- **Humans read these.** An operator scanning at speed should get the picture in 30 seconds.

What to document depends on which phase just completed:

---

#### After /plan

| Check | Action |
|-------|--------|
| Plan file exists | Verify `.claude/plans/{slug}.md` exists. If missing, STOP — /plan didn't finish. |
| No other action | Plan documentation is the plan file itself. Confirm it's there and move on. |

---

#### After /implement

| Check | Action |
|-------|--------|
| Architecture docs | If new routes, services, or system boundaries were added → update architecture docs |
| Database schema docs | If schema changed → update database documentation |
| Feature notes | If a new feature was implemented → create or update a feature note |
| CLAUDE.md | If project structure, commands, or conventions changed → update CLAUDE.md |
| API docs | If new endpoints were added → update API documentation or matrix |
| **System flow (as built)** | Update or create `.claude/artifacts/system-flow.md` — describes how the system actually works after this implementation. Not the plan, the reality. Include request/response paths, core logic flow, service interactions. |
| **Dependency manifest** | Update or create `.claude/artifacts/dependencies.md` — all dependencies with versions and integration points. Check package.json/pubspec.yaml/requirements.txt. Note any new third-party services or libraries added. |
| **Limitations log** | Update or create `.claude/artifacts/limitations.md` — any limitations discovered during implementation. Each entry: what the limitation is, why it exists, impact on users/operators. Nothing implied. |

**How to find docs to update:**
1. Read the project's `docs/README.md` (or equivalent navigation spine)
2. Check `docs/03-architecture/` for architecture docs
3. Check `docs/04-behavior/` for behavior/flow docs
4. Check `CLAUDE.md` and `.claude/CLAUDE.md` for project context
5. Check `.claude/artifacts/` for operator gate artifacts
6. If no docs hierarchy exists, note what SHOULD be documented but skip

---

#### After /test

| Check | Action |
|-------|--------|
| Test coverage index | Update `docs/08-status/TEST_COVERAGE.md` (or equivalent) with: new test files, issue-to-test mapping, feature area mapping |
| Test file list | Ensure every new test file is listed in the coverage index |
| Known gaps | If tests were skipped or couldn't be written, note them as known gaps |

**If no test coverage index exists:** Create a minimal one listing the tests that were just written.

---

#### After /review

| Check | Action |
|-------|--------|
| Documentation gaps | If /review identified missing docs → create or update them now |
| Flow documentation | If /review found user flow issues → update behavior docs |
| Architecture gaps | If /review found integration issues → update architecture docs |
| **System flow update** | Update `.claude/artifacts/system-flow.md` if review revealed the flow differs from what was documented |
| **Limitations update** | Append any new limitations discovered during review to `.claude/artifacts/limitations.md` |
| **Edge case catalog** | Write /review's edge case findings to `.claude/artifacts/edge-cases.md` — each case with observed behavior |
| **Failure path registry** | Write /review's failure path findings to `.claude/artifacts/failure-paths.md` — trigger condition + system response |

---

### Step 4: Mark Complete

Update the workflow state file: set the relevant `_doc_code` phase to `complete`. Update the `updated` date.

### Step 5: Report

Tell the user:
- What documentation was updated (file list)
- What documentation was confirmed up-to-date (no changes needed)
- Next step: "Run `/document-plane` to update Plane"

---

## Rules

1. **Repo files only.** This skill never touches Plane. That's /document-plane's job.
2. **Don't create docs for the sake of creating docs.** If nothing changed that affects documentation, mark complete and move on.
3. **Discover, don't assume.** Read the project's docs structure. Don't hardcode paths from any specific project.
4. **Gate enforcement is mandatory.** If the prerequisite phase isn't complete, stop. No exceptions.
5. **Update the workflow state file.** Every run must mark its phase in_progress at start and complete (or blocked) at end.

---

## Phase-to-Doc-Code Mapping

| Workflow Phase | Doc Code Phase | What It Checks |
|---------------|---------------|----------------|
| `plan` | `plan_doc_code` | Plan file exists |
| `implement` | `implement_doc_code` | Architecture, schema, feature notes, CLAUDE.md |
| `test` | `test_doc_code` | Test coverage index |
| `review` | `review_doc_code` | Gaps identified by review |
