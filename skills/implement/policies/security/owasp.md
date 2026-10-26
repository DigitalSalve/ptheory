# Policy: OWASP Security — Top 11 Mandatory Checks

Enforced by `/implement` when `context.security` includes `owasp`.
Referenced by `security-engineer` agent during code review.

## The Top 11

These are mandatory. Every implementation and code review runs all 11.

| # | Vulnerability | MUST NOT | How to Verify |
|---|--------------|----------|--------------|
| 1 | **SQL Injection** | Raw SQL with string concatenation, unparameterized queries, template literals in SQL | `rg 'sql\x60.*\$\{' --type ts` + verify all DB calls use ORM or parameterized queries |
| 2 | **XSS** | Unescaped user input in HTML, `dangerouslySetInnerHTML`, `innerHTML` without sanitization | `rg 'innerHTML\|dangerouslySetInnerHTML\|v-html' --type-add 'web:*.{ts,tsx,jsx,vue,dart}'` |
| 3 | **CSRF** | Missing CSRF protection on state-changing endpoints, SameSite not set on session cookies | Check cookie attributes + form submissions + Origin/Referer validation |
| 4 | **Broken Auth** | Missing auth middleware on protected routes, weak token generation, no rate limit on login | Cross-reference routes with middleware + check token generation |
| 5 | **ADOR (Broken Access Control)** | Missing ownership checks, IDOR via predictable IDs, missing role checks | `rg 'params\.(id\|userId)' --type ts` → verify ownership check follows every param access |
| 6 | **Open Redirects** | Redirect URLs from user input without allowlist validation | `rg '(redirect\|returnUrl\|next\|callback).*req\.(query\|params\|body)' --type ts` |
| 7 | **Directory Traversal** | File paths from user input without sanitization, `../` not blocked | `rg 'path\.(join\|resolve).*req\.' --type ts` + `rg 'readFile.*req\.' --type ts` |
| 8 | **Exposed APIs** | Endpoints without auth that should have it, debug/admin endpoints in production | List all routes → verify auth middleware → check response bodies for leaks |
| 9 | **Default Creds** | Hardcoded passwords, default API keys, test secrets in production paths | `rg -i '(password\|secret\|key)\s*[:=]\s*["'"'"'][^"'"'"']{4,}' --type ts -g '!*.test.*'` |
| 10 | **Outdated Libs** | Dependencies with known CVEs, pinned to vulnerable versions | `npm audit --json 2>/dev/null` or `flutter pub outdated` |
| 11 | **Misconfigured CORS** | Wildcard `*` with credentials, reflected Origin, localhost in production | `rg 'cors\|CORS_ORIGINS\|Access-Control' --type ts` → verify allowlist is explicit |

## Authentication Policy

| Requirement | Enforcement |
|------------|-------------|
| Auth secrets strong and not defaults in prod | Check env var handling |
| Access tokens short-lived (15 min max) | Verify token generation |
| Refresh tokens single-use, hashed in storage | Verify rotation logic |
| Session cookies: httpOnly, secure (prod), SameSite=Lax+ | Verify cookie attributes |
| Password reset tokens: hashed, single-use, time-limited | Verify reset flow |
| Forgot-password: don't reveal if email exists | Verify response is generic |
| OAuth: verify tokens server-side, validate audience/client ID | Verify provider calls |
| Rate limit: login, registration, password reset, refresh | Verify rate limiting |

## Authorization Policy

| Requirement | Enforcement |
|------------|-------------|
| Every mutating endpoint has auth middleware | Grep for unprotected routes |
| Scoped access enforces boundaries | Check scope filters |
| Delegation cannot exceed granting user's scope | Check delegation logic |
| Read-only roles cannot write | Check role enforcement |
| New routes mounted with auth middleware | Verify in server entry |

## Input Validation Policy

| Requirement | Enforcement |
|------------|-------------|
| All user input validated with schema (Zod, Joi) before DB | Check route handlers |
| ORM parameterized queries only | No raw SQL concatenation |
| Email validated before use | Check validation |
| Password policy enforced | Check registration/reset |
| File uploads: validate content type and size | Check upload handlers |
| No eval(), Function(), template literal injection | `rg '(eval\(\|new Function\()' --type ts --type js` |
| Frontend sanitizes user-generated HTML | Check rendering |

## Secrets Policy

- No hardcoded secrets in source code
- .env files in .gitignore
- Default/insecure secrets blocked in production
- Webhook secrets required for webhook processing
- No secrets in console output

## Webhooks Policy

- Signatures verified before processing
- Raw body used for signature verification
- Appropriate error for missing/invalid signatures
- Webhook endpoints unauthenticated (use provider signature)

## CORS & Transport Policy

- CORS origin allowlist explicit (no wildcard with credentials)
- `credentials: true` paired with specific origins
- Production HTTPS only
- No localhost origins in production

## Data Exposure Policy

- User serialization excludes password hashes and internal fields
- Error responses don't leak stack traces in production
- Deleted user data not returned
- Audit logs capture auth events

## Scan Commands

```bash
# Top 11 quick scan
rg 'sql`.*\$\{' --type ts                                    # 1. SQL injection
rg 'innerHTML|dangerouslySetInnerHTML' --type ts --type tsx    # 2. XSS
rg -i '(password|secret|key)\s*[:=]\s*["'"'"'][^"'"'"']{4,}' --type ts -g '!*.test.*'  # 9. Default creds
rg 'console\.(log|error|warn).*(?:password|secret|token)' --type ts --type js  # Secrets in logs
rg '(eval\(|new Function\()' --type ts --type js              # Code injection
rg 'cors|CORS_ORIGINS|Access-Control' --type ts               # 11. CORS config
npm audit --json 2>/dev/null                                   # 10. Outdated libs
```
