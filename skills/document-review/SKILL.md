---
name: document-review
description: |
  Reviews existing documentation for human readability and rewrites it to PTheory format standards.
  Also creates new documentation from code or conversations in the concise, scannable format.
  Use when the user says "/document-review", "fix the docs", "make docs readable",
  "rewrite this doc", "clean up documentation", "document this", or when documentation
  is flagged as too verbose or hard to follow.
  This is a global skill — works with any project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent, TodoWrite
---

# Document Review Skill

Reviews existing documentation for human readability and rewrites to PTheory format standards. Creates new documentation in the same concise format.

**The problem this solves:** AI produces documentation at AI reading speed. Humans can't keep up. This skill enforces format standards that make docs scannable by a person in 30 seconds.

## When to Use

- Existing docs are too verbose, too long, or hard to scan
- User says "/document-review", "fix the docs", "make this readable"
- Creating new documentation from scratch
- After onboarding produces initial docs that need tightening
- Before operator gate — ensure artifacts are human-readable

## The Format Standard

Every document produced or reviewed by this skill follows these rules:

### Rule 1: TL;DR First
Every document starts with 3 bullet points max. A human reads these and knows what the file is without scrolling.

```markdown
- What this is
- Why it matters
- Key takeaway or current state
```

### Rule 2: Tables Over Prose
Structured data is ALWAYS a table. Never a paragraph listing things.

**Bad:**
```
The system uses PostgreSQL for the database, Hono for the API framework,
Drizzle as the ORM, and deploys to Render with five services including
the API, marketing site, webapp, worker, and database.
```

**Good:**
```markdown
| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL |
| API | Hono 4.x |
| ORM | Drizzle |
| Deploy | Render (5 services) |
```

### Rule 3: No Prose Blocks Over 3 Sentences
If you need more than 3 sentences to explain something, it's either:
- A table (structured data)
- A list (sequential steps)
- Multiple sections (different topics mixed together)

### Rule 4: Headers Answer Questions
Not labels — questions the reader is asking.

| Bad Header | Good Header |
|-----------|------------|
| System Flow | How requests move through the system |
| Dependencies | What this project depends on |
| Authentication | How users log in |
| Deployment | How to deploy changes |

### Rule 5: One Fact Per Line
No compound sentences. Each line conveys one idea.

**Bad:** "The API uses Hono as its framework and Drizzle as the ORM, connecting to PostgreSQL via a connection pool managed by the pg library."

**Good:**
- API framework: Hono 4.x
- ORM: Drizzle (type-safe queries)
- Database: PostgreSQL (pg pool)

### Rule 6: Link Don't Inline
If content exists elsewhere, link to it. Don't copy it into the current document.

### Rule 7: Max Page Lengths

| Document Type | Max Length | If Longer |
|--------------|-----------|-----------|
| Plane comment | 15 lines | Link to artifact file |
| Artifact file (.claude/artifacts/) | 50 lines | Split into sections or multiple files |
| Architecture doc | 100 lines | Split into sub-documents |
| Feature note | 30 lines | You're over-documenting |
| README / CLAUDE.md | 150 lines | Move details to linked docs |

## Process

### Mode 1: Review Existing Documentation

1. **Read the document** completely
2. **Score against format rules** — check each of the 7 rules
3. **Identify violations:**
   - Prose blocks > 3 sentences
   - Data that should be tables
   - Missing TL;DR
   - Headers that are labels not questions
   - Compound sentences
   - Inlined content that should be linked
   - Over max length
4. **Rewrite** the document following the format standard
5. **Report** what changed and why

Output:
```markdown
## Document Review: {filename}

**Before:** {line count} lines, {violation count} format violations
**After:** {line count} lines, {violation count} violations fixed

| Violation | Location | Fix |
|-----------|----------|-----|
| Prose block (8 sentences) | Line 15-22 | Converted to table |
| Missing TL;DR | Top | Added 3-bullet summary |
| Label header | "Dependencies" | Changed to "What this depends on" |
```

### Mode 2: Create New Documentation

1. **Understand the subject** — read code, conversations, or user input
2. **Write in format standard** from the start — don't write verbose then trim
3. **Structure:**
   - TL;DR (3 bullets)
   - Sections with question headers
   - Tables for all structured data
   - Max 3 sentences per prose block
   - Links to existing docs, don't duplicate

### Mode 3: Batch Review

Review all docs in a directory or the entire docs hierarchy:

1. **Scan** all .md files in the target directory
2. **Score each** against format rules
3. **Prioritize** by severity (most violations first)
4. **Rewrite** each file
5. **Report** summary of all changes

## Rules

1. **Concise is not incomplete.** Cutting words doesn't mean cutting information. Every fact stays — the packaging changes.
2. **Tables are mandatory for structured data.** If it has columns, it's a table. No exceptions.
3. **TL;DR is mandatory.** Every document starts with the summary. No exceptions.
4. **Don't add content.** This skill reformats — it doesn't invent new information. If something is missing, note it as a gap, don't fill it with assumptions.
5. **Preserve meaning.** The rewrite must convey the same information. If you're unsure a rewrite preserves meaning, keep the original and flag it.
6. **Human-first.** Every format decision is made for the person scanning at speed, not the AI that can read anything.
