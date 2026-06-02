# AIOcean — Sprint Tasks

## Architecture Overview

```
packages/
  api/          PHP backend (no framework — custom micro-framework)
    src/
      Core/            Router, Request, Response, BaseController, Middleware
      Features/        One folder per feature (Tools, Users, Reviews, Votes, Collections, Reports, Submissions)
    config/
    migrations/
    database.sqlite

  web/          React 19 + TypeScript + Vite + shadcn/ui
    src/
      shared/
        schema.ts       Cross-cutting domain types (Tool, User, ToolsResponse, GetToolsParams)
        api/            API client + response types per feature
      components/
      hooks/
      pages/
      layouts/
```

**Request flow:** `Route → Controller → Service → Repository`

**Frontend to backend:** `Page → shared/api/{feature}.ts → fetch(/api/...) → PHP route → controller → service → repository → SQLite`

---

## About The API Endpoints

I implemented the API endpoints initially — not because they're complete — but to **enforce architecture and consistency** across the team. Since we're not using a framework (no Laravel, no Symfony), having a clear, uniform pattern for every feature prevents chaos. Every feature follows the same structure: routes.php, Controller, Service, Repository. Every response uses the same helpers. Every auth check goes through `CurrentUser`.

**The endpoints are NOT final.** They're a scaffold. You will likely need to:

- Add missing fields — e.g., the submit tool form sends minimal data but the `tools` table has many columns (`logo_url`, `provider_id`, `category_id`, etc.) that aren't wired yet
- Add validation — currently minimal inline checks, no validation library
- Add query params — pagination, sorting, filtering are mostly absent
- Adjust response shapes — some endpoints return raw data that the UI may need wrapped differently
- The `submit tool` flow in particular needs work: more form fields, preview components, proper validation, and file upload for logos
- `Collections` is mostly done but may need edge-case polish
- Missing endpoints are noted below in the bonus tasks

Treat them as a **consistent starting point**, not a finished product. Keep the same patterns when you modify them.

---

## Frontend Conventions

### Pages
All pages go directly in **`packages/web/src/pages/`** — one file per page, no subdirectories. Name them `<Feature>Page.tsx` (e.g. `HomePage.tsx`, `LoginPage.tsx`, `CollectionsPage.tsx`). Wire each page as a `<Route>` in `App.tsx`.

### Page-specific components
If your page needs components that don't belong in the global `components/` directory, create a feature subdirectory: `components/<feature>/`. For example:

```
components/
  review/
    WriteReviewDialog.tsx
    RatingStars.tsx
  collections/
    CollectionCard.tsx
    SaveToCollectionDialog.tsx
  submit/
    SubmitToolDialog.tsx
    ToolPreview.tsx
```

This keeps things organized without cluttering the global namespace. If a component is reused across multiple features, promote it to `components/` directly.

---

## Shared Types Rule

All cross-cutting domain types live in **`packages/web/src/shared/schema.ts`**:

| Type | Used By |
|------|---------|
| `Tool` | ToolCard, ToolGrid, ToolDetailPage, HomePage, API client |
| `User` | Auth hook, Header, Dashboard, Admin |
| `ToolsResponse` | HomePage, API client |
| `GetToolsParams` | HomePage, API client |

Feature-specific API types live in their own file under `shared/api/` (e.g. `Review` in `shared/api/reviews.ts`). Import from there — never redefine.

---

## Getting Started

```bash
pnpm install
cd packages/api && composer install && cd ../..
pnpm migrate
pnpm db:seed
pnpm dev:api    # terminal 1 — http://localhost:8080
pnpm dev        # terminal 2 — http://localhost:5173
```


## for env

```bash
cd packages/api 
cp .env.example .env
```
and put there your resend api key , (we will decide how u will get it later, passi msg f grp)

Type check:
```bash
pnpm --filter @aiocean/web typecheck
```

Full docs: `docs/GETTING_STARTED.md`, `docs/backend-feature-guide.md`

---

## Task Assignments

### Ali — Auth & Onboarding (5 tasks)

**Task A1 — Login/Signup UI polish**
- Files: `LoginPage.tsx`, `LoginForm.tsx`, `SignupPage.tsx`, `SignupForm.tsx`
- wire up the signup/login forms 

