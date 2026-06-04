import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listSubmissions } from '../../client'

export function registerListSubmissions(server: McpServer, userId: string, isAdmin: boolean) {
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
      const submissions = await listSubmissions(status, userId, isAdmin)
      if (!submissions) {
        return { content: [{ type: 'text', text: 'Failed to load submissions.' }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ submissions }, null, 2) }] }
    },
  )
}
