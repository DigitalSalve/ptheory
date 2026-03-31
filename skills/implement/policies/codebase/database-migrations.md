# Policy: Database Migration Safety

Enforced by `/implement` and `/migrate` for any project that uses SQL migrations.

## Migration Tracking (CRITICAL)

Every project MUST have a `schema_migrations` tracking table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT
);
```

### Why This Is Non-Negotiable

Without tracking:
- Every migration runs every deploy (slow, fragile)
- Partial failures leave unknown DB state
- No way to know what's been applied without manually checking
- Rollback is impossible — you don't know what to roll back

### Migration Runner Requirements

The migration runner script MUST:

1. Read `schema_migrations` table for already-applied filenames
2. List all `.sql` files in the migrations directory
3. Diff: run only unapplied migrations, in filename order (alphabetical)
4. Each migration runs inside a transaction
5. On success: insert filename + timestamp into `schema_migrations`
6. On failure: rollback transaction, do NOT record, stop execution, report error
7. Log each migration: filename, duration, success/failure

### Bootstrap

The tracking table migration is always the first migration. If `schema_migrations` doesn't exist, create it before running anything else. This is the one migration that's self-bootstrapping.

## Migration File Rules

| Rule | Enforcement |
|------|------------|
| Idempotent SQL | MUST use `IF NOT EXISTS`, `DO $$ ... $$` |
| One logical change per file | Don't combine unrelated changes |
| Never rewrite existing migrations | Append-only — create new files |
| Never delete existing migrations | Even if the table was later dropped |
| Naming: `YYYYMMDD_description.sql` | Alphabetical = execution order |
| Run immediately after creation | Don't defer to deploy |

## Transaction Wrapping

```sql
-- Every migration runs inside a transaction (handled by runner, not in SQL)
-- But if the runner doesn't wrap, the migration itself should be safe:

BEGIN;

CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
```

The runner wraps in a transaction. The SQL inside should still be idempotent as a safety net.

## Schema Sync Validation

After any migration change, run schema sync checks:

| Check | Command | What It Catches |
|-------|---------|----------------|
| Table sync | `npm run check:schema-migrations` | Schema tables without migrations |
| Column sync | `npm run check:schema-columns` | Schema columns without migrations |
| Full validation | `npm run validate:production` | Both + production deps + API health |

All must pass before push. No exceptions.

## Templates

### New Table Migration

```sql
-- YYYYMMDD_create_table_name.sql
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### New Column Migration

```sql
-- YYYYMMDD_add_column_to_table.sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE table_name ADD COLUMN new_column TEXT;
  END IF;
END $$;
```

### Migration Tracking Bootstrap

```sql
-- 00000000_create_schema_migrations.sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT
);
```

### Migration Runner Pattern (TypeScript)

```typescript
import { readdir } from "fs/promises";
import { pool } from "../db/index.js";

async function migrate() {
  // Ensure tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum TEXT
    )
  `);

  // Get applied migrations
  const { rows: applied } = await pool.query(
    "SELECT filename FROM schema_migrations ORDER BY filename"
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  // Get migration files
  const files = (await readdir("db/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Run unapplied
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const sql = await readFile(`db/migrations/${file}`, "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`✓ ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`✗ ${file}: ${err.message}`);
      throw err; // Stop execution
    } finally {
      client.release();
    }
  }
}
```

## When to Apply This Policy

- Any project with a `db/migrations/` directory
- Any project using Drizzle, Prisma, or raw SQL migrations
- Any project deploying to a managed database (Render, AWS RDS, etc.)

## What This Policy Does NOT Cover

- ORM-specific migration generation (Drizzle Kit, Prisma Migrate) — those have their own patterns
- Data backfill scripts — those are separate from schema migrations
- Seed data — separate concern, separate directory
