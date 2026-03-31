# Policy Template

Use this template when creating a new implementation policy. Every policy follows this structure.

---

```markdown
# Policy: {Technology Name}

Enforced by `/implement` when `context.{category}` includes `{slug}`.

## When This Applies

- {What projects/contexts trigger this policy}
- {What the technology is used for in those projects}

## MUST Rules

- {Hard constraint — violation is a bug}
- {Hard constraint}
- {Hard constraint}

## Patterns

### {Pattern Name}

\`\`\`{language}
// Correct pattern with comments
\`\`\`

### {Pattern Name}

\`\`\`{language}
// Another correct pattern
\`\`\`

## MUST NOT Rules

- {Anti-pattern — doing this is always wrong}
- {Anti-pattern}

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| {description} | {consequence} | {fix} |

## Related Policies

- {Link to related policy if applicable}
```

---

## Rules for Policy Authors

1. **MUST rules are hard constraints.** If the policy says MUST, `/implement` treats it as a gate. Violation = fix before proceeding.
2. **Patterns are examples, not exhaustive.** Show the most common correct patterns. Don't try to cover every edge case.
3. **MUST NOT rules are anti-patterns.** These are things that are always wrong in this technology context.
4. **Common mistakes table catches real bugs.** Fill it with mistakes agents have actually made, not hypothetical ones.
5. **Keep it under 100 lines.** If it's longer, the technology probably needs two policies (e.g., `postgresql.md` for the database + `drizzle-postgres.md` for the ORM).
6. **Test against real code.** Before declaring a policy done, verify every MUST rule against the project's actual codebase.
