# AI Review Agent — Handoff

**Context:** We're building AI Ocean — a directory of AI tools. Users submit tools via a form (name, description, URL, pricing, etc.), and an admin reviews them before publishing. The review process is currently manual and tedious. This agent automates the first pass: fact-checking the submission — verifying the tool exists, the description is accurate, links are real, pricing matches what's on the website, etc. The goal is to make the admin's job easier by providing a structured report so they can approve/reject faster.

## 3 Components

**PHP Backend** (`packages/api/`): owns the database, submissions flow, and the `agent_jobs` table. Modified `SubmissionService::submit()` to fire a fire-and-forget webhook to the agent after creating a submission.

**Agent Service** (`packages/agent/`): a Hono server on port 3000. Receives the webhook, runs a `generateText` + `stopWhen` loop with 3 tools. Each step calls PHP HTTP endpoints to persist messages and todo. On finish, saves a markdown report to the PHP DB.

**Admin UI** (`packages/web/`): not implemented yet — polls `GET /api/admin/agent/runs/{submissionId}` to show status, todo list, and report.

## Main Files

| File | What it does |
|------|-------------|
| `src/index.ts` | Hono entry, `POST /api/agent/review` + `GET /api/agent/health` |
| `src/review-agent.ts` | `generateText` loop with search_web, fetch_page, update_todo tools |
| `src/php-client.ts` | HTTP client calling PHP API for all state writes |
| `../api/src/Features/Agent/Controller.php` | 6 agent-facing endpoints (create run, update status/todo/messages/report) + 1 admin endpoint |
| `../api/src/Features/Agent/Service.php` | Business logic |
| `../api/src/Features/Agent/Repository.php` | SQLite queries |
| `../api/src/Features/Agent/routes.php` | Route registration |
| `../api/src/Features/Submissions/SubmissionService.php` | Modified to fire webhook after submission create |
| `../api/migrations/20260524000000_create_agent_jobs_table.php` | agent_jobs table (status, messages JSON, todo_list JSON, report TEXT) |

## Flow

```
User submits tool → PHP creates tool + submission (pending)
  → PHP fires webhook (file_get_contents, fire-and-forget)
  → Agent: POST /api/agent/review → returns 202 immediately
  → Agent creates agent_job row via PHP API
  → Agent runs generateText loop
    → Each step: saves messages + todo list to PHP via HTTP
    → On finish: saves markdown report, sets status=completed
  → Admin reads from PHP: GET /api/admin/agent/runs/{submissionId}
```

## Design Decisions

- **generateText, not streamText** — no real-time UI streaming needed. Admin polls the DB.
- **All state through PHP HTTP** — agent never touches SQLite. Every write goes through the PHP API (avoids file locking and dual-DB sync).
- **Fire-and-forget webhook** — PHP fires the webhook without waiting for a response. Agent runs in background.
- **Todo as structured JSON array** — persisted via PHP API, injected into the system prompt, updated by the agent via `update_todo` tool.
- **Tools are placeholders** — `search_web` and `fetch_page` return empty data. Need real implementations.
- **Model-agnostic** — uses OpenRouter, swap models by changing `model` string.

## What's Missing / Known Issues

- **Submission details not passed to agent** — webhook only sends `submission_id`. Agent needs tool name, description, URL, etc. Either include in payload or have agent fetch from PHP API before starting the loop.
- **Tools are placeholders** — `search_web` (use `@exalabs/ai-sdk`) and `fetch_page` (use cheerio or browserless) need real implementations.
- **Admin UI** — not wired yet.
- **Todo persistence depends on model calling `update_todo`** — currently saved once initially and once on exit. Intermediate updates rely on the model calling the tool.

## Warning — Everything Is a Draft

**All decisions here are experimental and not final.** The API contracts, abstractions, system boundaries, database schema, and tool interfaces are all subject to change. This needs more design thinking, especially around:

- What data the agent actually needs vs what's passed in the webhook
- Whether the PHP endpoints are the right interface or if some state should live elsewhere
- The `agent_jobs` table schema — columns, data types, JSON blobs vs normalized tables
- The todo list format and how much control the admin should have over it
- How the admin will actually consume the report and interact with the agent flow

Before building the next iteration, use q/a to resolve dependencies and define concrete interfaces between PHP, agent, and UI.
