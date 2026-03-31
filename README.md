# PTheory

Development methodology framework — skills, agents, and policies for Claude Code.

Cuts the development cycle in half: exploration and production run in parallel, connected by contracts and AI-generated breadcrumbs.

## Structure

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

## Project Management

Uses **Plane** (self-hosted at plane.example.com) for issue tracking.
- Workspace: `your-workspace`
- API credentials: Infisical → example/dev/plane
- Plane MCP when available, REST API fallback

## Installation

Copy skills and agents to your Claude Code config:

```bash
cp -R skills/* ~/.claude/skills/
cp -R agents/* ~/.claude/agents/
```

## Workflow Chain

```
/plan → /document-plane → /implement → /document-code → /document-plane
  → /test → /document-code → /document-plane
  → /review → /document-code → /document-plane
  → /close
```
