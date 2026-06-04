import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { decideSubmission } from '../../client'

export function registerDecideSubmission(server: McpServer, userId: string, isAdmin: boolean) {
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
      const submission = await decideSubmission(id, status, admin_notes, userId, isAdmin)
      if (!submission) {
        return {
          content: [{ type: 'text', text: `Failed to update submission ${id}.` }],
          isError: true,
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ submission }, null, 2) }] }
    },
  )
}
