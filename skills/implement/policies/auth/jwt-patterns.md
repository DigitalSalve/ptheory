# Policy: JWT Patterns

Enforced by `/implement` when `context.auth` includes `jwt`.

## When This Applies

- Any project using JWT for authentication (access tokens, refresh tokens)
- MyGOP: access tokens (15 min) + refresh tokens (30 days)

## MUST Rules

- **Short-lived access tokens.** Max 15 minutes. Never longer. If you need longer sessions, use refresh tokens.
- **Refresh token rotation.** Every refresh issues a new refresh token and invalidates the old one. Prevents token reuse after theft.
- **Store refresh tokens server-side.** Database or Redis. Never only in the client. Server must be able to revoke.
- **HttpOnly cookies for web.** Access tokens in HttpOnly, Secure, SameSite=Lax cookies. Never in localStorage — XSS can steal them.
- **Bearer header for mobile/API.** `Authorization: Bearer {token}`. Store in secure storage (Keychain/Keystore), not SharedPreferences/AsyncStorage for production.
- **Validate on every request.** Middleware verifies signature, expiration, and issuer on every authenticated request. Never trust without validation.
- **Strong signing secret.** Minimum 256-bit random secret. `openssl rand -base64 32`. Never use predictable strings.
- **Include minimal claims.** `sub` (user ID), `iat`, `exp`. Add `role` only if needed for middleware. Never include PII (email, name) in the token.

## Patterns

### Token Generation

```typescript
import jwt from "jsonwebtoken";

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m", algorithm: "HS256" }
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d", algorithm: "HS256" }
  );
}
```

### Token Verification Middleware

```typescript
async function requireAuth(c, next) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
    || c.req.cookie("mygop_session");

  if (!token) throw new HTTPException(401, { message: "No token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
}
```

### Refresh Flow

```typescript
// 1. Client sends refresh token
// 2. Server validates refresh token
// 3. Server checks refresh token exists in DB (not revoked)
// 4. Server generates new access + new refresh token
// 5. Server stores new refresh token, deletes old one
// 6. Server returns both tokens
// 7. Client stores both, uses new access token
```

### Client 401 Handling

```
Request fails with 401
  → Try refresh (POST /api/auth/refresh with refresh token)
  → Success? Store new tokens, retry original request
  → Failure? Clear session, redirect to login
```

## MUST NOT Rules

- Never store JWTs in localStorage (XSS vulnerable)
- Never put PII in JWT claims (tokens are base64, not encrypted)
- Never use symmetric secrets shorter than 256 bits
- Never skip expiration validation
- Never use `none` algorithm
- Never log full JWT tokens (they're credentials)
- Never issue access tokens longer than 15 minutes

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| Access token in localStorage | XSS steals it | HttpOnly cookie (web) or secure storage (mobile) |
| No refresh rotation | Stolen refresh token works forever | Issue new refresh on every refresh, invalidate old |
| Email in JWT claims | Token is base64-readable, leaks PII | Only `sub` (user ID), `role`, `iat`, `exp` |
| 24-hour access tokens | Stolen token has long attack window | 15 min max, use refresh for longer sessions |
| No server-side refresh storage | Can't revoke compromised tokens | Store in DB, check on refresh |

## Related Policies

- `auth/oauth-general.md` — OAuth provider integration
- `security/owasp.md` — General web security
