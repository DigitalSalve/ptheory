# Policy: Performance Standards

Enforced by `/implement` when `context.standards` includes `performance`.

## Frontend Performance

| Area | MUST |
|------|------|
| List rendering | Use lazy builders (`ListView.builder`, virtualized lists) — never eager children |
| Image loading | Lazy load, proper sizing, cache |
| State scope | Selective subscriptions (`select()`) — don't rebuild entire trees |
| Heavy builds | Extract sub-widgets/components, use `const` constructors |
| Startup | Defer non-critical initialization |
| Theme | Theme objects should be `const` or cached |
| HTTP client | No token refresh storms — concurrent requests queue, not each trigger refresh |
| Bundle size | Remove unused deps, deferred/lazy loading for large modules |

## Backend Performance

| Pattern | Detection | Fix |
|---------|-----------|-----|
| N+1 queries | Loop with `await db.select()` inside | Batch or use relations |
| Missing indexes | `EXPLAIN ANALYZE` shows Seq Scan | Add index + migration |
| Unbounded selects | `select()` without `limit` | Add `.limit()` and pagination |
| Over-fetching | `select()` returning all columns | Select only needed fields |
| Full table scans | Filter on non-indexed columns | Add targeted indexes |

## Index Priority

Add indexes on:
1. Foreign keys used in JOINs
2. Columns in WHERE clauses
3. Columns in ORDER BY
4. Composite indexes for common query patterns

## API Route Performance

- Check middleware chain for redundant DB lookups
- Auth middleware before expensive operations
- Check for blocking initialization at server start
- Worker: batch sizes for bulk ops, `SKIP LOCKED` for contention

## Web Vitals Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

## MUST Rules

- Measure before and after. No optimization without evidence.
- Add index migration for any new query on non-indexed column
- Use lazy builders for any list > 20 items
- No blocking async in widget build methods
