import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { runAgentReview } from './review-agent.js'

const app = new Hono()

app.get('/api/agent/health', (c) => {
  return c.json({ status: 'ok' })
})

app.post('/api/agent/review', async (c) => {
  const body = await c.req.json()
  const { submission_id, name, url, short_description, description, pricing_model } = body

  if (!submission_id) {
    return c.json({ error: 'submission_id is required' }, 400)
  }

  runAgentReview({ submission_id, name, url, short_description, description, pricing_model }).catch(console.error)

  return c.json({ status: 'accepted', submission_id }, 202)
})

const port = Number(process.env.AGENT_PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Agent service running on http://localhost:${info.port}`)
})
