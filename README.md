# PTheory

The original PTheory: the research, the proposals and the first framework, by Dustin Taylor.

This repo is the source. PTheory began as Dustin's research into governing AI coding agents. On 31 March 2026 he defined it as a framework of 50 skills and 21 agents, with the split between an architect and an operator, and wrote it up in the paper "PTheory: Parallel Architecture and Operations". Everything here is Dustin's work.

## Contents

| Path | What it is |
|---|---|
| `skills/`, `agents/` | The original framework, 31 March 2026 |
| [`papers/parallel-architecture-and-operations.pdf`](papers/parallel-architecture-and-operations.pdf) | "PTheory: Parallel Architecture and Operations": Architect and Operator, awareness without premature enforcement, enforcement at the commitment boundary |
| [`papers/build_ptheory_doc.js`](papers/build_ptheory_doc.js) | Script that builds the Word version of that paper with its diagrams |
| [`history/original-ptheory.md`](history/original-ptheory.md) | Complete account of the original PTheory: lifecycle, state, readiness gate, every rule it set |
| `feat/render-multi-env-standard` branch | The system spec, workflow schema, chain flow and design docs, and a Render multi-environment standard (31 March to 5 April 2026) |

## Frameworks built from this research

These were developed later, from this research, and are credited separately.

| Repo | What it is |
|---|---|
| `ptheory-claude-initial` | PTheory rebuilt for Claude Code, with the process enforced by hooks (31 March to 14 June 2026). Rebuilt from this source. |
| `ptheory-template` | A portable template any project can adopt (from 1 June 2026). Built from this source. |
| `ptheory-framework` | The template's public-release snapshot (19 October 2026) |

Related: `commonplace` holds candidate Paper 3, "Persistent Context for Agentic Engineering". Charterline is a separate framework and does not build on PTheory.

## The original framework

Development methodology framework — skills, agents, and policies for Claude Code.

Cuts the development cycle in half: exploration and production run in parallel, connected by contracts and AI-generated breadcrumbs.

### Structure

```
ptheory/
├── skills/          # 50 skill files (SKILL.md each)
│   ├── plan/        # /plan — creates implementation plans from Plane modules
│   ├── implement/   # /implement — implements one issue at a time
│   ├── test/        # /test — writes and runs tests
│   ├── close/       # /close — verifies completion, posts summary
│   ├── document-plane/  # /document-plane — updates Plane after each phase
│   ├── document-code/   # /document-code — updates repo docs after each phase
│   ├── plane/       # /plane — general Plane project management
│   ├── ptheory/     # /ptheory — entry point (onboard or resume)
│   └── ...          # 42 more specialized skills
├── agents/          # 21 agent definitions
│   ├── backend-engineer.md
│   ├── frontend-engineer.md
│   ├── implement-orchestrator.md
│   ├── plan-orchestrator.md
│   └── ...
└── README.md
```

### Project Management

Uses **Plane** (self-hosted at plane.example.com) for issue tracking.
- Workspace: `your-workspace`
- API credentials: Infisical → example/dev/plane
- Plane MCP when available, REST API fallback

### Installation

Copy skills and agents to your Claude Code config:

```bash
cp -R skills/* ~/.claude/skills/
cp -R agents/* ~/.claude/agents/
```

### Workflow Chain

```
/plan → /document-plane → /implement → /document-code → /document-plane
  → /test → /document-code → /document-plane
  → /review → /document-code → /document-plane
  → /close
```
