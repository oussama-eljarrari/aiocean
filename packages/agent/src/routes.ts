import { Hono } from 'hono'
import { config } from './config'
import { createAuthMiddleware, type AppEnv } from './auth-middleware'
import { handleMcpRequest } from './mcp'
import { runAgentReview } from './review'
import { createApiClient } from './client'

export const apiRouter = new Hono<AppEnv>()

// Health Check
apiRouter.get('/agent/health', (c) => c.json({ status: 'ok' }))

// Agent Review Trigger
apiRouter.post('/agent/review', async (c) => {
  const body = await c.req.json()
  const { submission_id, name, url, short_description, description, pricing_model } = body
  if (!submission_id) return c.json({ error: 'submission_id is required' }, 400)

  runAgentReview({ submission_id, name, url, short_description, description, pricing_model }).catch(console.error)
  return c.json({ status: 'accepted', submission_id }, 202)
})

export const mcpRouter = new Hono<AppEnv>()

// RFC 9728 — Protected Resource Metadata
mcpRouter.get('/.well-known/oauth-protected-resource', (c) =>
  c.json({
    resource: config.resourceUrl,
    authorization_servers: [config.oauthIssuer],
    scopes_supported: config.supportedScopes,
    bearer_methods_supported: ['header'],
  })
)

const authMiddleware = createAuthMiddleware({
  issuer: config.oauthIssuer,
  audience: config.resourceUrl,
  resourceMetadataUrl: config.resourceMetadataUrl,
  requiredScopes: config.requiredScopes,
  publicKeyPem: config.oauthPublicKeyPem,
})

// MCP Transport endpoint
mcpRouter.all('/mcp', authMiddleware, (c) => {
  const auth = c.var.auth
  const scopeStr = (auth?.payload?.scope as string) || ''
  const scopes = scopeStr.split(/\s+/).filter(Boolean)
  const userId = (auth?.payload?.sub as string) || ''
  const isAdmin = scopes.includes('mcp:admin')

  const client = createApiClient({ userId, isAdmin })
  return handleMcpRequest(c.req.raw, client)
})
