---
name: db
description: |
  Database schema changes, migrations, and validation.
  Use when the user says "/db", "create migration", "add table", "add column",
  "check schema", "run migration", or when making any database changes.
  Covers Drizzle, Prisma, raw SQL, and general migration workflows.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Database Skill

Manage schema changes and migrations. Discover the project's ORM and migration system before acting.

## Before Making Changes

1. Read the schema source of truth (e.g., `schema.ts`, `schema.prisma`, `models.py`)
2. Check migration directory and naming convention
3. Check for sync/validation scripts
4. Read any migration policy docs (check `docs/` for migration SOPs)
5. **Check for `schema_migrations` tracking table** — if it doesn't exist, create it first. See policy: `~/.claude/skills/implement/policies/codebase/database-migrations.md`

## Process: Schema Change

### Step 1: Modify schema

Update the ORM schema file with the new table/column/index.

### Step 2: Create migration

- **Drizzle:** `npm run db:generate` or hand-write SQL in `db/migrations/YYYYMMDD_description.sql`
- **Prisma:** `npx prisma migrate dev --name description`
- **Raw SQL:** Create idempotent SQL file with `IF NOT EXISTS` / `DO $$ BEGIN ... END $$`

Migration rules:
- Always idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
- Never rewrite or delete existing migrations
- Naming: `YYYYMMDD_descriptive_snake_case.sql`

### Step 3: Run migration

Execute against the target database immediately. Do not defer.

### Step 4: Validate

Run schema-migration sync checks if available:
```bash
npm run check:schema-migrations   # if exists
npm run check:schema-columns      # if exists
```

### Step 5: Update docs

If the project has schema documentation, update it.

## Common Operations

### Add table
1. Add to schema → 2. Create migration with `CREATE TABLE IF NOT EXISTS` → 3. Run → 4. Validate

### Add column
1. Add to schema → 2. Create migration with `ALTER TABLE ADD COLUMN` (idempotent) → 3. Run → 4. Validate

### Add index
1. Add to schema → 2. Create migration with `CREATE INDEX IF NOT EXISTS` → 3. Run → 4. Validate

### Check what exists
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'foo';
```

## Rules

- Never `DROP TABLE` or `DROP COLUMN` without explicit user approval
- Never delete or modify existing migration files
- Always use idempotent SQL
- Always run migrations immediately after creating them
- Always validate schema-migration sync before pushing
