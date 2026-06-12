import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircle,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  X,
  GitPullRequest,
  User,
  ChevronDown,
  ChevronUp,
  Globe,
  CornerDownRight,
  Search,
} from "lucide-react"
import { Link } from "react-router-dom"
import appLogo from "@/assets/ai-ocean.png"
import { useAuth } from "@/hooks/use-auth"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AgentJob, AgentTodoItem } from "@/shared/api/agent"
import type { Submission } from "@/shared/api/submissions"
import {
  agentStatusLabels,
  formatDate,
  Notice,
  statusClass,
  submissionStatusLabels,
  submitterLabel,
} from "./review-ui"

interface AgentReviewCardProps {
  agentError: string | null
  agentJob: AgentJob | null
  agentRuns: AgentJob[]
  adminNotes: string
  isAgentLoading: boolean
  isDeciding: "approved" | "rejected" | "changes_requested" | null
  onApprove: () => void
  onRefreshAgent: () => void
  onReject: () => void
  onChangesRequested: () => void
  onUpdateNotes: (value: string) => void
  submission: Submission
}

export function AgentReviewCard({
  agentError,
  agentJob,
  agentRuns,
  adminNotes,
  isAgentLoading,
  isDeciding,
  onApprove,
  onRefreshAgent,
  onReject,
  onChangesRequested,
  onUpdateNotes,
  submission,
}: AgentReviewCardProps) {
  const { user: currentUser } = useAuth()
  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({})

  const escapeMarkdownTable = (val?: string | null) => {
    if (!val?.trim()) return "_Not provided_"
    return val.replace(/\|/g, "\\|").replace(/\n/g, "<br/>")
  }

  const initialDetailsMarkdown = `
| Field | Submitted Value |
| :--- | :--- |
| **Tool Name** | ${escapeMarkdownTable(submission.tool_name)} |
| **Short Description** | ${escapeMarkdownTable(submission.tool_short_description)} |
| **Description** | ${escapeMarkdownTable(submission.tool_description)} |
| **Website** | ${submission.tool_website ? `[${submission.tool_website}](${submission.tool_website})` : "_Not provided_"} |
| **Pricing** | ${escapeMarkdownTable(submission.tool_pricing)} |
| **Category** | ${escapeMarkdownTable(submission.tool_category)} |
`.trim()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{submission.tool_name}</h2>
            <Badge className={statusClass(submission.status)} variant="outline">
              {submissionStatusLabels[submission.status]}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-4" />
              {submitterLabel(submission)}
            </span>
            {submission.submitter_email ? (
              <span className="flex items-center gap-1.5">
                {submission.submitter_email}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-4" />
              {formatDate(submission.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agentJob ? (
            <Badge className={statusClass(agentJob.status)} variant="secondary">
              Latest Agent {agentStatusLabels[agentJob.status]}
            </Badge>
          ) : null}
          <Link
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            to={`/tools/${submission.tool_id}`}
          >
            <ExternalLink className="size-4" />
            View Tool
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 flex flex-col gap-6 bg-card rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <GitPullRequest className="size-5 text-sky-500" />
              Submission Timeline
            </h3>
            <Button variant="outline" size="sm" onClick={onRefreshAgent} disabled={isAgentLoading} className="h-8 shadow-sm">
              <RefreshCw className={cn("size-3.5 mr-2", isAgentLoading && "animate-spin")} />
              Sync
            </Button>
          </div>

          <div className="flow-root pl-2 mt-4">
            {agentError && (
              <div className="mb-6 max-w-4xl">
                <Notice
                  icon={<AlertCircle className="size-4" />}
                  title="Agent error occurred"
                  body={agentError}
                />
              </div>
            )}
            <ul className="-mb-8">
              {/* 1. Initial Submission Event */}
              <li>
                <TimelineItem
                  icon={
                    submission.submitter_pfp_url ? (
                      <img src={submission.submitter_pfp_url} alt={submitterLabel(submission)} className="h-full w-full object-cover" />
                    ) : (
                      <User className="size-4 text-sky-600" />
                    )
                  }
                  iconBg={submission.submitter_pfp_url ? "bg-background border-border overflow-hidden" : "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60"}
                  title={
                    <span>
                      <span className="font-semibold text-foreground">{submitterLabel(submission)}</span>
                      {" submitted the tool "}
                      <span className="font-semibold text-foreground">{submission.tool_name}</span>
                    </span>
                  }
                  timestamp={submission.created_at}
                >
                  <div className="mt-3 max-w-4xl">
                    <MarkdownReport report={initialDetailsMarkdown} />
                  </div>
                </TimelineItem>
              </li>

              {/* 2. Agent Runs Events */}
              {agentRuns.map((run, index) => {
                const isRunLast = index === agentRuns.length - 1
                const snapshotMarkdown = run.tool_snapshot ? `
| Field | Value Analyzed in this Round |
| :--- | :--- |
| **Name** | ${escapeMarkdownTable((run.tool_snapshot as any).name)} |
| **Short Description** | ${escapeMarkdownTable((run.tool_snapshot as any).short_description)} |
| **Website** | ${(run.tool_snapshot as any).url ? `[${(run.tool_snapshot as any).url}](${(run.tool_snapshot as any).url})` : "_Not provided_"} |
| **Description** | ${escapeMarkdownTable((run.tool_snapshot as any).description)} |
| **Pricing Model** | ${escapeMarkdownTable((run.tool_snapshot as any).pricing_model)} |
`.trim() : ""
                
                return (
                  <div key={run.id}>
                    <li>
                      <TimelineItem
                        icon={<img src={appLogo} alt="AI Ocean" className="h-full w-full object-cover" />}
                        iconBg="bg-background border-border overflow-hidden"
                        title={
                          <span>
                            <span className="font-semibold text-foreground">AI Ocean Review Agent</span>
                            {` executed verification (Round #${index + 1})`}
                          </span>
                        }
                        timestamp={run.created_at}
                      >
                        <div className="space-y-4 max-w-4xl mt-3">
                          {/* Snapshot details (if available) */}
                          {run.tool_snapshot && (
                            <details className="group border rounded-lg bg-background/50 overflow-hidden">
                              <summary className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/30">
                                <span>View fields analyzed in this round</span>
                                <ChevronDown className="size-3.5 group-open:hidden" />
                                <ChevronUp className="size-3.5 hidden group-open:block" />
                              </summary>
                              <div className="border-t p-3 bg-card">
                                <MarkdownReport report={snapshotMarkdown} />
                              </div>
                            </details>
                          )}

                          {/* Stepper progress */}
                          <ReviewStepper todos={run.todo_list ?? []} />

                          {/* Conversation Flow */}
                          {run.messages && run.messages.length > 0 && (
                            <AgentConversationFlow
                              messages={run.messages}
                              isOpen={!!expandedRuns[run.id]}
                              onToggle={() => {
                                setExpandedRuns(prev => ({
                                  ...prev,
                                  [run.id]: !prev[run.id]
                                }))
                              }}
                              submitterPfpUrl={submission.submitter_pfp_url}
                            />
                          )}

                          {/* Report */}
                          {run.status === "completed" && run.report ? (
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                              <div className="flex items-center gap-2 border-b pb-2 mb-3">
                                <FileText className="size-4 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground">AI Verification Report</span>
                              </div>
                              <MarkdownReport report={run.report} />
                            </div>
                          ) : run.status === "failed" ? (
                            <div className="rounded-lg border border-red-100 bg-red-50/50 p-4 text-red-800 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-300">
                              <p className="text-sm font-semibold">Agent execution failed</p>
                              <p className="mt-1 text-xs">The agent was unable to complete the verification checklist.</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin text-primary" />
                              Verification in progress...
                            </div>
                          )}
                        </div>
                      </TimelineItem>
                    </li>

                    {/* If a newer run exists, it implies changes were requested and user resubmitted */}
                    {!isRunLast && (
                      <li>
                        <TimelineItem
                          icon={
                            currentUser?.pfp_url ? (
                              <img src={currentUser.pfp_url} alt="Admin" className="h-full w-full object-cover" />
                            ) : (
                              <AlertCircle className="size-4 text-amber-600" />
                            )
                          }
                          iconBg={currentUser?.pfp_url ? "bg-background border-border overflow-hidden" : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60"}
                          title={
                            <span>
                              <span className="font-semibold text-foreground">Admin</span>
                              {" requested changes"}
                            </span>
                          }
                          timestamp={run.completed_at || run.updated_at}
                        >
                          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 max-w-4xl mt-2">
                            <p className="text-sm font-semibold mb-1">Feedback / Request Details:</p>
                            <p className="text-sm">Changes were requested and the user has resubmitted to start the next round.</p>
                          </div>
                        </TimelineItem>
                      </li>
                    )}
                  </div>
                )
              })}

              {/* 3. Final Decision Event */}
              {submission.status !== "pending" && (
                <li>
                  <TimelineItem
                    icon={
                      currentUser?.pfp_url ? (
                        <img src={currentUser.pfp_url} alt="Admin" className="h-full w-full object-cover" />
                      ) : submission.status === "approved" ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : submission.status === "rejected" ? (
                        <X className="size-4 text-rose-600" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-600" />
                      )
                    }
                    iconBg={
                      currentUser?.pfp_url 
                        ? "bg-background border-border overflow-hidden" 
                        : submission.status === "approved"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60"
                        : submission.status === "rejected"
                        ? "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60"
                    }
                    title={
                      <span>
                        <span className="font-semibold text-foreground">Admin</span>
                        {submission.status === "approved"
                          ? " approved this submission"
                          : submission.status === "rejected"
                          ? " rejected this submission"
                          : " requested changes"}
                      </span>
                    }
                    timestamp={submission.updated_at}
                    isLast={true}
                  >
                    {submission.admin_notes && (
                      <div
                        className={cn(
                          "rounded-lg border p-4 shadow-sm max-w-4xl mt-3",
                          submission.status === "approved" && "border-emerald-100 bg-emerald-50/30 text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-300",
                          submission.status === "rejected" && "border-rose-100 bg-rose-50/30 text-rose-800 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-300",
                          submission.status === "changes_requested" && "border-amber-100 bg-amber-50/30 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-300"
                        )}
                      >
                        <p className="text-sm font-semibold mb-1">Notes / Feedback:</p>
                        <p className="text-sm">{submission.admin_notes}</p>
                      </div>
                    )}
                  </TimelineItem>
                </li>
              )}
            </ul>
          </div>
        </div>

        <DecisionSidebar
          adminNotes={adminNotes}
          isDeciding={isDeciding}
          onApprove={onApprove}
          onReject={onReject}
          onChangesRequested={onChangesRequested}
          onUpdateNotes={onUpdateNotes}
          disableChangesRequest={submission.revision_count >= submission.max_revisions}
        />
      </div>
    </div>
  )
}

function TimelineItem({
  icon,
  iconBg,
  title,
  timestamp,
  children,
  isLast = false,
}: {
  icon: React.ReactNode
  iconBg: string
  title: React.ReactNode
  timestamp?: string
  children?: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className="relative flex gap-x-3 pb-8">
      {/* Line connector */}
      {!isLast && (
        <span
          className="absolute left-[13px] top-[26px] -ml-px h-[calc(100%-26px)] w-0.5 bg-muted"
          aria-hidden="true"
        />
      )}

      {/* Circle Icon */}
      <div className={cn("relative flex size-7 shrink-0 items-center justify-center rounded-full border text-white shadow-sm", iconBg)}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex justify-between gap-x-4">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {timestamp && (
            <time className="shrink-0 text-xs text-muted-foreground mt-0.5">
              {formatDate(timestamp)}
            </time>
          )}
        </div>
        {children && <div className="mt-1 text-sm text-foreground">{children}</div>}
      </div>
    </div>
  )
}

function DecisionSidebar({
  adminNotes,
  isDeciding,
  onApprove,
  onReject,
  onChangesRequested,
  onUpdateNotes,
  disableChangesRequest,
}: {
  adminNotes: string
  isDeciding: "approved" | "rejected" | "changes_requested" | null
  onApprove: () => void
  onReject: () => void
  onChangesRequested: () => void
  onUpdateNotes: (value: string) => void
  disableChangesRequest: boolean
}) {
  return (
    <div className="sticky top-1/10 flex flex-col gap-4 rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 bg-muted/40">
        <h3 className="font-semibold text-foreground">Review Decision</h3>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
          <Textarea
            className="min-h-[120px] resize-y text-sm"
            onChange={(event) => onUpdateNotes(event.target.value)}
            placeholder="Add feedback or notes for the submitter..."
            value={adminNotes}
          />
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onApprove}
            disabled={isDeciding !== null}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm"
          >
            {isDeciding === "approved" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Approve Submission
          </Button>
          <Button
            onClick={onChangesRequested}
            disabled={isDeciding !== null || disableChangesRequest}
            className={cn(
              "w-full text-white font-medium text-sm transition-colors",
              disableChangesRequest 
                ? "bg-muted text-muted-foreground border-border cursor-not-allowed hover:bg-muted"
                : "bg-amber-500 hover:bg-amber-600"
            )}
          >
            {isDeciding === "changes_requested" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <AlertCircle className="mr-2 size-4" />}
            {disableChangesRequest ? "Changes Request Limit Reached" : "Request Changes"}
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isDeciding !== null}
            className="w-full font-medium text-sm"
          >
            {isDeciding === "rejected" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <X className="mr-2 size-4" />}
            Reject Submission
          </Button>
          
          {disableChangesRequest && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <p className="font-semibold flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                Maximum Revisions Reached
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground leading-normal">
                The submitter has resubmitted {submission.max_revisions} times. You must now make a final decision to approve or reject.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewStepper({ todos }: { todos: AgentTodoItem[] }) {
  if (todos.length === 0) {
    return (
      <Notice
        icon={<Clock3 className="size-4" />}
        title="Checklist pending"
        body="The agent creates the checklist after the run starts."
      />
    )
  }

  const completedTodos = todos.filter((todo) => todo.status === "completed").length
  const progress = Math.round((completedTodos / todos.length) * 100)

  return (
    <div className="rounded-lg border bg-background/50">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold">Verification checklist</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {completedTodos} of {todos.length} checks complete
            </p>
          </div>
          <span className="text-lg font-semibold">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {todos.map((todo, index) => (
          <div key={`${todo.content}-${index}`} className="flex items-start gap-2.5">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]", statusClass(todo.status))}>
              {stepIcon(todo.status, index + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-5 text-foreground/90">{todo.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function stepIcon(status: AgentTodoItem["status"], fallback: number) {
  if (status === "completed") return <Check className="size-3" />
  if (status === "in_progress") return <Loader2 className="size-3 animate-spin" />
  if (status === "cancelled") return <X className="size-3" />
  return <span>{fallback}</span>
}

function MarkdownReport({ report }: { report: string }) {
  return (
    <div className="max-w-none text-xs leading-5 text-foreground/90 space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 text-sm font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-1.5 mt-3 text-xs font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-xs font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-2 text-foreground/80 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ children, href }) => (
            <a className="font-medium text-primary underline underline-offset-2 hover:text-primary/80" href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{children}</code>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border">
              <table className="w-full text-left border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/40 border-b">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/5 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold text-muted-foreground">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-foreground/90 break-all">{children}</td>,
        }}
      >
        {report}
      </ReactMarkdown>
    </div>
  )
}

function AgentConversationFlow({
  messages,
  isOpen,
  onToggle,
  submitterPfpUrl,
}: {
  messages: any[]
  isOpen: boolean
  onToggle: () => void
  submitterPfpUrl?: string | null
}) {
  // Filter out the first user message which contains initial details
  const displayMessages = messages.filter((msg, idx) => {
    if (idx === 0 && msg.role === "user") return false
    return true
  })

  if (displayMessages.length === 0) return null

  return (
    <div className="flex flex-col gap-3 mt-4 border-t pt-4">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onToggle()
        }}
        className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group select-none py-1"
      >
        <span className="flex items-center gap-1.5">
          <img src={appLogo} alt="AI Ocean" className="size-3.5 object-contain" />
          AI Ocean Review Agent Research Activity ({displayMessages.length} steps)
        </span>
        <span className="flex items-center gap-1 font-semibold text-[10px] text-primary/80 group-hover:text-primary transition-colors">
          {isOpen ? "Hide research logs" : "Show research logs"}
          {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-4 mt-2">
          {displayMessages.map((msg, idx) => {
            const isAssistant = msg.role === "assistant"
            const isTool = msg.role === "tool"
            const isUser = msg.role === "user"

            // Render assistant thoughts or tool calls
            if (isAssistant) {
              const parts: any[] = Array.isArray(msg.content)
                ? msg.content
                : typeof msg.content === "string"
                ? [{ type: "text", text: msg.content }]
                : []

              return (
                <div key={idx} className="space-y-3">
                  {parts.map((part, pIdx) => {
                    if (part.type === "text" || part.type === "reasoning") {
                      const contentText = part.text || part.reasoning
                      if (!contentText?.trim()) return null

                      return (
                      <div key={pIdx} className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-50 overflow-hidden mt-0.5">
                          <img src={appLogo} alt="AI Ocean" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-foreground">AI Ocean Review Agent</span>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Review Agent</Badge>
                            <span className="text-muted-foreground text-[10px]">&middot; thought</span>
                          </div>
                          <div className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {part.type === "reasoning" ? (
                              <span className="italic text-muted-foreground">{contentText}</span>
                            ) : (
                              contentText
                            )}
                          </div>
                        </div>
                      </div>
                    )
                    }

                    if (part.type === "tool-call") {
                      // Skip update_todo and submit_report to avoid duplicate checklists
                      if (part.toolName === "update_todo" || part.toolName === "submit_report") return null

                      let toolLabel = part.toolName
                      let toolDetails = ""
                      const toolArgs = part.input || part.args
                      if (part.toolName === "search_web") {
                        toolLabel = "searched the web"
                        toolDetails = toolArgs?.query || ""
                      } else if (part.toolName === "fetch_page") {
                        toolLabel = "fetched website page"
                        toolDetails = toolArgs?.url || ""
                      }

                      return (
                        <div key={pIdx} className="flex items-center gap-3 pl-10 text-xs text-muted-foreground py-1">
                          <span className="flex size-5 items-center justify-center rounded-full bg-muted border border-border/85 text-muted-foreground">
                            {part.toolName === "search_web" ? (
                              <Search className="size-3" />
                            ) : (
                              <Globe className="size-3" />
                            )}
                          </span>
                          <span>
                            AI Ocean Review Agent <span className="font-semibold text-foreground">{toolLabel}</span>
                            {toolDetails && (
                              <>: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{toolDetails}</code></>
                            )}
                          </span>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )
            }

            if (isTool) {
              // Render tool results in expanders under the calls
              const parts: any[] = Array.isArray(msg.content) ? msg.content : []
              return (
                <div key={idx} className="space-y-1">
                  {parts.map((part, pIdx) => {
                    if (part.type === "tool-result") {
                      if (part.toolName === "update_todo" || part.toolName === "submit_report") return null

                      const rawResult = part.output !== undefined ? part.output : part.result
                      let resultStr = ""
                      if (rawResult !== undefined && rawResult !== null) {
                        const actualValue = (typeof rawResult === "object" && rawResult !== null && "type" in rawResult && rawResult.type === "json" && "value" in rawResult)
                          ? (rawResult as any).value
                          : rawResult

                        resultStr = typeof actualValue === "string"
                          ? actualValue
                          : JSON.stringify(actualValue, null, 2)
                      }
                      
                      if (!resultStr || resultStr.trim() === "") return null

                      return (
                        <div key={pIdx} className="pl-14 pr-4 py-1">
                          <details className="group border rounded-lg bg-background/30 overflow-hidden text-xs">
                            <summary className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-muted-foreground cursor-pointer hover:bg-muted/40 select-none">
                              <CornerDownRight className="size-3 text-muted-foreground transition-transform group-open:rotate-90" />
                              <span>View tool output</span>
                            </summary>
                            <div className="border-t p-3 bg-muted/10 max-h-40 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap leading-relaxed break-all">
                              {resultStr}
                            </div>
                          </details>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )
            }

            if (isUser) {
              const userText = typeof msg.content === "string" 
                ? msg.content 
                : Array.isArray(msg.content)
                ? msg.content.map((p: any) => p.text || "").join(" ")
                : ""

              if (!userText.trim()) return null

              return (
              <div key={idx} className="flex gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 overflow-hidden mt-0.5">
                  {submitterPfpUrl ? (
                    <img src={submitterPfpUrl} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <User className="size-4 text-sky-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-foreground">User</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">Submitter</Badge>
                  </div>
                  <div className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {userText}
                  </div>
                </div>
              </div>
            )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
