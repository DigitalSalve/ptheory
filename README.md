# PTheory

The original PTheory: the research, the paper and the first framework for governing AI coding agents, by Dustin Taylor, 31 March 2026.

## What it does

PTheory is a development method for Claude Code, expressed as 50 skills (how a step is done) and 21 agents (who does it). Its aim is to cut the development cycle in half by letting exploration and production run in parallel, joined by contracts.

Three convictions sit under everything in it:

| Conviction | What it meant in practice |
|---|---|
| Nothing starts without a defined scope. | A scope document is required before any planning. It is never edited, only amended. |
| Work moves through a fixed chain, one job per step. | Plan, implement, test, review and close are separate steps. A step does its job and nothing else. |
| If it isn't written down, it doesn't exist. | Every step is documented twice: in the repo and in the tracker. The final gate only accepts files. |

An **architect** explores and builds; an **operator** takes the result into production. The handoff between them is a contract boundary, guarded by a 24-point readiness gate.

## Quick start

This repo is a historical source, kept as it stood. To try the original framework in Claude Code:

```bash
cp -R skills/* ~/.claude/skills/
cp -R agents/* ~/.claude/agents/
```

Then `/ptheory` in a project: it detects state and routes to onboarding or planning. The skills that talk to an issue tracker expect a self-hosted Plane instance; point them at your own.

## How it works

```
/plan → /document-plane → /implement → /document-code → /document-plane
  → /test → /document-code → /document-plane
  → /review → /document-code → /document-plane
  → /close
```

- `/plan` classifies a milestone's issues into waves; eight specialist agents review the draft, and a critical finding forces a revision.
- Each issue runs implement, test and review as separate steps, with documentation to the repo and the tracker after every one.
- A critical review finding sends the work back to planning.
- `/close` verifies the readiness gate before a milestone closes.

[`history/original-ptheory.md`](history/original-ptheory.md) is the complete account: lifecycle, state, readiness gate, every rule it set.

## Lineage

- **28 January 2026.** The documentation base PTheory grew from was extracted from two production projects: [origin_project](https://github.com/DigitalSalve/origin_project). Its entry-point file (`AI.md`), eight-layer documentation hierarchy, SOPs and architect-and-subagent pattern carry into PTheory. Pushed to GitHub on 6 February 2026.
- **22 March 2026.** The name PTheory first appears, in a commit on one of those projects: "PTheory skill chain architecture". The workflow chain design and schema date from the same day.
- **23 to 30 March 2026.** The system spec is written and versioned from v0.2.0 to v0.10.0, and the lifecycle flow is written in Linear; both are on the `feat/render-multi-env-standard` branch.
- **31 March 2026.** This repo is created and the framework is committed as 50 skills and 21 agents.

## Status

Historical. This is the framework as defined on 31 March 2026; it is not maintained. The system spec, workflow schema, chain flow and design docs, plus a Render multi-environment standard (31 March to 5 April 2026), are on the `feat/render-multi-env-standard` branch.

Later PTheory frameworks (`ptheory-claude-initial`, `ptheory-template`, `ptheory-framework`) were built from this research and are credited in their own repos.

## The thinking behind this

- [PTheory: Parallel Architecture and Operations](papers/parallel-architecture-and-operations.pdf): Architect and Operator, awareness without premature enforcement, enforcement at the commitment boundary.
- [`papers/build_ptheory_doc.js`](papers/build_ptheory_doc.js) builds the Word version of that paper with its diagrams (`npm install docx`, then `node papers/build_ptheory_doc.js`).

## Credits

Built for [Claude Code](https://claude.com/claude-code). The method drew on the Architects and Operators framework.

## License

[MIT](LICENSE).

---

Root: PTheory · Type: build
