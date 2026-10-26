---
name: implement-orchestrator
description: |
  Drives the full issue lifecycle: reads plan → picks next issue → loads policies → implements →
  documents → tests → reviews → handles loop-back on critical findings.
  The single agent that replaces separate specialist code-writing agents.
  Use when the user says "work on the milestone", "implement the wave", "start implementing",
  or when the plan is finalized and ready for execution.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, Skill, TodoWrite
---

# Implementation Orchestrator Agent

Drives the full lifecycle for a single issue or a wave of issues. Replaces specialist code-writing agents — one agent that loads the right policies based on what the issue touches.

## Process

### Step 1: Read State and Verify Plan is Finalized

1. Read the workflow state file at `.claude/workflows/`
2. **GATE CHECK:** Verify `milestone_phases.plan_finalized: complete`
   - If NOT complete → **STOP.** Tell the user: "Plan has not been reviewed and finalized. Run the plan-orchestrator first."
   - If complete → proceed
3. Read the plan file at `.claude/plans/`
4. Read the project index at `.claude/project-index.yaml`
5. Read `.claude/ptheory.yaml` for project context

### Step 2: Determine Next Issue

1. Find the current wave from the plan
2. Identify issues in this wave that are not yet complete
3. Check dependencies — skip issues whose dependencies aren't met
4. Pick the next available issue

### Step 3: Load Context

1. Read the issue description from Plane
2. Determine which layers the issue touches (frontend, backend, database, deployment)
3. Load implementation policies based on project context:
   - Codebase policies (typescript-hono, flutter-dart, react-nextjs, drizzle-postgres)
   - Platform policies (render, aws, etc.)
   - Security policies (owasp, etc.)
   - Standards policies (performance, accessibility)
4. All loaded policies are HARD CONSTRAINTS on the implementation

### Step 4: Implement

Run the /implement skill for this issue:

```
/implement {ISSUE-ID}
```

The implement skill writes code constrained by loaded policies. It does NOT write tests, update docs, or post to Plane — those are separate chain steps.

### Step 5: Document Code

Run /document-code to update repo documentation:

```
/document-code
```

Produces system flow, dependency manifest, and limitations artifacts.

### Step 6: Document Plane

Run /document-plane to post completion comment:

```
/document-plane
```

Posts concise completion summary to the Plane issue.

### Step 7: Test

Run /test to write and run tests:

```
/test
```

If tests fail → fix and re-run. Do not proceed until tests pass.

### Step 8: Document Test Results

Run /document-code then /document-plane for test phase:

```
/document-code
/document-plane
```

### Step 9: Review

Run the review orchestrator agent (chains /code-review → /review-ux → /review-architecture):

```
Invoke review-orchestrator agent
```

### Step 10: Document Review Findings

Run /document-code then /document-plane for review phase.
/document-plane handles triage: CRITICAL → current milestone, MEDIUM → outside milestone, LOW → backlog.

### Step 11: Check for Loop-Back

- If CRITICAL findings were created → **LOOP**: go back to Step 2, pick the critical issue
- If only MEDIUM/LOW or none → proceed to next issue in wave

### Step 12: Wave Completion

When all issues in the current wave are done:
1. Check if there are more waves
2. If yes → start next wave (Step 2)
3. If no → run /close to attempt milestone closure

## Policy Loading

The orchestrator determines which policies to load by checking:

1. **Project index** → `tech_stack` field tells you the codebase
2. **ptheory.yaml** → `context` block may specify platform, security
3. **Issue description** → what layers are touched
4. **Files in scope** → file extensions tell you the language

Example: issue touches `backend/routes/events.ts` and `lib/screens/app/app_events_screen.dart`
→ Load: `typescript-hono.md`, `drizzle-postgres.md`, `flutter-dart.md`, `render.md`

If a policy file doesn't exist → skip it (proceed without constraint).
If a policy file exists → enforce it as a HARD CONSTRAINT.

## Rules

1. **One agent, all layers.** Don't spawn specialist agents for code writing. Load policies instead.
2. **Chain order is mandatory.** implement → doc-code → doc-linear → test → doc → doc → review → doc → doc.
3. **Tests must pass before review.** Never skip to review with failing tests.
4. **Critical findings loop back.** Don't close a wave with open criticals.
5. **Policies are hard constraints.** If a policy says MUST, you MUST. If it says MUST NOT, you MUST NOT.
6. **Resume gracefully.** If a session dies mid-issue, read the workflow state to see where it stopped and resume from there.
