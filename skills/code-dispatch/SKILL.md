---
name: code-dispatch
description: >
  Governs how Dispatch routes code tasks to Claude Code agents for any project.
  Use this skill whenever spinning up a code task — whether it's a milestone,
  a single issue, a bug fix, or any code change. Defines the exact prompt
  template, branch rules, and per-issue workflow (plan, implement, test, update Plane)
  that every code session must follow. Trigger on: any request to work on code,
  start a milestone, implement an issue, fix a bug, or make changes to a repo.
  Even if the user just says "work on M10" or "fix PROJ-128", this skill applies.
---

# Code Dispatch

**Purpose:** Define exactly how Dispatch routes code tasks to Claude Code agents. This skill exists because code agents don't inherit Dispatch's context. They start fresh. If Dispatch doesn't tell them where to look, they wing it, and the output is inconsistent.

## The Problem This Solves

Repos typically have multiple layers of instructions that guide code work:

1. **Cowork skills** (this layer, on Claude.ai) control how Dispatch talks to project management tools and routes tasks
2. **Global Claude Code skills** (on the desktop at `~/.claude/skills/`) apply to every Claude Code session regardless of repo
3. **Repo-level skills and CLAUDE.md** (inside the repo at `.claude/skills/` and `CLAUDE.md`) define project-specific conventions, patterns, and workflow rules

The code agent only sees layers 2 and 3 automatically. Layer 1 (Cowork) must explicitly point the agent at layer 3 in its prompt. If Dispatch composes a free-form prompt without referencing the repo's own rules, the agent ignores them.

## Branch Rules

All code work happens on the designated working branch (typically `staging` or `develop`). No exceptions.

- Checkout the working branch before starting
- Commit to the working branch
- Push to the working branch
- Do NOT create feature branches unless the project explicitly requires them
- Do NOT push directly to `main` or `master`

## Prompt Template

When Dispatch calls `start_code_task` for any code work, use this template. Do not compose free-form prompts.

```
BEFORE WRITING ANY CODE, you must read the project rules:
1. Read CLAUDE.md in the repo root
2. Read all files under .claude/skills/
These define the project conventions, workflow rules, and implementation patterns. They are your source of truth. Follow them exactly.

BRANCH: All work on the {working_branch} branch. Checkout {working_branch}, commit to {working_branch}, push to {working_branch} only. No feature branches, no main.

WORKFLOW: For each issue, follow this chain strictly:
1. PLAN — Read the issue spec from the project tracker. Read the relevant existing code. Write a plan: what files change, what schema deltas, what endpoints, what screens. Do not write code until the plan is clear.
2. IMPLEMENT — Write the code following the plan and repo conventions from CLAUDE.md/.claude/skills/.
3. TEST — Run the test suite. Write tests for new endpoints and business logic. Run linting. Verify the build compiles.
4. UPDATE TRACKER — Mark the issue Done in the project tracker only after tests pass. Add implementation notes as comments if relevant.

Do not skip to the next issue until the current one completes all 4 steps.

TASK: {description of what to work on}
```

## What Dispatch Fills In

The `{description}` section should include:

- Which milestone or issues to work on
- Issue identifiers (e.g., PROJ-XXX) in dependency order
- Which issue to start with
- Any blockers or context the user mentioned
- The `{working_branch}` for this project

Dispatch should NOT restate the repo's rules, conventions, or patterns in the prompt. The agent reads those from the repo itself. Dispatch just points the agent at the files and describes the task.

## When To Use This Skill

Use this skill for ANY code task touching a managed repo:

- "Work on M10" or "start milestone 10"
- "Fix PROJ-128" or "implement the waitlist feature"
- "There's a bug in the events page"
- "Add a new endpoint for X"
- "Refactor the admin dashboard"
- Any request that will result in `start_code_task` against a workspace

## What NOT To Do

- Do not compose ad-hoc prompts without the template above
- Do not inline issue specs, schema definitions, or API designs in the Dispatch prompt (the agent gets these from the tracker and the repo)
- Do not skip pointing the agent at CLAUDE.md and .claude/skills/
- Do not forget the branch rule
- Do not allow the agent to skip the test step
- Do not mark issues Done from Dispatch; let the code agent do it after tests pass

## Project Tracker Integration

The code agent should have access to the project tracker (e.g., Plane MCP/API tools). It should:

- Read issue details directly from the tracker (not from Dispatch's paraphrasing)
- Update issue status to "In Progress" when starting work
- Update issue status to "Done" only after tests pass
- Add implementation notes as comments on the issue if relevant

Dispatch should use project-specific template skills when it needs to create or update tracker entries itself (new issues, milestones, project updates). The code agent handles its own tracker updates during implementation.
