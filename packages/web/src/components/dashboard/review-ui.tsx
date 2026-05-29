import type { ReactNode } from "react"
import { Loader2, SearchCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AgentJob, AgentTodoItem } from "@/shared/api/agent"
import type { Submission } from "@/shared/api/submissions"

export type SubmissionFilter = "all" | "pending" | "approved" | "rejected"

export const submissionStatusLabels: Record<Submission["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

export const agentStatusLabels: Record<AgentJob["status"], string> = {
  running: "Running",
  completed: "Completed",
  failed: "Failed",
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded"
  const parsed = new Date(value.replace(" ", "T"))
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

export function statusClass(status: Submission["status"] | AgentJob["status"] | AgentTodoItem["status"]) {
  switch (status) {
    case "approved":
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    case "rejected":
    case "failed":
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
    case "running":
    case "in_progress":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
  }
}

export function submitterLabel(submission: Submission) {
  return submission.submitter_name || submission.submitter_email || "Unknown submitter"
}

export function Notice({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <SearchCheck className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">New submissions will appear here after users send tools for review.</p>
    </div>
  )
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}

export function QueueSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </>
  )
}

export function metricToneClass(tone?: "amber" | "emerald" | "rose") {
  return cn(
    tone === "emerald" && "text-emerald-600 dark:text-emerald-300",
    tone === "rose" && "text-rose-600 dark:text-rose-300",
    tone === "amber" && "text-amber-600 dark:text-amber-300",
    !tone && "text-foreground",
  )
}
