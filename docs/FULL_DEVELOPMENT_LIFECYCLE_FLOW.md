# PTheory — Full Development Lifecycle Flow

*Originally created in Linear (2026-03-23, last updated 2026-03-25)*
*Migrated to repo and updated Linear→Plane refs (2026-03-31)*

## Overview

PTheory is a development methodology that enables parallel exploration and production preparation. This document describes the complete lifecycle a project follows from first contact through ongoing development.

## Entry Point

**One command:** `/ptheory`

The `/ptheory` skill detects the project's current state and routes to the right phase automatically. The user never needs to remember individual skill names.

---

## Section 0: Request Classification (v0.8.0)

Every user message is classified before any tool is called. This classification is deterministic and governs whether PTheory's chain is invoked.

### Two Modes

| Mode | Trigger | What Runs | Changes Anything? |
| -- | -- | -- | -- |
| **Advisory** | User is exploring, discussing, analyzing | Agents — they read, analyze, recommend | No |
| **Action** | User needs something done — code, config, infrastructure, behavioral docs | PTheory chain from the top | Yes |

**Advisory mode.** The user is thinking. Launch the appropriate agent. Agents use skills internally as thinking tools but do not execute chain phases. Nothing in the project changes.

**Action mode.** The user needs work done. Start at the top of PTheory. The chain runs in full: intake → scope check → feature request → plan → implement → test → review → close. No skipping. No "quick fix."

### Key Principles

- **The boundary is natural language.** Discussion is free. But the moment action is required, the chain enforces order.
- **Agents own skills, not the other way around.** The agent determines how to use the skill based on context.
- **Feature requests are a PTheory artifact.** Created during INTAKE phase before planning begins.
- **PTheory lives apart from any project.** This classification behavior exists at `~/.claude/` (user-level).
- **Classification errors.** If uncertain, default to advisory. Never default to action.

---

## Phase 1: Onboarding (runs once per project)

### Phase 0 — Git State Resolution
### Phase A — Scope Creation (`/scope`)
### Phase B — Infrastructure (`/onboard-project`)
### Phase C — Discovery (`/onboard-discover`)
### Phase D — Migration (`/onboard-migrate`)
### Phase E — Customization (`/onboard-customize`)

---

## Phase 2: Development Chain (repeats per milestone)

### Complete Chain Flow

```
USER MESSAGE
  │
  ▼
REQUEST CLASSIFICATION (§0)
  ├─ ADVISORY → launch agent. No chain. Stop.
  └─ ACTION → proceed ↓
  │
  ▼
INTAKE: Capture request → create feature request artifact
  │
  ▼
/ptheory (entry point — detects state, routes)
  │
  ▼
plan-orchestrator (agent):
  ├─ /scope read
  ├─ ENTRY GATE                      ← is there a Plane issue?
  ├─ /plan (Steps 0-5)               ← DRAFT
  ├─ plan-review (agent)             ← 8 specialist advisors
  ├─ /plan (Step 6)                  ← FINALIZE
  ├─ /document-code
  ├─ /document-plane
  │
  ▼ GATE: plan_finalized + doc_code + doc_plane = complete
  │
implement-orchestrator (agent):
  FOR EACH WAVE:
    FOR EACH ISSUE:
      ├─ /implement → /document-code → /document-plane
      ├─ /test → /document-code → /document-plane
      ├─ review-orchestrator → /document-code → /document-plane
      │    └─ TRIAGE: CRITICAL → re-plan | MEDIUM/LOW → continue
      └─ close: complete
  │
  ▼ ALL WAVES COMPLETE
  │
/close:
  ├─ /operator-gate (24 criteria, pass/fail)
  ├─ Post milestone summary to Plane
  └─ Archive workflow state
  │
  ▼
repo-orchestrator:
  ├─ /push-staging
  └─ /push-production (requires user confirmation)
```

---

## Key Mechanisms

### Workflow State File
- Location: `~/.claude/workflows/{milestone-slug}.yaml`
- Tracks every phase for every issue
- Enforces prerequisites and wave ordering
- Crash recovery: detects stuck `in_progress` from previous sessions

### Implementation Context (Policies)
- Location: `~/.claude/skills/implement/policies/`
- 8 categories, 13 policy files
- If a policy file exists for the project's context, it's a HARD constraint

### Scope Document
- Per-project (e.g., `docs/02-canon/PROJECT_SCOPE.md`)
- Living document with formal amendments (original never edited)

### Review Triage Loop
- CRITICAL → new issue, inside current module, re-plan
- MEDIUM → new issue, outside current module
- LOW → new issue, Backlog, no module

### Operator Gate
- 24 non-negotiable criteria, binary pass/fail
- FAIL → deficiencies as CRITICAL issues → loop to plan-orchestrator

---

## Project Management

PTheory uses **Plane** (self-hosted) for issue and module tracking.

- **Host:** `https://plane.example.com` (fallback: `203.0.113.54`)
- **Workspace:** `your-workspace`
- **API key:** Infisical → example/dev/plane → `PLANE_API_KEY`
- **Access:** Plane MCP tools when available; REST API fallback

| PTheory Term | Plane Equivalent |
|---|---|
| Milestone | Module |
| Issue | Issue |
| Team | Workspace |
| Project | Project |

---

*Last synced: 2026-03-31 — migrated from Linear, updated to Plane*
