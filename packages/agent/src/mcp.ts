import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import {
  decideSubmission,
  getAioceanTool,
  listAioceanCategories,
  listAioceanTools,
  listSubmissions,
} from './php-client.js'

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'aiocean-agent', version: '1.0.0' },
    {
      instructions:
        'Use search_ai_ocean_tools to discover AI tools in the AI Ocean directory, then get_ai_ocean_tool for full details. Use list_submissions to view pending tool submissions, and decide_submission to approve or reject them.',
    },
  )

  server.registerTool(
    'search_ai_ocean_tools',
    {
      title: 'Search AI Ocean Tools',
      description: 'Search/list active AI tools from the AI Ocean directory. Use this first to discover tool IDs.',
      inputSchema: {
        query: z.string().optional().describe('Optional text search over tool name, tagline, and use case.'),
        category: z.string().optional().describe('Optional exact category filter.'),
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum tools to return.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, category, limit }) => {
      const result = await listAioceanTools({ search: query, category })
      if (!result) {
        return { content: [{ type: 'text', text: 'Failed to load tools from the API.' }], isError: true }
      }
      const payload = {
        tools: result.tools.slice(0, limit ?? 10),
        total: result.total,
        categories: result.categories,
      }
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] }
    },
  )

  server.registerTool(
    'get_ai_ocean_tool',
    {
      title: 'Get AI Ocean Tool',
      description: 'Fetch full details for one AI Ocean directory tool by ID.',
      inputSchema: { id: z.string().describe('Tool ID from search_ai_ocean_tools.') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const tool = await getAioceanTool(id)
      if (!tool) {
        return { content: [{ type: 'text', text: `Tool not found: ${id}` }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ tool }, null, 2) }] }
    },
  )

  server.registerTool(
    'list_ai_ocean_categories',
    {
      title: 'List AI Ocean Categories',
      description: 'List available AI Ocean tool categories.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const categories = await listAioceanCategories()
      if (!categories) {
        return { content: [{ type: 'text', text: 'Failed to load categories.' }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ categories }, null, 2) }] }
    },
  )

  server.registerTool(
    'list_submissions',
    {
      title: 'List Submissions',
      description: 'List tool submissions. Optionally filter by status (pending, approved, rejected).',
      inputSchema: {
        status: z.enum(['pending', 'approved', 'rejected']).optional().describe('Filter by submission status'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ status }) => {
      const submissions = await listSubmissions(status)
      if (!submissions) {
        return { content: [{ type: 'text', text: 'Failed to load submissions.' }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ submissions }, null, 2) }] }
    },
  )

  server.registerTool(
    'decide_submission',
    {
      title: 'Decide Submission',
      description: 'Approve, reject, or revert a tool submission to pending. Approved tools become active in the directory.',
      inputSchema: {
        id: z.string().describe('Submission ID from list_submissions.'),
        status: z.enum(['approved', 'rejected', 'pending']).describe('New status for the submission.'),
        admin_notes: z.string().optional().describe('Optional notes explaining the decision.'),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ id, status, admin_notes }) => {
      const submission = await decideSubmission(id, status, admin_notes)
      if (!submission) {
        return {
          content: [{ type: 'text', text: `Failed to update submission ${id}.` }],
          isError: true,
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ submission }, null, 2) }] }
    },
  )

  return server
}

/**
 * Builds a per-request Hono handler that wires a fresh MCP transport into a
 * fresh McpServer (stateless mode). This is the simplest pattern that works
 * with both stateless serverless runtimes and stateful long-running servers.
 */
export async function handleMcpRequest(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const server = createMcpServer()
  await server.connect(transport)
  return transport.handleRequest(req)
}
