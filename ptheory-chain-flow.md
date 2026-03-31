# PTheory Development Chain — Canonical Flow

- The deterministic workflow every piece of work flows through.
- Waves are dynamic — determined by /plan, not hardcoded.
- Every phase gates on /document-code + /document-linear before the next phase starts.

```
/ptheory                                    entry point — detect state, route
|
|-- NO SCOPE? → /scope                     create scope document via interview
|-- NOT ONBOARDED? → ptheory-onboarder     full onboarding chain (4 phases)
|-- ONBOARDED + NO WORKFLOW? → ask user    "what do you want to work on?"
|-- ONBOARDED + ACTIVE WORKFLOW? → resume  pick up where chain left off
|
|- /plan                                    plan-orchestrator agent
|  |- read Linear milestone + issues        gather context from backlog
|  |- explore codebase                      understand current state
|  |- classify issues                       type, surface, complexity per issue
|  |- create dependency-ordered waves       dynamic — determined by plan
|  |- write plan file                       .claude/plans/{slug}.md
|  |- create workflow state file            ~/.claude/workflows/{slug}.yaml
|  |
|  |- /document-code                        verify plan file exists
|  |- /document-linear                      post plan summary to milestone
|  |-- GATE: plan_doc_code + plan_doc_linear = complete
|
|- FOR EACH WAVE (read from plan file)
|  |
|  |- FOR EACH ISSUE IN WAVE
|  |  |
|  |  |- /implement {ISSUE-ID}             code-dispatch selects agent per surface
|  |  |  |- /code-dispatch                  choose agent, branch, prompt template
|  |  |  |- agent writes code               in worktree, per plan file spec
|  |  |  |
|  |  |  |- /document-code                  update architecture, API, feature docs
|  |  |  |- /document-linear                post implementation notes to issue
|  |  |  |-- GATE: implement_doc_code + implement_doc_linear = complete
|  |  |
|  |  |- /test {ISSUE-ID}                  test-engineer agent
|  |  |  |- write tests per plan strategy   unit, integration, route tests
|  |  |  |- run tests                       all must pass
|  |  |  |
|  |  |  |- /document-code                  update TEST_COVERAGE.md
|  |  |  |- /document-linear                post test results to issue
|  |  |  |-- GATE: test_doc_code + test_doc_linear = complete
|  |  |
|  |  |-- ISSUE GATE: all 6 phases complete (implement → doc × 2 → test → doc × 2)
|  |
|  |-- WAVE GATE: all issues in wave have test_doc_linear = complete
|  |
|  |- NEXT WAVE (loop)
|
|-- ALL WAVES GATE: every issue through test_doc_linear = complete
|
|- /review                                  review-orchestrator agent
|  |- /code-review                          code-reviewer agent (conventions, security)
|  |- /review-ux                            UX/journey validation (flows work end-to-end?)
|  |- /review-architecture                  layer alignment (UI ↔ API ↔ DB consistent?)
|  |
|  |- /document-code                        update docs from review findings
|  |- /document-linear                      triage findings → create issues if CRITICAL
|  |-- GATE: review_doc_code + review_doc_linear = complete, no open CRITICALs
|  |-- CRITICAL FOUND? → loop back to /implement for fix, then re-review
|
|- /close                                   verify all phases complete
|  |- /operator-gate                        24 criteria — binary pass/fail
|  |-- GATE: operator-gate passes
|  |-- FAIL? → report which criteria failed, loop back
|
|- /commit                                  stage specific files, run tests, commit
|- /resolve-worktree                        detect/resolve worktree branch conflicts
|- /push-staging                            merge to staging, push to remote
|  |-- GATE: staging deploys successfully
|  |-- USER: verify on staging
|
|- /push-production                         merge staging → main (requires user confirmation)
```

## Phase-to-Gate Mapping

| Phase | Gate Condition | Blocks |
|-------|---------------|--------|
| plan | plan_doc_code + plan_doc_linear = complete | Wave 1 start |
| implement (per issue) | implement_doc_code + implement_doc_linear = complete | /test for that issue |
| test (per issue) | test_doc_code + test_doc_linear = complete | Next issue or wave gate |
| wave gate | All issues in wave through test_doc_linear | Next wave start |
| all waves gate | Every issue through test_doc_linear | /review |
| review | review_doc_code + review_doc_linear = complete, no CRITICALs | /close |
| operator-gate | 24 criteria pass | /commit |
| push-staging | Staging deploys + user verifies | /push-production |

## Agent Selection (via /code-dispatch)

| Surface | Agent | When |
|---------|-------|------|
| Backend (Fastify, API, webhooks) | backend-engineer | Endpoints, middleware, worker |
| Frontend (React, Tailwind) | frontend-engineer | Components, screens, routing |
| Mobile (Flutter) | mobile-engineer | Dart widgets, platform code |
| Database (PostgreSQL) | data-engineer | Schema, migrations, queries |
| Security (auth, HMAC, JWT) | security-engineer | Auth flows, verification |
| Infrastructure (Render, CI) | devops-engineer | Deployment, config |

## Crash Recovery

| State | What /ptheory Does |
|-------|-------------------|
| Workflow file has `in_progress` stuck | Offer resume or reset |
| Plan exists but no implement started | Resume from Wave 1 |
| Some issues complete, some not | Resume from first incomplete issue |
| Review found CRITICALs | Loop back to /implement for fixes |
