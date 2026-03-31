# Policy: OAuth (Provider-Agnostic)

Enforced by `/implement` when `context.auth` includes `oauth`.

## When This Applies

- Any project integrating OAuth providers (Google, Facebook, Apple, GitHub, etc.)
- MyGOP: Google, Facebook, Apple sign-in

## MUST Rules

- **Use PKCE for all flows.** Authorization Code + PKCE (Proof Key for Code Exchange). Never use Implicit flow — it's deprecated and insecure.
- **Validate the `state` parameter.** Generate a random `state` on auth start, verify it matches on callback. Prevents CSRF.
- **Server-side token exchange.** The authorization code → token exchange MUST happen server-side. Never send client_secret to the frontend.
- **Verify ID token signatures.** When using OpenID Connect, verify the ID token's signature against the provider's JWKS. Don't trust unverified tokens.
- **Email-based account linking.** When a user signs in with OAuth and their email matches an existing account, link to that account. Don't create a duplicate.
- **Store provider tokens encrypted.** If you store OAuth provider tokens (for API access), encrypt at rest. Never store in plaintext.
- **Handle token expiry.** Provider access tokens expire. If you need ongoing API access, store and refresh them. If you only need sign-in, discard after creating your own session.
- **Redirect URI validation.** Register exact redirect URIs with the provider. Never use wildcards.

## Patterns

### Authorization URL

```typescript
function getAuthUrl(provider: string, state: string, codeVerifier: string) {
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return `${provider.authEndpoint}?` + new URLSearchParams({
    client_id: process.env[`${provider}_CLIENT_ID`]!,
    redirect_uri: `${process.env.BASE_URL}/api/auth/${provider}/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
}
```

### Callback Handler

```typescript
async function handleCallback(c) {
  const { code, state } = c.req.query();

  // 1. Verify state matches stored state
  if (state !== storedState) throw new HTTPException(400, { message: "State mismatch" });

  // 2. Exchange code for tokens (server-side)
  const tokens = await exchangeCode(code, codeVerifier);

  // 3. Verify ID token
  const profile = await verifyIdToken(tokens.id_token);

  // 4. Find or create user (email-based linking)
  let user = await findUserByEmail(profile.email);
  if (!user) user = await createUser(profile);

  // 5. Link OAuth identity
  await linkOAuthIdentity(user.id, provider, profile.sub);

  // 6. Issue your own session tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return redirect(successUrl);
}
```

### Account Linking

```typescript
// Check: does this email already have an account?
const existing = await db.query.users.findFirst({
  where: eq(users.email, oauthEmail),
});

if (existing) {
  // Link OAuth identity to existing account
  await db.insert(oauthIdentities).values({
    userId: existing.id,
    provider,
    providerUserId: oauthSub,
  });
} else {
  // Create new account + link
  const [user] = await db.insert(users).values({ email: oauthEmail }).returning();
  await db.insert(oauthIdentities).values({
    userId: user.id,
    provider,
    providerUserId: oauthSub,
  });
}
```

## MUST NOT Rules

- Never use Implicit flow (response_type=token)
- Never send `client_secret` to the frontend
- Never skip `state` parameter validation
- Never trust unverified ID tokens
- Never store provider tokens in plaintext
- Never create duplicate accounts for the same email
- Never use wildcard redirect URIs

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| No `state` parameter | CSRF attack vector | Random state, verify on callback |
| Client-side token exchange | Exposes client_secret | Server-side exchange only |
| Duplicate accounts | Same user, two accounts, data split | Email-based linking |
| Storing provider tokens unencrypted | Database breach exposes provider API access | Encrypt at rest |
| No PKCE | Authorization code interception attack | Always use PKCE with S256 |

## Related Policies

- `auth/jwt-patterns.md` — JWT session management after OAuth sign-in
- `security/owasp.md` — General web security
