import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../../client'

export function registerSubmitSubmission(server: McpServer, client: ApiClient) {
  server.registerTool(
    'submit_submission',
    {
      title: 'Submit Submission',
      description: 'Submit one or more AI tools to the review queue (submissions queue).',
      inputSchema: {
        submissions: z.array(
          z.object({
            name: z.string().describe('The name of the tool.'),
            short_description: z.string().describe('A brief, one-sentence description of what the tool does.'),
            url: z.string().optional().describe('The website URL of the tool.'),
            description: z.string().optional().describe('A detailed description of the tool.'),
            pricing_model: z.string().optional().describe('The pricing model (e.g. Free, Freemium, Paid).'),
            category_id: z.string().optional().describe('The category ID for the tool.'),
          })
        ).describe('An array of submissions to submit.'),
      },
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ submissions }) => {
      if (submissions.length === 0) {
        return {
          content: [{ type: 'text', text: 'No submissions provided.' }],
          isError: true,
        }
      }

      const results = await Promise.all(
        submissions.map(async (sub) => {
          try {
            const result = await client.submitTool({
              name: sub.name,
              short_description: sub.short_description,
              url: sub.url || null,
              description: sub.description || null,
              pricing_model: sub.pricing_model || null,
              category_id: sub.category_id || null,
            })
            if (!result) {
              return { name: sub.name, success: false, error: 'Failed to create submission.' }
            }
            return { name: sub.name, success: true, submission: result }
          } catch (err: any) {
            return { name: sub.name, success: false, error: err?.message || 'Unknown error' }
          }
        })
      )

      const succeeded = results.filter((r) => r.success).map((r) => r.submission)
      const failed = results.filter((r) => !r.success).map((r) => ({ name: r.name, error: r.error }))

      const responseObj = { succeeded, failed }
      const isError = succeeded.length === 0

      return {
        content: [{ type: 'text', text: JSON.stringify(responseObj, null, 2) }],
        isError,
      }
    },
  )
}
