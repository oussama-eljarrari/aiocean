import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../../client'

export function registerSearchTools(server: McpServer, client: ApiClient) {
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
      const result = await client.listTools({ search: query, category })
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
}
