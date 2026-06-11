import { tool } from 'ai';
import z from 'zod';

export function createSubmitReportTool(onSubmit: (report: string) => Promise<void>) {
  return tool({
    description: 'Submit the final review report. Call this ONLY when you have completed all fact-checking steps and are ready to finalize the review.',
    inputSchema: z.object({
      report: z.string().describe('The comprehensive final markdown report summarizing your findings, verifying claims, pricing, and overall validity.'),
    }),
    execute: async ({ report }) => {
      await onSubmit(report);
      return { success: true, message: 'Report submitted successfully. The review is now complete.' };
    },
  });
}
