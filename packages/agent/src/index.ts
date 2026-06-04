import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { config } from './config'
import { apiRouter, mcpRouter } from './routes'
import type { AppEnv } from './auth-middleware'

const app = new Hono<AppEnv>()

// Mount sub-routers
app.route('/api', apiRouter)
app.route('/', mcpRouter)

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Agent service running on http://localhost:${info.port}`)
  console.log(`  MCP endpoint:       ${config.resourceUrl}`)
  console.log(`  Resource metadata:  ${config.resourceMetadataUrl}`)
  console.log(`  Authorization srv:  ${config.oauthIssuer}`)
})
