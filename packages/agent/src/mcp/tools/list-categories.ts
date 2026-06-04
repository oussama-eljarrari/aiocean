import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listAioceanCategories } from '../../client'

export function registerListCategories(server: McpServer) {
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
}
