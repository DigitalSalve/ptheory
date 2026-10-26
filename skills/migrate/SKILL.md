---
name: migrate
description: |
  Database schema change and migration workflow — modify schema, create migration, run it, validate.
  Use when the user says "/migrate", "schema change", "add a table", "add a column",
  "create migration", "run migration", or any database schema modification task.
  Enforces the full workflow: schema → migration → run → validate. Never just schema without migration.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Migrate Skill

Full schema-to-migration workflow. Never change schema without a migration. Never create a migration without running it.

## Before Starting

1. Read the current schema (Drizzle: `backend/db/schema.ts`, Prisma: `prisma/schema.prisma`)
2. Check existing migrations: `ls backend/db/migrations/ | tail -10` (or equivalent)
3. Understand what's being changed and why
4. **Check for migration tracking table:** Does `schema_migrations` exist? If not, create it first (see Step 0).

## Step 0: Ensure Migration Tracking (One-Time)

**Every project MUST have a `schema_migrations` tracking table.** Per policy: `~/.claude/skills/implement/policies/codebase/database-migrations.md`

Check if it exists:
```sql
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations');
```

If it doesn't exist, create the bootstrap migration:
```bash
# Create: 00000000_create_schema_migrations.sql
cat > backend/db/migrations/00000000_create_schema_migrations.sql << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT
);
EOF
```

Then update the migration runner script to use the tracking table (see policy for the pattern).

Run it: `cd backend && npx tsx scripts/run-migration.ts db/migrations/00000000_create_schema_migrations.sql`

## Process

### Step 1: Modify schema

Edit `backend/db/schema.ts` with the new table, column, index, or enum.

Follow conventions:
- Table names: `snake_case` plural (`poll_votes`, `sweepstakes_entries`)
- Column names: `snake_case` (`created_at`, `is_archived`)
- Use explicit short constraint names (avoid PostgreSQL 63-char truncation)
- Add relations if applicable

### Step 2: Create migration file

**Naming:** `YYYYMMDD_descriptive_snake_case.sql`

**Location:** `backend/db/migrations/`

**Get today's date:**
```bash
date +%Y%m%d
```

**Write idempotent SQL:**

For new tables:
```sql
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

For new columns:
```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table_name' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE table_name ADD COLUMN new_column TEXT;
  END IF;
END $$;
```

For new indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name (column_name);
```

For new enums:
```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_name') THEN
    CREATE TYPE enum_name AS ENUM ('value1', 'value2');
  END IF;
END $$;
```

### Step 3: Run the migration immediately

```bash
cd backend && npx tsx scripts/run-migration.ts db/migrations/YYYYMMDD_name.sql
```

Do NOT defer. Do NOT ask. Run it now.

### Step 4: Validate

```bash
cd backend && npm run check:schema-migrations
cd backend && npm run check:schema-columns
```

Both must pass. If they fail, there's a mismatch between schema.ts and migrations.

### Step 5: Update docs (if applicable)

If the change is significant (new table, new domain), update:
- `docs/03-architecture/MYGOP_DATABASE_SCHEMA.md`
- System Map if new domain area

## Rules

- **Never** change `schema.ts` without creating a migration
- **Never** create a migration without running it immediately
- **Never** rewrite or delete existing migration files
- **Always** use idempotent SQL (`IF NOT EXISTS`, `DO $$ ... $$`)
- **Always** validate schema sync after creating migration
- Migration naming: `YYYYMMDD_descriptive_snake_case.sql`
- One logical change per migration file
- Test locally with `npm run db:push` if needed before creating the production migration
