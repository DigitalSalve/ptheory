# Policy: PostgreSQL

Enforced by `/implement` when `context.databases` includes `postgresql`.

## When This Applies

- Any project using PostgreSQL directly (raw queries, pg pool, or through an ORM)
- Applies alongside ORM-specific policies (e.g., `drizzle-postgres.md`)

## MUST Rules

- **Connection pooling.** Never create a new connection per request. Use a pool (`pg.Pool`, Drizzle pool, Prisma connection pool). Set `max` based on Render/platform plan limits (typically 20-97).
- **Parameterized queries only.** Never interpolate user input into SQL. Use `$1, $2` placeholders or ORM parameterization.
- **Transactions for multi-statement operations.** If two or more statements must succeed or fail together, wrap in `BEGIN/COMMIT` with `ROLLBACK` on error.
- **Explicit column selection.** Use `SELECT col1, col2` not `SELECT *` in production queries. `*` breaks when columns change.
- **Indexes on foreign keys.** Every foreign key column must have an index. PostgreSQL does NOT auto-index foreign keys.
- **Timestamps with timezone.** Use `TIMESTAMPTZ` not `TIMESTAMP`. Avoid ambiguity.
- **UUID primary keys.** Use `gen_random_uuid()` (pg 13+) not `uuid-ossp`. No sequential IDs for user-facing entities.
- **Snake_case for everything.** Tables, columns, indexes, constraints — all snake_case.

## Patterns

### Connection Pool

```typescript
import pg from "pg";
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### Transaction

```typescript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("INSERT INTO orders (user_id) VALUES ($1)", [userId]);
  await client.query("UPDATE inventory SET qty = qty - 1 WHERE id = $1", [itemId]);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
}
```

### Idempotent Migration

```sql
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'new_col'
  ) THEN
    ALTER TABLE my_table ADD COLUMN new_col TEXT;
  END IF;
END $$;
```

## MUST NOT Rules

- Never use `SELECT *` in production queries
- Never interpolate variables into SQL strings
- Never use `TIMESTAMP` without timezone — always `TIMESTAMPTZ`
- Never create tables without a primary key
- Never add a foreign key without an index on the referencing column
- Never store passwords in plaintext — use bcrypt or argon2 at the application layer
- Never use `SERIAL` for user-facing IDs — use UUID

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| Connection per request | Exhausts pool, 500 errors under load | Use shared pool with `max` limit |
| Missing FK index | Full table scan on JOINs | `CREATE INDEX ON child (parent_id)` |
| `TIMESTAMP` without `TZ` | Timezone bugs when server/client differ | `TIMESTAMPTZ` always |
| `ON DELETE CASCADE` everywhere | Accidentally delete user data | Use `SET NULL` or `RESTRICT` for important relations |
| No `CONCURRENTLY` on big indexes | Locks table during creation | `CREATE INDEX CONCURRENTLY` for tables > 100k rows |

## Related Policies

- `codebase/drizzle-postgres.md` — Drizzle ORM patterns on top of PostgreSQL
- `codebase/database-migrations.md` — Migration tracking and safety
