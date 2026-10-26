# Policy: TypeScript + Hono Codebase

Enforced by `/implement` when `context.codebase` includes `typescript-hono`.

## Route Handler Pattern

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tableName } from "../db/schema.js";
import { getAuthenticatedUser } from "../middleware/permissions.js";

const featureRouter = new Hono();

featureRouter.get("/", async (c) => {
  const user = await getAuthenticatedUser(c);
  const records = await db.query.tableName.findMany({
    where: eq(tableName.userId, user.id),
  });
  return c.json(records, 200);
});

featureRouter.post("/", async (c) => {
  const user = await getAuthenticatedUser(c);
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Validation failed" });
  }
  const [created] = await db.insert(tableName).values({ ... }).returning();
  return c.json(created, 201);
});

export default featureRouter;
```

## MUST Rules

- ESM imports with `.js` extension on internal imports
- **Check existing imports before writing new ones.** Before importing from any module, grep the codebase for how other files in the same directory import it. Match the existing pattern exactly. Do not guess export names.
- **Verify imports resolve.** After writing a new file, confirm every imported name actually exists as an export in the target module. `grep "export.*functionName" target-file.ts`.
- Validate ALL user input with Zod at route boundary
- Use `HTTPException` for all error responses — never raw `c.json({ error })` with status codes
- Never expose internal error details to clients
- Authenticate users via middleware before accessing user data
- Use parameterized queries only — never string interpolation in SQL
- Mount every route file in the server entry point

## Import Order

1. Node built-ins (`crypto`, `path`)
2. External packages (`hono`, `drizzle-orm`, `zod`)
3. Internal modules (relative with `.js` extension)
4. Types (with `type` keyword)

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `user-notifications.ts` |
| Functions/variables | camelCase | `getAuthenticatedUser` |
| Types/interfaces | PascalCase | `AuthenticatedUser` |
| Constants | SCREAMING_SNAKE | `SESSION_COOKIE_NAME` |
| Router exports | camelCase + Router | `eventsRouter` |
| DB columns | snake_case | `created_at` |

## ORM Patterns (Drizzle)

```typescript
// Select
const record = await db.query.tableName.findFirst({ where: eq(tableName.id, id) });

// Insert with returning
const [created] = await db.insert(tableName).values({ ... }).returning();

// Update
await db.update(tableName).set({ field: value }).where(eq(tableName.id, id));

// Delete
await db.delete(tableName).where(eq(tableName.id, id));

// Type inference
type RecordInsert = typeof tableName.$inferInsert;
type RecordSelect = typeof tableName.$inferSelect;
```

## Validation Pattern (Zod)

```typescript
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

const body = await c.req.json();
const parsed = createSchema.safeParse(body);
if (!parsed.success) {
  throw new HTTPException(400, { message: "Validation failed" });
}
```

## Testing Rules (CRITICAL)

- **Every route file must have an import validation test.** A test that does a real `import()` of the route file without mocks. If the import throws, the test fails. This catches import errors that `vi.mock()` hides.
- **Never mock an import without a separate test that validates the real import exists.** If you `vi.mock("../middleware/foo.js")`, you must also have a test that does `await import("../middleware/foo.js")` and verifies the expected exports exist.
- **Smoke boot test.** After implementation, run the server entry point (`npm run start` or equivalent) and verify it reaches the health endpoint. If the server won't start, the implementation is broken regardless of what unit tests say.

## MUST NOT Rules

- Do not use `eval()`, `Function()`, or template literal injection
- Do not log secrets, tokens, or password hashes
- Do not use `*` CORS origin with credentials enabled
- Do not put runtime tools (tsx) in devDependencies if used in start commands
- **Do not write tests that only test mocked modules.** Every mocked dependency must have a corresponding real import test.
