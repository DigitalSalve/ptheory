---
name: cloudflare
description: |
  Cloudflare DNS and domain management for MyGOP domains (mygophub.com, app.mygophub.com).
  Use when the user says "/cloudflare", "check DNS", "add DNS record", "check domain",
  "domain status", "purge cache", or any Cloudflare/DNS task.
  Cloudflare is currently planned but not active — domains are managed via Render custom domains.
  Use this skill to set up Cloudflare when ready, or for DNS troubleshooting.
allowed-tools: Read, Glob, Grep, Bash
---

# Cloudflare Skill — MyGOP Domain Management

## Current State

Cloudflare is **planned but not active**. Domains are currently managed via **Render's custom domain feature**.

**Status:** Listed as "Planned" in `docs/03-architecture/INTEGRATION_PLATFORMS.md`

## MyGOP Domains

| Domain | Service | Render Service Name | Purpose |
|--------|---------|-------------------|---------|
| `mygophub.com` | Marketing site | mygop-web-production | React/Next.js public pages (SEO) |
| `app.mygophub.com` | Member app | mygop-webapp-production | Flutter web (authenticated) |
| `mygop-api-production.onrender.com` | API | mygop-api-production | Hono backend (default Render subdomain) |

## CORS Origins (Backend)

The API whitelist (backend/index.ts) includes these origins:
```
https://mygop-webapp.onrender.com
https://app.mygophub.com
https://webapp.mygophub.com
https://mygophub.com
https://mygop-web.onrender.com
```
Override with `CORS_ORIGINS` env var. Add `ALLOW_LOCALHOST_ORIGINS=true` for local dev.

## Webhook URLs (External Services)

| Service | URL |
|---------|-----|
| Stripe | `https://mygop-api-production.onrender.com/api/webhooks/stripe` |
| Persona | `https://mygop-api-production.onrender.com/api/webhooks/persona` |

## When Adopting Cloudflare

### Step 1: Add zone in Cloudflare
- Add `mygophub.com` as a zone in Cloudflare dashboard
- Update nameservers at domain registrar to Cloudflare's nameservers

### Step 2: Configure DNS records

**For Render static sites (mygop-web, mygop-webapp):**
```
Type    Name                Content                                 Proxied
CNAME   @                   mygop-web-production.onrender.com       Yes (orange cloud)
CNAME   app                 mygop-webapp-production.onrender.com    Yes (orange cloud)
```

**For Render web service (mygop-api) — if custom domain desired:**
```
Type    Name                Content                                 Proxied
CNAME   api                 mygop-api-production.onrender.com       DNS only (gray cloud)
```
Note: Render web services may require DNS-only (gray cloud) for their TLS to work. Check Render docs.

### Step 3: SSL configuration
- Set SSL/TLS mode to **Full (strict)** in Cloudflare (Render provides valid certs)
- Enable "Always Use HTTPS"

### Step 4: Update CORS if API domain changes
- If API gets custom domain (e.g., `api.mygophub.com`), update:
  - `CORS_ORIGINS` env var on mygop-api-production
  - `API_BASE_URL` env var on mygop-webapp-production
  - `NEXT_PUBLIC_API_URL` on mygop-web-production (if used)

### Step 5: Caching rules
- Marketing site (mygop-web): Standard caching, aggressive for static assets
- Member app (mygop-webapp): Cache static assets, no caching for `/index.html` (SPA)
- API: **No caching** (bypass cache for all `/api/*` routes)

## DNS Troubleshooting

### Check current DNS resolution
```bash
dig +short mygophub.com
dig +short app.mygophub.com
dig +short mygop-api-production.onrender.com
```

### Check CNAME chain
```bash
dig CNAME mygophub.com +trace
dig CNAME app.mygophub.com +trace
```

### Verify SSL certificate
```bash
curl -vI https://mygophub.com 2>&1 | grep -E "subject:|issuer:|expire"
curl -vI https://app.mygophub.com 2>&1 | grep -E "subject:|issuer:|expire"
```

### Test CORS preflight
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: https://app.mygophub.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://mygop-api-production.onrender.com/health
```

## Cloudflare API (When Active)

### List DNS records
```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" | jq '.result[] | {name, type, content, proxied}'
```

### Purge cache (marketing site only)
```bash
curl -s -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -d '{"files":["https://mygophub.com/","https://mygophub.com/events","https://mygophub.com/news"]}'
```

## Related Docs

- `docs/03-architecture/INTEGRATION_PLATFORMS.md` — Cloudflare listed as planned
- `docs/06-operations/DEPLOYMENT_WORKFLOW.md` — Custom domain setup via Render
- `docs/06-operations/CUSTOM_DOMAIN_WEBAPP_TROUBLESHOOTING.md` — CORS and domain troubleshooting
- `docs/06-operations/ENV_VARS_RENDER.md` — CORS_ORIGINS, API_BASE_URL

## Rules

- Never modify DNS records without explicit user approval
- Never purge cache for the member app without understanding SPA implications
- Always verify DNS propagation after changes (`dig +short`)
- When moving to Cloudflare, update all CORS origins and API base URLs
- Keep API on DNS-only (gray cloud) unless verified that Cloudflare proxy works with Render web services
