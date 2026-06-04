# @aiocean/agent

The AI Ocean **MCP server** and **AI review agent**. A Hono/Node.js service that
exposes AI tools (search, fetch, decide, …) over the Model Context Protocol and
runs autonomous reviews of submitted tools.

Two services live in this package, on the same Hono app:

- **MCP endpoint** at `/mcp` — the public-facing tool surface for MCP clients
  (Claude, Cursor, MCPJam Inspector, …), protected by OAuth 2.1 (RFC 9728
  Bearer-token challenge + JWT verification with `jose`).
- **AI review agent** at `/api/agent/review` — a fire-and-forget webhook target
  that the PHP backend pings after a tool is submitted. The agent runs a
  `generateText` loop and persists results back through the PHP API.

The PHP backend at `localhost:8080` is the OAuth **Authorization Server** that
issues JWTs. The React SPA at `localhost:5173` renders the **consent UI** for
the browser-based OAuth flow. None of them proxy through the agent — the MCP
client talks to all three directly, as the MCP spec requires.

See [MCP-AUTH-PLAN.md](./MCP-AUTH-PLAN.md) for the full OAuth architecture
diagram, design decisions, known gaps, and setup walkthrough.

---

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- The PHP API running on `http://localhost:8080` (see `../api/`)
- The React SPA running on `http://localhost:5173` (see `../web/`)
- An RSA key pair at `../api/storage/oauth/{private,public}.key` (see setup below)

---

## Setup

```bash
# 1. Install deps (from repo root)
pnpm install

# 2. Copy env
cp .env.example .env
# Fill in OPENROUTER_API_KEY and EXA_API_KEY

# 3. Make sure the PHP API has its RSA key pair generated
mkdir -p ../api/storage/oauth
openssl genpkey -algorithm RSA -out ../api/storage/oauth/private.key -pkeyopt rsa_keygen_bits:2048
openssl pkey -in ../api/storage/oauth/private.key -pubout -out ../api/storage/oauth/public.key

# 4. Run
pnpm dev
```

The agent listens on `http://localhost:3001` by default.

### Env variables

| Var | Default | Purpose |
|---|---|---|
| `AGENT_PORT` | `3001` | HTTP port |
| `AGENT_PUBLIC_URL` | `http://localhost:3001` | Public base URL (used in the resource metadata document and JWT `aud` claim) |
| `PHP_API_BASE_URL` | `http://localhost:8080` | PHP API base for tool-side calls |
| `OPENROUTER_API_KEY` | — | Required. Used by the review agent for `generateText`. |
| `EXA_API_KEY` | — | Optional. Used by `search_web` and `fetch_page` tools. |
| `OAUTH_ISSUER` | `http://localhost:8080` | The Authorization Server URL (the PHP API). Must match the `iss` claim on issued JWTs. |
| `OAUTH_PUBLIC_KEY_PATH` | `<agent>/../api/storage/oauth/public.key` | Path to the RSA public key used to verify incoming JWTs. |
| `MCP_SUPPORTED_SCOPES` | `mcp:user mcp:admin` | Returned in the resource metadata `scopes_supported` field. |
| `MCP_REQUIRED_SCOPES` | `mcp:user` | Wired into the `WWW-Authenticate` challenge. **Not yet enforced** on every tool — see Known Gaps. |

---

## Project Layout

```
src/
├── index.ts              # Hono entry — routes, middleware, server boot
├── auth-middleware.ts    # RFC 9728 Bearer-token challenge + JWT verify (jose)
├── mcp.ts                # createMcpServer() — five MCP tools, streamable HTTP transport
├── php-client.ts         # HTTP client to the PHP API (tools + agent state)
├── review-agent.ts       # generateText loop for the AI review agent
├── types.ts              # Shared types
└── tools/                # Tool implementations (search_web, fetch_page, update_todo, submit_report)
```

---

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/agent/health` | none | Liveness check |
| POST | `/api/agent/review` | none (internal) | Webhook from PHP after a new submission |
| GET | `/.well-known/oauth-protected-resource` | none | RFC 9728 metadata, points clients to the PHP AS |
| * | `/mcp` | Bearer JWT | MCP streamable HTTP transport |

---

## MCP Tools

| Tool | What it does | Scope needed |
|---|---|---|
| `search_ai_ocean_tools` | Search/list active tools in the directory | `mcp:user` |
| `get_ai_ocean_tool` | Get full details for one tool by ID | `mcp:user` |
| `list_ai_ocean_categories` | List all tool categories | `mcp:user` |
| `list_submissions` | List pending submissions | `mcp:admin` |
| `decide_submission` | Approve/reject/revert a submission | `mcp:admin` |

The admin tools are wired up to call the PHP API's `/api/admin/submissions/*`
endpoints, which currently require a PHP **session** with `role = 'admin'`.
Because the agent makes server-to-server calls (no session, no JWT forwarded
to PHP), admin tools **currently 403 in practice**. The intended fix is
documented in [MCP-AUTH-PLAN.md → Known Gaps](./MCP-AUTH-PLAN.md#known-gaps--future-work).

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the agent with `tsx watch` on `index.ts` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | TypeScript build to `dist/` |
| `pnpm start` | Run the compiled `dist/` |

---

## Testing the OAuth flow

1. Make sure all three services are running (PHP on 8080, React on 5173, agent on 3001).
2. Open an MCP client (e.g. [MCPJam Inspector](https://github.com/MCPJam/inspector) at `http://localhost:6274`).
3. Set the server URL to `http://localhost:3001/mcp`.
4. The client will:
   - Hit `/mcp` and get a 401 with `WWW-Authenticate` pointing to
     `http://localhost:3001/.well-known/oauth-protected-resource`
   - Fetch that → get `authorization_servers: ["http://localhost:8080"]`
   - Fetch `http://localhost:8080/.well-known/oauth-authorization-server` →
     `authorization_endpoint: "http://localhost:5173/authorize"`
   - Redirect your browser to `http://localhost:5173/authorize?…`
5. You see the React consent screen with the MCP client's logo and the AI
   Ocean logo side-by-side. Sign in (or sign up). Click Approve.
6. Browser is redirected to the MCP client's callback with the code.
7. Client exchanges the code for a token at `POST /token` on the PHP API.
8. Client retries `POST /mcp` with `Authorization: Bearer <jwt>` — the agent
   verifies the JWT signature + `iss` + `aud` and dispatches the tool.

---

## Related docs

- [MCP-AUTH-PLAN.md](./MCP-AUTH-PLAN.md) — full OAuth architecture, gaps, and setup
- [MCP-NOTES.md](./MCP-NOTES.md) — early design notes on the MCP integration
- [handoff.md](./handoff.md) — AI review agent handoff
