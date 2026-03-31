# Implementation Context Policies

Composable constraint modules loaded by /implement during the chain.

**Rule:** If a policy file exists for the project's context, it MUST be enforced. If no policy file exists, /implement proceeds with default behavior.

## Directory Structure

```
policies/
├── POLICY_TEMPLATE.md      # Template for creating new policies
├── README.md               # This file
├── codebase/               # Language + ORM patterns
│   ├── typescript-hono.md
│   ├── flutter-dart.md
│   ├── react-nextjs.md
│   ├── drizzle-postgres.md
│   └── database-migrations.md
├── databases/              # Database-specific patterns
│   └── postgresql.md
├── platforms/              # Deployment platforms
│   └── render.md
├── cloud/                  # Cloud service patterns
│   └── aws-s3.md
├── auth/                   # Authentication patterns
│   ├── jwt-patterns.md
│   └── oauth-general.md
├── security/               # Security mandates
│   └── owasp.md
├── standards/              # Compliance standards
│   ├── performance.md
│   └── accessibility.md
└── os/                     # OS-specific patterns
```

## Policy Count: 13

| Category | Count | Files |
|----------|-------|-------|
| codebase | 5 | typescript-hono, flutter-dart, react-nextjs, drizzle-postgres, database-migrations |
| databases | 1 | postgresql |
| platforms | 1 | render |
| cloud | 1 | aws-s3 |
| auth | 2 | jwt-patterns, oauth-general |
| security | 1 | owasp |
| standards | 2 | performance, accessibility |

## How /implement Uses Policies

1. Read the workflow state file's `context` block
2. For each context key with a value, check if `policies/{category}/{value}.md` exists
3. If exists → load and enforce as hard constraints
4. If not → proceed without constraint (current default behavior)

Policies are additive. Multiple policies can be loaded simultaneously (e.g., render + typescript-hono + postgresql + jwt).

## Creating New Policies

Use `POLICY_TEMPLATE.md`. Write when a real project needs it, not speculatively. After creating, run `/ptheory-update` to document.
