import { createApiClient } from '../src/client'
import { TodoItem } from '../src/types'

// Helper function to pause execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const stepThoughts = [
  // Step 1: Research the tool's official website and documentation
  [
    { type: 'text' as const, text: 'Handshake initiated with destination address...' },
    { type: 'text' as const, text: 'SSL certificate validated. Domain registered in 2024.' },
    { type: 'reasoning' as const, text: 'Fetching landing page HTML and parsing metadata tags...' },
    { type: 'reasoning' as const, text: "Analyzing document structure. Found title: 'AIOcean OAuth Handshake'." },
    { type: 'text' as const, text: 'Reading documentation sub-routes. Extracting authentication profiles.' }
  ],
  // Step 2: Search for reviews and discussions about the tool
  [
    { type: 'reasoning' as const, text: 'Preparing search queries for community networks...' },
    { type: 'text' as const, text: 'Scanning GitHub repositories for active integrations and forks...' },
    { type: 'reasoning' as const, text: 'Searching StackOverflow and Reddit for mentions and usage flags...' },
    { type: 'text' as const, text: 'Analyzing developer feedback. Feedback indicates positive response times.' },
    { type: 'text' as const, text: 'No critical issue reports or complaints located in public index.' }
  ],
  // Step 3: Verify the tool's description against available information
  [
    { type: 'reasoning' as const, text: 'Comparing declared features with website copy...' },
    { type: 'text' as const, text: "Verifying categorization: 'Developer Tools / MCP Authentication' matches." },
    { type: 'reasoning' as const, text: 'Checking RFC 9728 client profile conformance...' },
    { type: 'reasoning' as const, text: 'Verifying metadata matches actual service capabilities.' },
    { type: 'text' as const, text: 'Feature checklist aligned with provided description.' }
  ],
  // Step 4: Check pricing model accuracy
  [
    { type: 'reasoning' as const, text: 'Scanning landing page for pricing links and paywall structures...' },
    { type: 'text' as const, text: "Retrieving '/pricing' route details..." },
    { type: 'reasoning' as const, text: 'Analyzing subscription tables and pricing tiers...' },
    { type: 'text' as const, text: 'Pricing confirmed: Free and Open Source (Apache 2.0).' },
    { type: 'text' as const, text: 'No hidden fees or payment gateways found.' }
  ],
  // Step 5: Verify any claims made in the description
  [
    { type: 'reasoning' as const, text: 'Running final security integrity checks...' },
    { type: 'text' as const, text: 'Verifying developer public key signatures...' },
    { type: 'reasoning' as const, text: 'Checking package registry files for matches...' },
    { type: 'text' as const, text: 'No vulnerability reports or missing tokens detected.' },
    { type: 'text' as const, text: 'All assertions and security claims validated successfully.' }
  ]
]

async function runMockAgent() {
  console.log('🤖 Initializing Mock AI Ocean Review Agent Run...')

  // 1. Resolve Submission ID dynamically if not provided via CLI
  let submissionId = process.argv[2]
  if (!submissionId) {
    submissionId = 'dae1fca7825f52149cd4b36f891fa79d' // Default to a known valid submission ID from DB
    console.log(`💡 No submission ID provided. Defaulting to: "${submissionId}"`)
  } else {
    console.log(`✅ Using provided submission ID: ${submissionId}`)
  }

  const client = createApiClient()

  // 2. Create the run
  console.log(`🚀 Creating agent run in the database for submission ${submissionId}...`)
  const run = await client.createAgentRun(submissionId)
  const runId = run?.data?.id

  if (!runId) {
    console.error('❌ Failed to create agent run. Please ensure your backend server is running and accessible.')
    process.exit(1)
  }
  console.log(`✅ Created run with ID: ${runId}`)

  // 3. Define the checklist
  const todos: TodoItem[] = [
    { content: "Research the tool's official website and documentation", status: 'pending' },
    { content: 'Search for reviews and discussions about the tool', status: 'pending' },
    { content: 'Verify the tool\'s description against available information', status: 'pending' },
    { content: 'Check pricing model accuracy', status: 'pending' },
    { content: 'Verify any claims made in the description', status: 'pending' },
  ]

  // Initialize checklist in the database
  console.log('📋 Initializing checklist in database...')
  await client.updateAgentTodo(runId, todos)

  const messageStream: any[] = [
    {
      role: 'user',
      content: `Begin reviewing submission ID: ${submissionId}`
    }
  ]

  // 4. Loop through checklist steps to simulate active progress
  for (let stepIdx = 0; stepIdx < todos.length; stepIdx++) {
    console.log(`\n🔹 Starting Step ${stepIdx + 1}: "${todos[stepIdx].content}"`)
    
    // Set active item status to 'in_progress'
    todos[stepIdx].status = 'in_progress'
    await client.updateAgentTodo(runId, todos)

    // Save a mock update_todo tool call so the UI parses the step transition
    messageStream.push({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: `call-${Math.random().toString(36).substr(2, 9)}`,
          toolName: 'update_todo',
          args: { todos },
          input: { todos }
        }
      ]
    })
    await client.saveAgentMessages(runId, messageStream)

    const logs = stepThoughts[stepIdx]

    for (const log of logs) {
      await delay(700) // Simulating delay
      console.log(`  [${log.type.toUpperCase()}] ${log.text}`)

      // Add to running assistant messages list to simulate streaming
      messageStream.push({
        role: 'assistant',
        content: [
          {
            type: log.type,
            text: log.text
          }
        ]
      })
      await client.saveAgentMessages(runId, messageStream)
    }

    // Set item status to 'completed'
    await delay(400)
    todos[stepIdx].status = 'completed'
    await client.updateAgentTodo(runId, todos)
    console.log(`✅ Completed Step ${stepIdx + 1}`)
  }

  // 5. Submit final report
  console.log('\n📝 Generating and submitting final report...')
  const finalReport = `### AI Agent Verification Report
- **Submission ID**: ${submissionId}
- **Status**: VERIFIED
- **Verification Score**: 100/100

#### Executive Summary
The submitted tool has been checked automatically. The destination website is operational, the claimed features align with verified code repositories, and the pricing structure is confirmed as Free.

#### Tasks Checked:
1. **Website & Handshake**: Operational (HTTP 200)
2. **Community Check**: Active discussions, no reported issues.
3. **Core Validation**: Integrates RFC 9728 OAuth Resource flow.
4. **Pricing Validation**: Accurate free pricing model.
5. **Security Check**: Verified public key configurations.

Admin approval is recommended.`

  // Save submit_report tool call
  messageStream.push({
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: `call-${Math.random().toString(36).substr(2, 9)}`,
        toolName: 'submit_report',
        args: { report: finalReport },
        input: { report: finalReport }
      }
    ]
  })
  await client.saveAgentMessages(runId, messageStream)

  await client.saveAgentReport(runId, finalReport)
  await client.updateAgentStatus(runId, 'completed')

  console.log('\n🎉 Mock Agent Run Completed Successfully!')
  console.log(`View the results in your dashboard under Submission ID: ${submissionId}`)
}

runMockAgent().catch((err) => {
  console.error('❌ Error running mock agent:', err)
  process.exit(1)
})
