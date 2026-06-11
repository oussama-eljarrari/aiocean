# MCP OAuth 2.1 — Implementation Status & Plan

The clean OAuth 2.1 spec-aligned implementation. Two separate services that talk
through the spec — no proxies, no hacks.

---

## Architecture

```
MCP Client (Claude, Cursor, MCPJam Inspector, …)
    │
    ├─ GET /mcp ──────────────────────► Agent (port 3001) — Resource Server
    │    ◄── 401 + WWW-Authenticate ──
    │
    ├─ GET /.well-known/oauth-protected-resource ──► Agent
    │    ◄── { authorization_servers: ["http://localhost:8080"] }
    │
    ├─ GET /.well-known/oauth-authorization-server ──► PHP API (port 8080) — Auth Server
    │    ◄── { registration_endpoint, authorization_endpoint, token_endpoint }
    │
    ├─ POST /register ──► PHP API  (Dynamic Client Registration, RFC 7591)
    │    ◄── { client_id, client_name, logo_uri, … }
    │
    ├─ GET /authorize?... ──► React (port 5173) — Browser-facing UI
    │    ◄── inline login (if not authed) → consent screen
    │    POST /api/oauth/consent ──► PHP API
    │    ◄── { redirect: "client_callback?code=…&state=…" }
    │    window.location.href = redirect  →  browser goes to client callback
    │
    ├─ POST /token ──► PHP API
    │    ◄── { access_token, refresh_token, … }
    │
    └─ POST /mcp + Bearer ──► Agent
         ◄── MCP response
```

Two independent services, no reverse proxy. The MCP client talks to both. The
PHP API owns tokens, the Agent owns tool execution. The React SPA renders the
OAuth authorization UI but **is not** itself the authorization server — the
PHP API still issues and signs the JWTs.

---

## What This Branch Adds

### 1. PHP API — Authorization Server (`packages/api/`)

