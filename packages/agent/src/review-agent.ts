import { generateText, type ModelMessage, stepCountIs, wrapLanguageModel } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import {
  createAgentRun,
  updateAgentStatus,
  updateAgentTodo,
  saveAgentMessages,
  saveAgentReport,
} from './php-client.js'
import { SubmissionData, TodoItem } from './types.js'
import { fetchPageTool } from './tools/fetch-page.js'
import { webSearchTool } from './tools/web-search.js'
import { createUpdateTodoTool } from './tools/update-todo.js'
import { createSubmitReportTool } from './tools/submit-report.js'
import { devToolsMiddleware } from "@ai-sdk/devtools";
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})
const model = wrapLanguageModel(
  {
    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'),
    middleware: devToolsMiddleware()
  }
)
// const model = openrouter('nvidia/nemotron-3-super-120b-a12b:free')

function formatTodos(todos: TodoItem[]): string {
  return todos.map((t, i) => `${i + 1}. [${t.status}] ${t.content}`).join('\n')
}

export async function runAgentReview(submission: SubmissionData) {
  console.log(`Starting review for submission ${submission.submission_id}`)

  const run = await createAgentRun(submission.submission_id)
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
  await updateAgentTodo(runId, currentTodos)

  let report = ''

  const tools = {
    search_web: webSearchTool,
    fetch_page: fetchPageTool,
    update_todo: createUpdateTodoTool(async (todos) => {
      currentTodos = todos
      await updateAgentTodo(runId, currentTodos)
    }),
    submit_report: createSubmitReportTool(async (finalReport) => {
      report = finalReport
      await saveAgentReport(runId, report)
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

Initial Todo List:
${formatTodos(initialTodos)}

before u start working and before each step , u need to update the todo list by calling the update_todo tool , this crucially helps the admin understand what are u doing
`

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
- **Pricing Model**: ${submission.pricing_model || 'Not provided'}

Begin by researching the tool. Update the todo list as you progress, and call 'submit_report' when you are finished.`,
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
        await saveAgentMessages(runId, messages)
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
      await saveAgentReport(runId, report)
      break
    }

    step++
  }

  // Final persistence saves
  await saveAgentMessages(runId, messages)
  await updateAgentTodo(runId, currentTodos)

  if (report) {
    await updateAgentStatus(runId, 'completed')
    console.log(`Review completed for submission ${submission.submission_id}`)
  } else {
    await updateAgentStatus(runId, 'failed')
    console.error(`Review failed for submission ${submission.submission_id}. Reached max steps without final report.`)
  }
}
