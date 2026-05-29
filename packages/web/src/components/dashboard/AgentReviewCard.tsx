import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import {
  AlertCircle,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AgentJob, AgentTodoItem } from "@/shared/api/agent"
import type { Submission } from "@/shared/api/submissions"
import {
  agentStatusLabels,
  formatDate,
  LoadingBlock,
  Notice,
  statusClass,
  submissionStatusLabels,
  submitterLabel,
} from "./review-ui"

interface AgentReviewCardProps {
  agentError: string | null
  agentJob: AgentJob | null
  adminNotes: string
  isAgentLoading: boolean
  isDeciding: "approved" | "rejected" | null
  onApprove: () => void
  onRefreshAgent: () => void
  onReject: () => void
  onUpdateNotes: (value: string) => void
  submission: Submission
}

export function AgentReviewCard({
  agentError,
  agentJob,
  adminNotes,
  isAgentLoading,
  isDeciding,
  onApprove,
  onRefreshAgent,
  onReject,
  onUpdateNotes,
  submission,
}: AgentReviewCardProps) {
  const [activeTab, setActiveTab] = useState<string>("steps")

  useEffect(() => {
    if (agentJob?.report) {
      setActiveTab("report")
    } else {
      setActiveTab("steps")
    }
  }, [agentJob?.report, submission.id])

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
              Agent {agentStatusLabels[agentJob.status]}
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
        <div className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
                <TabsTrigger value="form">Submission Form</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={onRefreshAgent} disabled={isAgentLoading} className="h-8 shadow-sm">
                <RefreshCw className={cn("size-3.5 mr-2", isAgentLoading && "animate-spin")} />
                Sync
              </Button>
            </div>

            <TabsContent value="steps" className="m-0">
              <ReviewStepper todos={agentJob?.todo_list ?? []} />
            </TabsContent>

            <TabsContent value="report" className="m-0">
              {isAgentLoading ? (
                <LoadingBlock label="Loading agent run" />
              ) : agentError ? (
                <Notice
                  icon={<AlertCircle className="size-4" />}
                  title="No agent run is available"
                  body={agentError}
                />
              ) : agentJob?.report ? (
                <MarkdownReport report={agentJob.report} />
              ) : (
                <Notice
                  icon={<FileText className="size-4" />}
                  title="Report not submitted yet"
                  body="The agent has not saved a final markdown report for this submission."
                />
              )}
            </TabsContent>

            <TabsContent value="form" className="m-0">
              <SubmissionFormView submission={submission} />
            </TabsContent>
          </Tabs>
        </div>

        <DecisionSidebar
          adminNotes={adminNotes}
          isDeciding={isDeciding}
          onApprove={onApprove}
          onReject={onReject}
          onUpdateNotes={onUpdateNotes}
        />
      </div>
    </div>
  )
}

function DecisionSidebar({
  adminNotes,
  isDeciding,
  onApprove,
  onReject,
  onUpdateNotes,
}: {
  adminNotes: string
  isDeciding: "approved" | "rejected" | null
  onApprove: () => void
  onReject: () => void
  onUpdateNotes: (value: string) => void
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
            className="min-h-[120px] resize-y"
            onChange={(event) => onUpdateNotes(event.target.value)}
            placeholder="Add reviewer notes..."
            value={adminNotes}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button onClick={onApprove} disabled={isDeciding !== null} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isDeciding === "approved" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Approve
          </Button>
          <Button variant="destructive" onClick={onReject} disabled={isDeciding !== null} className="w-full">
            {isDeciding === "rejected" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <X className="mr-2 size-4" />}
            Reject
          </Button>
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
    <div className="rounded-lg border bg-background">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Verification progress</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedTodos} of {todos.length} checks complete
            </p>
          </div>
          <span className="text-2xl font-semibold">{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-4">
        {todos.map((todo, index) => (
          <div key={`${todo.content}-${index}`} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("flex size-7 items-center justify-center rounded-full border text-xs", statusClass(todo.status))}>
                {stepIcon(todo.status, index + 1)}
              </span>
              {index < todos.length - 1 ? <span className="min-h-8 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium leading-5">{todo.content}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {todo.status.replace("_", " ")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function stepIcon(status: AgentTodoItem["status"], fallback: number) {
  if (status === "completed") return <Check className="size-4" />
  if (status === "in_progress") return <Loader2 className="size-4 animate-spin" />
  if (status === "cancelled") return <X className="size-4" />
  return <span>{fallback}</span>
}

function SubmissionFormView({ submission }: { submission: Submission }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 bg-muted/40">
        <h3 className="font-semibold text-foreground">User Provided Form</h3>
      </div>
      <div className="flex flex-col p-0">
        <FormRow label="Tool Name" value={submission.tool_name} />
        <FormRow label="Short Description" value={submission.tool_short_description} />
        <FormRow label="Description" value={submission.tool_description} />
        <FormRow label="Website" value={submission.tool_website} isLink />
        <FormRow label="Pricing" value={submission.tool_pricing} />
        <FormRow label="Category" value={submission.tool_category} />
        <FormRow label="Submitter Info" value={`${submitterLabel(submission)} ${submission.submitter_email ? `(${submission.submitter_email})` : ""}`} />
      </div>
    </div>
  )
}

function FormRow({ label, value, isLink }: { label: string; value?: string | null; isLink?: boolean }) {
  const safeValue = value?.trim() ? value : "Not provided"

  return (
    <div className="grid grid-cols-1 gap-1 border-b p-4 last:border-0 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground sm:col-span-2">
        {isLink && safeValue !== "Not provided" ? (
          <a href={safeValue} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {safeValue}
          </a>
        ) : (
          safeValue
        )}
      </dd>
    </div>
  )
}

function MarkdownReport({ report }: { report: string }) {
  return (
    <div className="max-w-none rounded-lg border bg-background p-4 text-sm leading-6">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-3 text-xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-3 text-foreground/90">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ children, href }) => (
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>
          ),
        }}
      >
        {report}
      </ReactMarkdown>
    </div>
  )
}
