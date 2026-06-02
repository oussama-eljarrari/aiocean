import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import { z } from 'zod';
import { decideSubmission, getAioceanTool, listAioceanCategories, listAioceanTools, listSubmissions } from './php-client.js';

const server = new McpServer(
  { name: 'aiocean-agent', version: '1.0.0' },
  {
    instructions:
      'Use search_ai_ocean_tools to discover AI tools in the AI Ocean directory, then get_ai_ocean_tool for full details. Use list_submissions to view pending tool submissions, and decide_submission to approve or reject them. Use list_agent_review_tools to inspect the internal review-agent tools.',
  },
);

const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  tagline: z.string().optional(),
  category: z.string().optional(),
  pricing: z.string().optional(),
  platform: z.string().optional(),
  usageCount: z.number().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  voteCount: z.number().optional(),
  primaryUseCase: z.string().optional(),
  url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
});

const agentReviewTools = [
  {
    name: 'search_web',
    source: 'packages/agent/src/tools/web-search.ts',
    description: 'Search the web via Exa. Used by the review agent to find official pages, docs, reviews, and discussions.',
  },
  {
    name: 'fetch_page',
    source: 'packages/agent/src/tools/fetch-page.ts',
    description: 'Fetch text content and highlights for a URL via Exa contents API.',
  },
  {
    name: 'update_todo',
    source: 'packages/agent/src/tools/update-todo.ts',
    description: 'Update the persisted review todo list through callbacks into php-client.ts.',
  },
  {
    name: 'submit_report',
    source: 'packages/agent/src/tools/submit-report.ts',
    description: 'Persist the final markdown review report through callbacks into php-client.ts.',
  },
];

function textAndStructured<T extends Record<string, unknown>>(structuredContent: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

server.registerTool(
  'search_ai_ocean_tools',
  {
    title: 'Search AI Ocean Tools',
    description: 'Search/list active AI tools from the PHP API-backed AI Ocean tools directory. Use this first to discover tool IDs.',
    inputSchema: z.object({
      query: z.string().optional().describe('Optional text search over tool name, tagline, and use case.'),
      category: z.string().optional().describe('Optional exact category filter.'),
      limit: z.number().int().min(1).max(50).default(10).describe('Maximum tools to return.'),
    }),
    outputSchema: z.object({
      tools: z.array(toolSchema),
      total: z.number(),
      categories: z.array(z.string()),
    }),
    annotations: {
      title: 'Search AI Ocean Tools',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ query, category, limit }) => {
    const result = await listAioceanTools({ search: query, category });
    if (!result) {
      return {
        content: [{ type: 'text', text: 'Failed to load tools from the PHP API.' }],
        isError: true,
      };
    }

    const structuredContent = {
      tools: result.tools.slice(0, limit),
      total: result.total,
      categories: result.categories,
    };

    return textAndStructured(structuredContent);
  },
);

server.registerTool(
  'get_ai_ocean_tool',
  {
    title: 'Get AI Ocean Tool',
    description: 'Fetch full details for one AI Ocean directory tool by ID from the PHP API.',
    inputSchema: z.object({
      id: z.string().describe('Tool ID from search_ai_ocean_tools.'),
    }),
    outputSchema: z.object({ tool: toolSchema }),
    annotations: {
      title: 'Get AI Ocean Tool',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ id }) => {
    const tool = await getAioceanTool(id);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Tool not found: ${id}` }],
        isError: true,
      };
    }

    return textAndStructured({ tool });
  },
);

server.registerTool(
  'list_ai_ocean_categories',
  {
    title: 'List AI Ocean Categories',
    description: 'List available AI Ocean tool categories from the PHP API.',
    inputSchema: z.object({}),
    outputSchema: z.object({ categories: z.array(z.string()) }),
    annotations: {
      title: 'List AI Ocean Categories',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const categories = await listAioceanCategories();
    if (!categories) {
      return {
        content: [{ type: 'text', text: 'Failed to load categories from the PHP API.' }],
        isError: true,
      };
    }

    return textAndStructured({ categories });
  },
);

server.registerTool(
  'list_agent_review_tools',
  {
    title: 'List Agent Review Tools',
    description: 'List the internal AI SDK tools loaded by packages/agent/src/review-agent.ts from packages/agent/src/tools.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      tools: z.array(z.object({ name: z.string(), source: z.string(), description: z.string() })),
    }),
    annotations: {
      title: 'List Agent Review Tools',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => textAndStructured({ tools: agentReviewTools }),
);

const submissionSchema = z.object({
  id: z.string(),
  tool_id: z.string(),
  tool_name: z.string(),
  tool_status: z.string(),
  tool_website: z.string().nullable().optional(),
  tool_short_description: z.string().nullable().optional(),
  tool_description: z.string().nullable().optional(),
  tool_pricing: z.string().nullable().optional(),
  tool_category: z.string().nullable().optional(),
  submitted_by: z.string(),
  submitter_name: z.string().nullable().optional(),
  submitter_email: z.string().nullable().optional(),
  status: z.string(),
  admin_notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

server.registerTool(
  'list_submissions',
  {
    title: 'List Submissions',
    description: 'List tool submissions from the PHP API. Optionally filter by status (pending, approved, rejected).',
    inputSchema: z.object({
      status: z.enum(['pending', 'approved', 'rejected']).optional().describe('Filter by submission status'),
    }),
    outputSchema: z.object({
      submissions: z.array(submissionSchema),
    }),
    annotations: {
      title: 'List Submissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ status }) => {
    const submissions = await listSubmissions(status)
    if (!submissions) {
      return {
        content: [{ type: 'text', text: 'Failed to load submissions from the PHP API.' }],
        isError: true,
      }
    }

    return textAndStructured({ submissions })
  },
)

server.registerTool(
  'decide_submission',
  {
    title: 'Decide Submission',
    description: 'Approve, reject, or revert a tool submission to pending. Approved tools become active in the directory.',
    inputSchema: z.object({
      id: z.string().describe('Submission ID from list_submissions.'),
      status: z.enum(['approved', 'rejected', 'pending']).describe('New status for the submission.'),
      admin_notes: z.string().optional().describe('Optional notes explaining the decision.'),
    }),
    outputSchema: z.object({
      submission: submissionSchema,
    }),
    annotations: {
      title: 'Decide Submission',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ id, status, admin_notes }) => {
    const submission = await decideSubmission(id, status, admin_notes)
    if (!submission) {
      return {
        content: [{ type: 'text', text: `Failed to update submission: ${id}. It may not exist or the API returned an error.` }],
        isError: true,
      }
    }

    return textAndStructured({ submission })
  },
)

server.registerResource(
  'agent-review-tools',
  'agent-tools://review-agent',
  {
    title: 'Agent Review Tool Registry',
    description: 'Internal AI SDK tools loaded by the review agent from packages/agent/src/tools.',
    mimeType: 'application/json',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ tools: agentReviewTools }, null, 2),
      },
    ],
  }),
);

const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
await server.connect(transport);

export const app = createMcpHonoApp();
app.all('/', async (c, next) => {
    console.log('Received request with headers:', Object.fromEntries(c.req.raw.headers.entries()));
    await next()
}, c => transport.handleRequest(c.req.raw));
