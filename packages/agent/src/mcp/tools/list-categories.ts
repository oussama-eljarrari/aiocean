import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../../client'

export function registerListCategories(server: McpServer, client: ApiClient) {
  server.registerTool(
    'list_ai_ocean_categories',
    {
      title: 'List AI Ocean Categories',
      description: 'List available AI Ocean tool categories.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const categories = await client.listCategories()
      if (!categories) {
        return { content: [{ type: 'text', text: 'Failed to load categories.' }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ categories }, null, 2) }] }
    },
  )
}
