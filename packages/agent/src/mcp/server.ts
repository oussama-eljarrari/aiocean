import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  registerSearchTools,
  registerGetTool,
  registerListCategories,
  registerListSubmissions,
  registerDecideSubmission
} from './tools'

export function createMcpServer(scopes: string[], userId: string): McpServer {
  const isAdmin = scopes.includes('mcp:admin')
  const server = new McpServer(
    { name: 'aiocean-agent', version: '1.0.0' },
    {
      instructions:
        'Use search_ai_ocean_tools to discover AI tools in the AI Ocean directory, then get_ai_ocean_tool for full details.' +
        (isAdmin
          ? ' Use list_submissions to view pending tool submissions, and decide_submission to approve or reject them.'
          : ''),
    },
  )

  // Register public tools
  // TODO : exctact the standalone tools and expose them as a tool registry
  
  registerSearchTools(server)
  registerGetTool(server)
  registerListCategories(server)

  // Register admin-only tools
  if (isAdmin) {
    registerListSubmissions(server, userId, isAdmin)
    registerDecideSubmission(server, userId, isAdmin)
  }

  return server
}

/**
 * Builds a per-request Hono handler that wires a fresh MCP transport into a
 * fresh McpServer (stateless mode). This is the simplest pattern that works
 * with both stateless serverless runtimes and stateful long-running servers.
 */
export async function handleMcpRequest(req: Request, scopes: string[], userId: string): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const server = createMcpServer(scopes, userId)
  await server.connect(transport)
  return transport.handleRequest(req)
}
