---
name: flow-diagram
description: |
  Produces consistent markdown tree-format flow diagrams for plans, features, and system documentation.
  Called by /plan during Step 5 to visualize the implementation flow, and available standalone
  for documenting any process or system flow.
  Use when the user says "/flow-diagram", "draw the flow", "show me the flow",
  "create a flow diagram", or when /plan needs to visualize wave execution order.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Flow Diagram Skill

Produces markdown tree-format flow diagrams. Consistent syntax, scannable, hierarchical, annotated.

## The Format

All flow diagrams use markdown code blocks with this tree syntax:

~~~
```
root
|
|- step                              description of what this step does
|  |- sub-step                       description
|  |- sub-step                       description
|  |  |- nested                      description
|  |  |- nested                      description
|  |
|  |-- GATE: condition that must be true to proceed
|  |
|  |- next step                      description
|
|- another branch                    description
|  |- sub-step                       description
|  |-- DECISION? → outcome A
|  |-- ELSE → outcome B
```
~~~

## Syntax Rules

| Symbol | Meaning | When to Use |
|--------|---------|-------------|
| `|` | Vertical connector | Continuation within same branch |
| `|-` | Step | A sequential action that executes |
| `|--` | Gate or decision | A condition, checkpoint, or branching point |
| `→` | Flow direction | After a decision, shows where it goes |
| Indentation (3 spaces per level) | Nesting depth | Shows parent-child / orchestrator-skill relationship |
| Description (right-aligned) | What this step does | Every step gets a short description |
| `+` between items | Parallel or additional | When two things exist at the same level |

## Rules

1. **Every step has a description.** No naked names. The description tells a human what happens.
2. **Descriptions are right-aligned.** Align at a consistent column (40-45) for readability.
3. **Gates use `|--` and are labeled.** `|-- GATE: condition` or `|-- DECISION? → outcome`.
4. **Max 4 nesting levels.** Matches orchestration hierarchy. Deeper = wrong architecture.
5. **Loops show direction.** `|-- CRITICAL? → loop to plan-orchestrator` — say where.
6. **Sequential steps use `|-`.** Top to bottom.
7. **Wrap in code blocks.** Always inside triple backtick code fences for monospace rendering.
8. **Works in Discord, Slack, Plane, GitHub.** Markdown code blocks render consistently everywhere.

## When to Produce a Flow Diagram

| Context | What to Diagram |
|---------|----------------|
| `/plan` Step 5 | Wave execution order with gates between waves |
| Feature documentation | User action → system response |
| Architecture docs | Request flow through system layers |
| Process documentation | Any multi-step process with gates or branches |
| PTheory lifecycle | The full chain flow |

## Examples

### Plan Wave Flow

```
M11 — County Websites
|
|- Wave 1: Schema + API
|  |- KEE-180: county websites table   schema + migration + API endpoints
|  |- KEE-181: county onboarding       onboarding flow API
|  |-- GATE: Wave 1 tests pass
|
|- Wave 2: Frontend
|  |- KEE-182: admin county screen     admin UI for managing county sites
|  |- KEE-183: public county page      public-facing county website page
|  |-- GATE: Wave 2 tests pass
|
|- Wave 3: Integration
|  |- KEE-184: deep links              county site deep links from app
|  |-- GATE: Wave 3 tests pass, all waves complete
```

### Feature Flow

```
Donation Flow
|
|- User taps "Donate"                  opens donation screen
|  |- Select amount                    preset buttons + custom input
|  |- Select candidate (optional)      dropdown from active candidates
|  |- Tap "Continue"                   validates amount > 0
|
|- POST /api/donations/intake          create Stripe checkout session
|  |- Stripe returns checkout URL      redirect user to Stripe
|  |-- GATE: Stripe session created
|
|- User completes on Stripe            enters payment details
|  |-- SUCCESS → redirect to app success screen
|  |-- CANCEL → redirect to app with cancelled message
|
|- Webhook: POST /api/webhooks/stripe  Stripe confirms payment
|  |- Update donation status           PENDING → COMPLETED
|  |- Send confirmation email          via SendGrid
```

### Security Review Flow (split advisors)

```
Security Review
|
|- security-auditor                    (auth gaps, validation, secrets)
+
|- security-engineer                   (platform vulns, CORS, OWASP top 11)
|  |- SQL injection
|  |- XSS
|  |- CSRF
|  |- Broken auth
|  |- ADOR / broken access control
|  |- Open redirects
|  |- Directory traversal
|  |- Exposed APIs
|  |- Default creds
|  |- Outdated libs
|  |- Misconfigured CORS
```

### System Request Flow

```
API Request
|
|- Hono receives request               route matched by path
|  |- CORS middleware                   check origin against CORS_ORIGINS
|  |- Auth middleware                   verify JWT, resolve user
|  |  |-- 401? → return unauthorized
|  |  |-- Valid? → set user in context
|  |
|  |- Route handler                    business logic
|  |  |- Validate input (Zod)          parse and validate request body
|  |  |  |-- Invalid? → 400 bad request
|  |  |- Query database (Drizzle)      parameterized query
|  |  |- Return response               JSON with appropriate status code
```

## Integration with /plan

When `/plan` writes the plan file (Step 5), include a flow diagram showing:
1. Wave execution order
2. Gates between waves
3. Issue dependencies within waves
4. Test gate for each wave

The diagram goes in the plan file under a `## Flow` section.
