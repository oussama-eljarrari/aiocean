import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  registerSearchTools,
  registerGetTool,
  registerListCategories,
  registerListSubmissions,
  registerDecideSubmission,
  registerSubmitSubmission
} from './tools'
import { ApiClient } from '../client'

export function createMcpServer(client: ApiClient): McpServer {
  const isAdmin = client.getIsAdmin()
  const server = new McpServer(
    { name: 'aiocean-agent', version: '1.0.0' },
    {
      instructions:
        'Use search_ai_ocean_tools to discover AI tools in the AI Ocean directory, then get_ai_ocean_tool for full details.' +
        ' Use submit_submission to submit new AI tools to the review queue.' +
        (isAdmin
          ? ' Use list_submissions to view pending tool submissions, and decide_submission to approve or reject them.'
          : ''),
    },
  )

  // Register public tools
  // TODO : exctact the standalone tools and expose them as a tool registry
  
  registerSearchTools(server, client)
  registerGetTool(server, client)
  registerListCategories(server, client)
  registerSubmitSubmission(server, client)

  // Register admin-only tools
  if (isAdmin) {
    registerListSubmissions(server, client)
    registerDecideSubmission(server, client)
  }

  return server
}

/**
 * Builds a per-request Hono handler that wires a fresh MCP transport into a
 * fresh McpServer (stateless mode). This is the simplest pattern that works
 * with both stateless serverless runtimes and stateful long-running servers.
 */
export async function handleMcpRequest(req: Request, client: ApiClient): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const server = createMcpServer(client)
  await server.connect(transport)
  return transport.handleRequest(req)
}
