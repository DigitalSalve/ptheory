---
name: onboard-customize
description: |
  Generates project-specific skills and agents from the project index. Fourth and final phase of
  PTheory onboarding. After /onboard-discover scans and /onboard-migrate creates Plane structure,
  this skill creates tailored skills and agents that know the project's paths, tech stack, and conventions.
  Use when the user says "/onboard-customize", "generate project skills", "create project agents",
  or automatically after /onboard-migrate completes.
  This is a global skill — it customizes any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Onboard Customize Skill

Generates project-specific skills and agents from the project index. These override global skills with project-specific paths, commands, and conventions.

**This is phase 4 of the onboarding chain:**
```
/onboard-project → /onboard-discover → /onboard-migrate → /onboard-customize
```

**This is a global skill.** It customizes any project.

## Prerequisites

- /onboard-discover completed (`.claude/project-index.yaml` exists)
- /onboard-migrate completed (Plane project exists, recommended but not required)

## Process

### Step 1: Read Project Index

1. Read `.claude/project-index.yaml`
2. Extract: tech_stack, platforms, deployment, external_integrations, features
3. Read the scope document for project boundaries
4. Read existing CLAUDE.md for any conventions already documented

### Step 2: Determine What to Generate

Based on the project index tech stack:

#### Skills to Generate

| Detected Context | Skill | What It Fills In |
|-----------------|-------|-----------------|
| Any test framework | `/test` | Test directories, commands, coverage file path, framework (vitest/jest/flutter_test) |
| Any deployment platform | `/deploy` | Service names, deploy commands, health check URLs, pre-deploy validation |
| Database + ORM | `/db` | Schema file path, migration directory, migration commands, ORM (Drizzle/Prisma) |
| Git repo | `/commit` | Pre-commit checks specific to this project, conventional commit scope |
| Render | `/render` | Service names from render.yaml, deploy URLs |
| AWS | `/aws` | Bucket names, regions, IAM context |
| Flutter | `/flutter` | Screen paths, router config, theme location, widget conventions |
| Next.js/React | `/marketing` or `/frontend` | Component paths, page routes, build commands |
| Stripe | Payment constraints | Webhook paths, checkout flow, test/live mode |
| SendGrid | Email constraints | Template IDs, from addresses |

#### Agents to Generate

| Detected Tech | Agent | Project Context Filled In |
|--------------|-------|--------------------------|
| TypeScript/Node backend | `backend-engineer` | Routes dir, ORM, middleware chain, auth pattern |
| Flutter/Dart | `frontend-engineer` | Screen paths, Riverpod/BLoC, GoRouter, theme |
| React/Next.js | `frontend-engineer` | Component paths, App Router, Tailwind config |
| PostgreSQL/DB | `data-engineer` | Schema path, migration dir, naming conventions |
| Render/AWS/Vercel | `devops-engineer` | Service names, deploy config, env var management |
| Any project | `debugger` | Log locations, common error patterns |
| Any project | `code-reviewer` | Project conventions from CLAUDE.md |
| Any project | `documentation-writer` | Docs hierarchy, feature note template location |
| Any project | `security-engineer` | Auth pattern, sensitive data locations |
| Any project | `test-engineer` | Test framework, test locations, coverage tools |
| Any project | `refactor-agent` | Large files, known tech debt from project index |
| Any project | `performance-engineer` | Deployment platform, known bottlenecks |

### Step 3: Generate Project-Specific Skills

For each skill to generate:

1. Check if a global version exists at `~/.claude/skills/{name}/SKILL.md`
2. Check if a project-specific version already exists at `.claude/skills/{name}/SKILL.md`
3. If project version exists → read it, check if it needs updating based on new index data
4. If no project version → generate one:
   - Start from the global skill as a template
   - Replace generic references with project-specific paths and commands
   - Add project-specific steps (e.g., "run schema check before migration" for MyGOP)
   - Keep the skill structure and chain integration intact

**Location:** `.claude/skills/` (repo level). These override global skills when working in this repo.

### Step 4: Generate Project-Specific Agents

For each agent to generate:

1. Check if an agent already exists at `.claude/agents/{name}.md`
2. If exists → read it, check if project context is filled in or still generic
3. If no agent or generic → generate with project context:

**Agent template structure:**
```markdown
Agent name: {name}

{Role description with project-specific context}

**Project:** {project name}
**Tech stack:** {from project index}

**Key locations:**
- {project-specific paths}

**Conventions:**
- {from CLAUDE.md and project index}

**Tools available:** {appropriate for this agent's role}
```

### Step 5: Update Settings

1. Read `.claude/settings.json`
2. Add tool permissions appropriate for the detected tech stack:
   - `Bash(npm:*)` for Node projects
   - `Bash(flutter:*)` for Flutter projects
   - `Bash(docker:*)` for containerized projects
3. Don't remove existing permissions — only add missing ones

### Step 6: Update CLAUDE.md

If CLAUDE.md exists but is missing information that /onboard-discover found:
- Add detected commands to "Available Commands" section
- Add detected structure to "Project Structure" section
- Don't overwrite existing content — append missing pieces

### Step 7: Report

```
## Project Customization Complete: [Project Name]

**Skills generated:** [count] at .claude/skills/
- /test — [test framework, test dir, commands]
- /deploy — [platform, services]
- /db — [ORM, schema path, migration dir]
- ...

**Agents generated:** [count] at .claude/agents/
- backend-engineer — [tech stack context]
- frontend-engineer — [framework context]
- ...

**Settings updated:** [permissions added]
**CLAUDE.md updated:** [sections added/updated]

Project is fully onboarded and customized for PTheory.
The development chain is ready: /plan → /implement → /test → /review → /close
```

---

## Rules

1. **Project-specific overrides global.** Skills at `.claude/skills/` (repo level) take precedence over `~/.claude/skills/` (global).
2. **Don't delete or overwrite existing customizations.** If a project-specific skill already exists with customizations, update it — don't regenerate from scratch.
3. **Fill in, don't assume.** If the project index doesn't have enough info to fill a field, leave it as a TODO comment in the generated file.
4. **Idempotent.** Re-running updates existing skills/agents with new index data, doesn't duplicate.
5. **Agents get real context.** Don't generate agents with placeholder paths. Use actual paths from the project index.
6. **Settings are additive.** Only add permissions, never remove existing ones.
