---
name: ptheory
description: |
  PTheory system entry point. Runs the full onboarding chain for a new project or resumes the
  development chain for an onboarded project. One command to rule them all.
  Use when the user says "/ptheory", "set up ptheory", "onboard this project", "bootstrap this repo",
  "start ptheory", or any request to apply PTheory to a project.
  Also use when entering a project for the first time — detects state and picks up where it left off.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# PTheory Skill

Single entry point for the PTheory development system. Detects what state the project is in and runs the right thing automatically.

**One command:** `/ptheory`

## What It Does

```
/ptheory
  ↓
Detect state:
  → No scope?        → /scope (create scope document)
  → Not onboarded?   → Run full onboarding chain (project → discover → migrate → customize)
  → Onboarded?       → Ready for development chain (plan-orchestrator → implement-orchestrator → review-orchestrator → /close)
```

The user never needs to remember `/onboard-project` vs `/onboard-discover` vs `/onboard-migrate` vs `/onboard-customize`. They just run `/ptheory` and the skill figures out what's needed.

## Process

### Step 1: Detect Project State

Quick detection — check in order:

1. **Scope document exists?** Search common locations.
2. **Onboarded?** Check for `.claude/project-index.yaml` and workflow state `onboarded` field.
3. **Active workflow?** Check for non-archived workflow state file.

### Step 2: Route to the Right Action

| State | Action |
|-------|--------|
| No scope / not onboarded | **Launch the ptheory-onboarder agent.** It handles the full onboarding chain autonomously (scope → infrastructure → discovery → migration → customization). Only pauses for user input when it needs answers. |
| Onboarded, no active workflow | Ask "What do you want to work on?" then launch `plan-orchestrator` agent or `implement-orchestrator` agent |
| Onboarded, active workflow | Read workflow state, find where we left off, resume the chain |
| Active workflow stuck (in_progress from crashed session) | Detect and offer resume/reset |

### Launching the Onboarding Agent

When the project needs onboarding, spawn the `ptheory-onboarder` agent:

```
Use the Agent tool with subagent_type="general-purpose" and prompt:

"Read ~/.claude/agents/ptheory-onboarder.md for your instructions.
You are onboarding this project into PTheory. Follow the phases in order,
skip what's already done, and report what you created at each step.
The project is at: [current working directory]"
```

The agent runs autonomously through all onboarding phases and reports back.

### After Onboarding (or if already onboarded)

**Ready for new work:**
- "Plan a milestone" → launch `plan-orchestrator` agent (drafts plan → specialist review → revise → finalize)
- "Work on [issue]" → launch `implement-orchestrator` agent (implement → doc → test → review → loop/close)
- "Check status" → run `/status`
- User describes work → launch `plan-orchestrator` agent (handles entry gate, Plane issue creation, then full planning)

**Resume active workflow:**
- Read the workflow state file
- Find the first issue with an incomplete phase
- Tell the user: "Found active workflow for [milestone]. [Issue] is at [phase]. Resume?"
- If yes → run the appropriate skill for the current phase

---

## State Detection Summary

| What's Found | What /ptheory Does |
|-------------|-------------------|
| No scope document | Create scope via interview |
| Scope but no onboarding | Run full 4-phase onboarding chain |
| Onboarded, no active workflow | Ask "what do you want to work on?" |
| Onboarded, active workflow | Resume where the chain left off |
| Onboarded, active workflow stuck (in_progress from crashed session) | Detect and offer resume/reset |

---

## Rules

1. **Always detect before acting.** Don't assume the project state — check.
2. **Don't skip onboarding phases.** If scope exists but onboarding didn't complete, run from where it stopped.
3. **User confirmation for Plane creation.** /onboard-migrate always confirms before creating issues.
4. **Crash recovery.** If a workflow state has `in_progress` stuck from a previous session, offer to resume or reset.
5. **One command.** The user should never need to know about the sub-skills. `/ptheory` handles routing.
