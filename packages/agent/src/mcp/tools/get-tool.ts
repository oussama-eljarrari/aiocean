import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getAioceanTool } from '../../client'

export function registerGetTool(server: McpServer) {
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
}
