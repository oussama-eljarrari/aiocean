import { tool } from 'ai';
import z from 'zod';

export function createSubmitReportTool(
  onSubmit: (report: string, structuredData?: { requires_changes: boolean; feedback: string }) => Promise<void>
) {
  return tool({
    description: 'Submit the final review report. Call this ONLY when you have completed all fact-checking steps and are ready to finalize the review.',
    inputSchema: z.object({
      report: z.string().describe('The comprehensive final markdown report summarizing your findings, verifying claims, pricing, and overall validity.'),
      structured_data: z.object({
        requires_changes: z.boolean().describe('Set to true if there are crucial issues, incorrect pricing, or missing info that the user needs to fix.'),
        feedback: z.string().describe('Feedback/instructions for the user on what needs to be changed, if requires_changes is true. Empty string otherwise.')
      }).optional().describe('Structured flags and feedback for admin review settings.')
    }),
    execute: async ({ report, structured_data }) => {
      await onSubmit(report, structured_data);
      return { success: true, message: 'Report submitted successfully. The review is now complete.' };
    },
  });
}
