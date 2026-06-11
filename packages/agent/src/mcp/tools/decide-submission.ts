import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../../client'

export function registerDecideSubmission(server: McpServer, client: ApiClient) {
  server.registerTool(
    'decide_submission',
    {
      title: 'Decide Submission',
      description: 'Approve, reject, or revert tool submissions to pending. Approved tools become active in the directory.',
      inputSchema: {
        ids: z.array(z.string()).describe('An array of submission IDs from list_submissions.'),
        status: z.enum(['approved', 'rejected', 'pending']).describe('New status for the submissions.'),
        admin_notes: z.string().optional().describe('Optional notes explaining the decision.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ ids, status, admin_notes }) => {
      if (ids.length === 0) {
        return {
          content: [{ type: 'text', text: 'No submission IDs provided.' }],
          isError: true,
        }
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const submission = await client.decideSubmission(id, status, admin_notes)
            if (!submission) {
              return { id, success: false, error: 'Failed to update submission' }
            }
            return { id, success: true, submission }
          } catch (err: any) {
            return { id, success: false, error: err?.message || 'Unknown error' }
          }
        })
      )

      const succeeded = results.filter((r) => r.success).map((r) => r.submission)
      const failed = results.filter((r) => !r.success).map((r) => ({ id: r.id, error: r.error }))

      const responseObj = { succeeded, failed }
      const isError = succeeded.length === 0

      return {
        content: [{ type: 'text', text: JSON.stringify(responseObj, null, 2) }],
        isError,
      }
    },
  )
}

