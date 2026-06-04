import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { createAuthMiddleware } from './auth-middleware.js'
import { handleMcpRequest } from './mcp.js'
import { runAgentReview } from './review-agent.js'

const PORT = Number(process.env.AGENT_PORT) || 3001
const PUBLIC_BASE_URL = process.env.AGENT_PUBLIC_URL || `http://localhost:${PORT}`
const RESOURCE_URL = `${PUBLIC_BASE_URL}/mcp`
const RESOURCE_METADATA_URL = `${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource`

const OAUTH_ISSUER = process.env.OAUTH_ISSUER || 'http://localhost:8080'
const OAUTH_PUBLIC_KEY_PATH =
  process.env.OAUTH_PUBLIC_KEY_PATH ||
  new URL('../../api/storage/oauth/public.key', import.meta.url).pathname
const SUPPORTED_SCOPES = (process.env.MCP_SUPPORTED_SCOPES || 'mcp:user mcp:admin').split(/\s+/).filter(Boolean)
const REQUIRED_SCOPES = (process.env.MCP_REQUIRED_SCOPES || 'mcp:user').split(/\s+/).filter(Boolean)

const app = new Hono()

app.get('/api/agent/health', (c) => c.json({ status: 'ok' }))

app.post('/api/agent/review', async (c) => {
  const body = await c.req.json()
  const { submission_id, name, url, short_description, description, pricing_model } = body
  if (!submission_id) return c.json({ error: 'submission_id is required' }, 400)
  runAgentReview({ submission_id, name, url, short_description, description, pricing_model }).catch(console.error)
  return c.json({ status: 'accepted', submission_id }, 202)
})

// RFC 9728 — Protected Resource Metadata
app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({
    resource: RESOURCE_URL,
    authorization_servers: [OAUTH_ISSUER],
    scopes_supported: SUPPORTED_SCOPES,
    bearer_methods_supported: ['header'],
  }),
)

const authMiddleware = createAuthMiddleware({
  issuer: OAUTH_ISSUER,
  audience: RESOURCE_URL,
  resourceMetadataUrl: RESOURCE_METADATA_URL,
  requiredScopes: REQUIRED_SCOPES,
  publicKeyPath: OAUTH_PUBLIC_KEY_PATH,
})

app.use('/mcp', authMiddleware)
app.all('/mcp', (c) => handleMcpRequest(c.req.raw))

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Agent service running on http://localhost:${info.port}`)
  console.log(`  MCP endpoint:       ${RESOURCE_URL}`)
  console.log(`  Resource metadata:  ${RESOURCE_METADATA_URL}`)
  console.log(`  Authorization srv:  ${OAUTH_ISSUER}`)
})