**Task A2 — Password Reset** (this a full feature , u may just do this only la bghtiti)
- Frontend: Forgot password page + Reset password page
- Backend: Add `POST /api/forgot-password` and `POST /api/reset-password` routes + controllers + services
- `EmailService` already has `sendPasswordReset()` — just wire it up
- Reference: `packages/api/src/Core/Features/` pattern (same as Reviews, Votes, etc.)

**Task A3 — Seed Real Data** (u can skip this if u done TASK A2) 
- Edit `packages/api/bin/seed.php`
- Add real tools (not "Tool 1", "Tool 2"), real categories, real providers (OpenAI, Anthropic, Google, Meta, etc.), real models (GPT-4o, Claude 3.5, Gemini 2.0, Llama 3, etc.)
- Make the directory feel populated out of the box
>Ghn3tek w7d script i3mer l models mn dak `models.dev` , gha sber


**Task A5 — User Profile / Settings**
- Frontend: Profile page (`/settings` or `/profile`) with editable name, email, avatar
- Backend: Add `PATCH /api/me` endpoint to update user details

---

### Yasser — Core Features (3 tasks)

**Task Y1 — Voting + Reviews UI**
- File: `ToolDetailPage.tsx`
- Wire upvote toggle via `POST /api/tools/{id}/vote` (uses `toggleVote` from `shared/api/votes.ts`)
- Display vote count, toggle button state (voted/unvoted)
- Wire review list via `GET /api/tools/{id}/reviews` (uses `getReviews` from `shared/api/reviews.ts`)
- Build `WriteReviewDialog` component — star rating (1-5), comment textarea, submit via `upsertReview`
- Show average rating + review count on page

**Task Y2 — Collections + Save Tool**
- File: `CollectionsPage.tsx` + `components/collections/`
- List collections, create/edit/delete (uses `shared/api/collections.ts`)
- **Show the actual tools inside each collection** — not just a count. When a user clicks a collection, display the list of tools saved in it with the same card layout as the directory
- Build `SaveToCollectionDialog` — choose a collection to save a tool into
- **Add a default collection** for each user (e.g. "Saved Tools" or "Favorites") so they can save without creating one first. The dialog auto-selects this default, with an option to pick a different collection
- Support public/private toggle per collection
- Show tool count per collection on the collection card

**Task Y3 — Submit Tool** (haddi xof yanta ya oussam li bgha yakhdha ola khdliwa ga3 lya )
- File: `SubmitToolDialog.tsx` (opened via `?submit=true` query param in `MainLayout.tsx`)
- Form fields: name, short description, URL, full description, pricing model, category selection
- Wire to `POST /api/submissions` (uses `submitTool` from `shared/api/submissions.ts`)
- Validation: required fields, URL format
- Add more fields as needed — the `tools` table has `logo_url`, `provider_id`, `category_id` etc.
- Consider a preview component that shows what the tool card will look like
- Show success toast on submit

---

### Ossama — Admin & Directory (3 tasks)

**Task O1 — Admin Panel**
- File: `AdminPage.tsx`
- Gate behind `user.role === "admin"` check
- Tabs: Pending / Approved / Rejected submissions
- Load submissions via `getAdminSubmissions` from `shared/api/submissions.ts`
- Approve/reject buttons wired to `decideSubmission`
- Show submission metadata (date, submitter, tool name)

**Task O2 — Dashboard** just call it profile page i guess
- File: `ProfilePage.tsx`
- Tabs: Saved Collections list + My Submissions list
- Wire to `getMySubmissions` + `getCollections`
- "Submit a Tool" CTA button
- "Create Collection" link when empty

**Task O3 — Tool Directory UI (HomePage)**
- File: `HomePage.tsx` + `ToolGrid.tsx` + `ToolCard.tsx`
- for auted users add  filter sidebar (as base for more complex future filters) + pricing/platform/rating filters
- Sort selector (featured, most upvoted, highest rated, most popular, name A-Z)
- maybe remove that BIGG landing section for authed users





---

### API Enhancements (bonus — whoever finishes first)

**Task B1 — Endpoint documentation + missing fields**
- Add description/response docs via inline PHPDoc or a docs file
- Audit all endpoints for missing fields the UI needs
- Add `GET /api/admin/reports` for flagged content view

**Task B2 — Model/Provider endpoints**
- Add `GET /api/models`, `GET /api/providers` routes + controllers + services
- The tables already exist in the schema and migrations
- Needed for future model filter on the directory page
