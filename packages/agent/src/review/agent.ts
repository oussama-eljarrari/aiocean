import { generateText, type ModelMessage, stepCountIs, wrapLanguageModel } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createApiClient } from '../client'
import { SubmissionData, TodoItem } from '../types'
import {
  fetchPageTool,
  webSearchTool,
  createUpdateTodoTool,
  createSubmitReportTool,
} from './tools'
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { config } from '../config'

const openrouter = createOpenRouter({
  apiKey: config.openRouterApiKey,
})
const model = wrapLanguageModel(
  {

    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free', {
      extraBody: {
        reasoning: {
          max_tokens: 0,
        },
      }
    }),
    middleware: devToolsMiddleware()
  }
)

function formatTodos(todos: TodoItem[]): string {
  return todos.map((t, i) => `${i + 1}. [${t.status}] ${t.content}`).join('\n')
}

export async function runAgentReview(submission: SubmissionData) {
  console.log(`Starting review for submission ${submission.submission_id}`)

  const client = createApiClient()
  const { submission_id, ...snapshotData } = submission
  const run = await client.createAgentRun(submission_id, snapshotData)
  const runId = run?.data?.id

  if (!runId) {
    console.error(`Failed to create agent run for submission ${submission.submission_id}`)
    return
  }

  const initialTodos: TodoItem[] = [
    { content: 'Research the tool\'s official website and documentation', status: 'pending' },
    { content: 'Search for reviews and discussions about the tool', status: 'pending' },
    { content: 'Verify the tool\'s description against available information', status: 'pending' },
    { content: 'Check pricing model accuracy', status: 'pending' },
    { content: 'Verify any claims made in the description', status: 'pending' },
  ]

  let currentTodos = [...initialTodos]
  await client.updateAgentTodo(runId, currentTodos)

  let report = ''
  let structuredData: Record<string, unknown> | undefined = undefined

  const tools = {
    search_web: webSearchTool,
    fetch_page: fetchPageTool,
    update_todo: createUpdateTodoTool(async (todos: TodoItem[]) => {
      currentTodos = todos
      await client.updateAgentTodo(runId, currentTodos)
    }),
    submit_report: createSubmitReportTool(async (finalReport: string, finalStructuredData?: { requires_changes: boolean; feedback: string }) => {
      report = finalReport
      structuredData = finalStructuredData
      await client.saveAgentReport(runId, report, structuredData)
    })
  }

  const systemPrompt = `You are the AI Review Agent for AI Ocean, an AI tool directory.
Your role is to fact-check tool submissions by searching the web, fetching relevant pages, and verifying the submitter's claims before an admin reviews them.

Process Overview:
1. You will receive the submission details from the user in the first message.
2. Use your tools (search_web, fetch_page) to investigate the tool.
3. You must track your progress using a todo list. Update it dynamically by calling 'update_todo' as you complete tasks.
4. Do not skip steps. Verify the tool exists, check its functionality, and validate pricing if available.
5. When all steps are complete, call 'submit_report' to submit your final markdown evaluation.

Structured Review Requirements:
When calling the 'submit_report' tool:
- If you find major discrepancies, broken/invalid links, mismatching pricing models, or incomplete information that requires the user to correct the form, set 'structured_data' parameter with 'requires_changes: true' and provide detailed 'feedback' explaining exactly what the user needs to fix.
- Otherwise, if the submission appears valid or has only minor issues that do not require form updates, set 'requires_changes: false' and an empty 'feedback' string.

Initial Todo List:
${formatTodos(initialTodos)}

before u start working and before each step , u need to update the todo list by calling the update_todo tool , this crucially helps the admin understand what are u doing
`

  const history = await client.getAgentHistory(submission.submission_id)
  const previousRuns = (history ?? []).filter((run: any) => run.id !== runId && run.status === 'completed')

  let previousContextText = ""
  if (previousRuns.length > 0) {
    previousContextText = `\n\n### Re-Review / Revision Context (Round ${previousRuns.length + 1})
This is a re-review. The user has updated the submission to address issues found in previous rounds.

Here are the reports of the previous verification runs for context:
`
    previousRuns.forEach((run: any, idx: number) => {
      previousContextText += `
---
#### Previous Run #${idx + 1}
- **Report**: 
${run.report || 'No report submitted'}
`
      if (run.tool_snapshot) {
        previousContextText += `- **Analyzed Snapshot Fields**: ${JSON.stringify(run.tool_snapshot)}\n`
      }
    })
    previousContextText += `---

Please carefully review the updated details and verify if the issues mentioned in previous runs have been resolved. Focus on checking the website and other resources to verify the updates.

### CRITICAL RESOURCE OPTIMIZATION:
Compare the current Submission Details against the 'Analyzed Snapshot Fields' of the most recent previous run (Run #${previousRuns.length}).
If all submitted values (Name, URL, Short Description, Full Description, Pricing Model) are identical to the previous snapshot, it means the user resubmitted the form without making any corrections or updates.
In this case, to avoid wasting resources (tokens, search queries, etc.), you MUST:
1. Skip all web searches and page fetches.
2. Immediately call the 'update_todo' tool to mark unresolved tasks as cancelled.
3. Immediately call the 'submit_report' tool with 'structured_data' set to 'requires_changes: true' and 'feedback: "No updates were provided to address the requested changes. Please correct the fields before resubmitting."'`
  }

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: `Please review the following tool submission.

### Submission Details
- **ID**: ${submission.submission_id}
- **Name**: ${submission.name}
- **URL**: ${submission.url || 'Not provided'}
- **Short Description**: ${submission.short_description}
- **Full Description**: ${submission.description || 'Not provided'}
- **Pricing Model**: ${submission.pricing_model || 'Not provided'}${previousContextText}

Begin by researching the tool. Update the todo list as you progress, and call 'submit_report' when you are finished.
call the submit_report tool only when all the steps are completed and done
`,
    },
  ]

  let step = 0
  const maxSteps = 15

  while (step < maxSteps) {
    const result = await generateText({
      model,
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(1),
      onStepFinish: async () => {
        // Save messages at the end of every step
        await client.saveAgentMessages(runId, messages)
      },
    })

    messages.push(...result.response.messages)

    // Check if the report was generated via the submit_report tool during this step
    if (report) {
      break
    }

    // Fallback: If the model refuses to use the tool and just outputs text,
    // we can capture that as the report (though discouraged by the prompt).
    // Let's only do this if it didn't call any tools at all and just talked.
    if (result.text && result.toolCalls.length === 0 && step > 0) {
      report = result.text
      await client.saveAgentReport(runId, report)
      break
    }

    step++
  }

  // Final persistence saves
  await client.saveAgentMessages(runId, messages)
  await client.updateAgentTodo(runId, currentTodos)

  if (report) {
    await client.updateAgentStatus(runId, 'completed')
    console.log(`Review completed for submission ${submission.submission_id}`)
  } else {
    await client.updateAgentStatus(runId, 'failed')
    console.error(`Review failed for submission ${submission.submission_id}. Reached max steps without final report.`)
  }
}
