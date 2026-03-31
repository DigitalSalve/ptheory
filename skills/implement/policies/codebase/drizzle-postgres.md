# Policy: Drizzle ORM + PostgreSQL

Enforced by `/implement` when `context.codebase` includes `drizzle-postgres`.

## Schema Design

- Primary key: `uuid("id").primaryKey().defaultRandom()`
- Timestamps: `timestamp("created_at").defaultNow()`, `timestamp("updated_at").defaultNow()`
- Column naming: snake_case — `created_at`, `is_archived`
- Boolean defaults: `boolean("col").notNull().default(false)`
- Foreign keys: `.references(() => target.id, { onDelete: "cascade" | "set null" })`
- JSON columns: `jsonb("col").$type<TypeHere>()` for typed JSON
- Enums: `pgEnum("status", ["ACTIVE", "INACTIVE", "ARCHIVED"])`

## Index Pattern

```typescript
export const myTable = pgTable("my_table", { ... }, (table) => ({
  userIdIdx: index("my_table_user_id_idx").on(table.user_id),
  uniqueNameIdx: uniqueIndex("my_table_name_unique").on(table.name),
}));
```

Name pattern: `{table_name}_{column(s)}_{idx|key|unique}`

## Migration Rules (CRITICAL)

1. Every table in schema MUST have a migration. Missing = missing table in prod = 500.
2. Every column in schema MUST have a migration.
3. Naming: `YYYYMMDD_description.sql`
4. Idempotent SQL only:

| Operation | Template |
|-----------|----------|
| New table | `CREATE TABLE IF NOT EXISTS` |
| New column | `DO $$ BEGIN ALTER TABLE ... ADD COLUMN ...; EXCEPTION WHEN duplicate_column THEN NULL; END $$;` |
| New enum | `DO $$ BEGIN CREATE TYPE ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` |
| New enum value | `ALTER TYPE ... ADD VALUE IF NOT EXISTS 'NEW_VALUE'` |
| New index | `CREATE INDEX IF NOT EXISTS` |

5. Never rewrite or delete existing migrations. Append-only.
6. Run migrations when created. Execute immediately.
7. Validate schema-migration sync before push.

## Query Patterns

```typescript
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, and, desc, isNull } from "drizzle-orm";

// Select
const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

// Insert
await db.insert(users).values({ name, email });

// Update
await db.update(users).set({ name }).where(eq(users.id, id));

// Delete
await db.delete(users).where(eq(users.id, id));

// Join
const results = await db.select()
  .from(tableA)
  .innerJoin(tableB, eq(tableA.b_id, tableB.id));
```

## Data Integrity

- `onDelete: "cascade"` for owned entities
- `onDelete: "set null"` for references that should survive deletion
- Unique constraints via `uniqueIndex`
- Composite keys for join tables: unique on `(entity_a_id, entity_b_id)`
- Soft delete: `deleted_at` timestamp when data must be retained

## MUST NOT Rules

- Never use raw string interpolation in SQL queries
- Never delete or rewrite existing migration files
- Never skip schema-migration sync validation before push