- `league/oauth2-server` + `defuse/php-encryption` for the OAuth machinery
- Migration: `oauth_clients`, `oauth_scopes`, `oauth_auth_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`
- RFC 8414 AS metadata at `/.well-known/oauth-authorization-server`
- RFC 7591 Dynamic Client Registration at `/register` (JSON + form)
- RFC 7637 PKCE S256 (mandatory) on `/authorize` and `/token`
- RFC 8707 resource parameter (binds tokens to the Agent's `/mcp`)
- RFC 6749 authorization_code + refresh_token grants
- JWT access tokens (RS256) — Agent verifies locally, no network roundtrip
- HTML `/login` + `/logout` for the human user; HTML `/authorize` consent page
  (kept for backward compatibility, not used by the React flow)
- Two new JSON endpoints for the React consent flow:
  - `GET  /api/oauth/authorize-info` — validates the request, returns client/scopes
  - `POST /api/oauth/consent` — completes authorization, returns `{ redirect }`

### 2. Agent — Resource Server (`packages/agent/`)

- `@modelcontextprotocol/sdk` for the MCP server
- `jose` for JWT verification (RS256, public-key)
- `auth-middleware.ts` — RFC 9728 Bearer-token challenge on `/mcp` with `WWW-Authenticate`
- `/.well-known/oauth-protected-resource` — points MCP clients to the PHP AS
- `mcp.ts` — five tools: `search_ai_ocean_tools`, `get_ai_ocean_tool`,
  `list_ai_ocean_categories`, `list_submissions`, `decide_submission`

### 3. React — Consent UI (`packages/web/`)

- New `/authorize` route in `App.tsx`
- `AuthorizePage.tsx` — single-page consent flow:
  - Reads OAuth params directly from the URL
  - If not authenticated → renders an **inline** login form on the same page
    (no redirect, no sessionStorage — params stay in the URL)
  - On login → transitions to the consent screen
  - On approve/deny → POST to `/api/oauth/consent` → `window.location.href = redirect`
- Client logo + AI Ocean logo shown side-by-side at the top of the consent screen

---

## Known Gaps / Future Work

### Admin authorization across the Agent → PHP boundary (TODO)

**Problem:** `CurrentUser::isAdmin()` on the PHP backend only checks
`$_SESSION['user_role']`. When the Agent calls PHP admin endpoints
(`list_submissions`, `decide_submission`) on behalf of a user whose JWT carries
the `mcp:admin` scope, PHP doesn't know about it — there's no session, no JWT
forwarded, no shared auth context. So `isAdmin()` returns `false` and the
admin action 403s.

**Intended fix (designed but not yet implemented):**

The agent's Hono middleware already verifies the JWT and has the scope claim.
Use that as the single source of truth and have the agent "vouch" for the
admin user when calling PHP — no double JWT verification, no JWT lib in PHP.

Approach (trust header + shared secret):

1. Add `INTERNAL_SHARED_SECRET` to both `.env` files.
2. The Agent's Hono middleware already extracts the scope. On requests
   for admin-scoped MCP tools, the agent's `php-client.ts` adds:
   - `X-Internal-Admin: 1`
   - `X-Internal-Signature: <HMAC-SHA256(secret, "1")>`
   - `X-Internal-User-Id: <jwt.sub>`
3. PHP adds a small middleware that, when `X-Internal-Admin: 1` is present,
   verifies the signature and seeds `$_SESSION` with the role + user id
   from the trusted header. The existing `isAdmin()` Just Works.

This is the correct, minimal fix: JWT verified once (at the agent boundary),
PHP stays trustless, the shared secret prevents external spoofing of the
header.

### Other smaller gaps

- The `MCP_REQUIRED_SCOPES` is wired into the `WWW-Authenticate` response but
  the agent middleware doesn't enforce them — any valid JWT can currently hit
  any tool. (Intentionally lenient in dev; tighten when admin fix lands.)
- The `OAUTH_AUTO_APPROVE=true` flag still auto-issues codes in dev for
  legacy PHP-rendered consent flow — the React flow always shows consent.
- HTML routes `/login`, `/authorize` are still served by PHP. They aren't
  hit by the MCP flow anymore (the React SPA at `/authorize` does it), but
  they're kept for any direct browser access / debugging.
- `MCP_SUPPORTED_SCOPES` env is read by the agent but not exposed anywhere
  — drop it or use it for the scope-enforcement gap above.

---

## Setup (new clone)

### 1. RSA key pair for JWT signing

```bash
cd packages/api
mkdir -p storage/oauth
openssl genpkey -algorithm RSA -out storage/oauth/private.key -pkeyopt rsa_keygen_bits:2048
openssl pkey -in storage/oauth/private.key -pubout -out storage/oauth/public.key
```

Both files are gitignored. The agent reads the public key to verify tokens.

### 2. Copy env files

```bash
cp packages/api/.env.example packages/api/.env
cp packages/agent/.env.example packages/agent/.env
# Fill in OPENROUTER_API_KEY, EXA_API_KEY, RESEND_API_KEY in the .env files
```

### 3. Install + migrate

```bash
pnpm install
cd packages/api && composer install && composer migrate
```

### 4. Run all three services

```bash
# Terminal 1 — PHP API (port 8080)
cd packages/api && composer dev

# Terminal 2 — React SPA (port 5173)
cd packages/web && pnpm dev

# Terminal 3 — Agent / MCP (port 3001)
cd packages/agent && pnpm dev
```

### 5. Test the flow end-to-end

1. Open MCPJam Inspector (or any MCP client) at `http://localhost:6274`
2. Set the server URL to `http://localhost:3001/mcp`
3. The client will fetch `/.well-known/oauth-protected-resource` →
   `http://localhost:8080/.well-known/oauth-authorization-server` →
   `http://localhost:5173/authorize?…`
4. You see the React consent screen with the client's logo and the AI Ocean logo
5. Sign in (or sign up) → consent → approve → browser redirects back to the
   client callback with the code
6. Client exchanges the code for a token at `POST /token`
7. Client calls the MCP tools with `Authorization: Bearer <jwt>`

---

## Spec References

### MCP
- [MCP Authorization Spec (current draft)](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [MCP Authorization Spec (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

### OAuth / IETF
- [Protected Resource Metadata (RFC 9728)](https://datatracker.ietf.org/doc/html/rfc9728)
- [Authorization Server Metadata (RFC 8414)](https://datatracker.ietf.org/doc/html/rfc8414)
- [Dynamic Client Registration (RFC 7591)](https://datatracker.ietf.org/doc/html/rfc7591)
- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [Resource Indicators (RFC 8707)](https://www.rfc-editor.org/rfc/rfc8707.html)
- [Issuer Identification (RFC 9207)](https://datatracker.ietf.org/doc/html/rfc9207)

### Libraries
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [jose (JWT)](https://github.com/panva/jose)
- [league/oauth2-server (PHP)](https://oauth2.thephpleague.com/)
