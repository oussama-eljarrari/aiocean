import { CalendarClock, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Submission } from "@/shared/api/submissions"
import {
  EmptyState,
  formatDate,
  QueueSkeleton,
  statusClass,
  submissionStatusLabels,
  submitterLabel,
  type SubmissionFilter,
} from "./review-ui"

interface SubmissionQueueProps {
  filter: SubmissionFilter
  isLoading: boolean
  onFilterChange: (filter: SubmissionFilter) => void
  onSelect: (submissionId: string) => void
  pageError: string | null
  selectedId: string | null
  submissions: Submission[]
}

export function SubmissionQueue({
  filter,
  isLoading,
  onFilterChange,
  onSelect,
  pageError,
  selectedId,
  submissions,
}: SubmissionQueueProps) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Review queue</h2>
        <Badge variant="secondary" className="font-medium">{submissions.length} shown</Badge>
      </div>

      <Tabs value={filter} onValueChange={(value) => onFilterChange(value as SubmissionFilter)} className="mb-4">
        <TabsList className="flex flex-wrap h-auto w-full gap-1 p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[45px] text-xs py-1.5">All</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 min-w-[65px] text-xs py-1.5">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 min-w-[65px] text-xs py-1.5">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 min-w-[65px] text-xs py-1.5">Rejected</TabsTrigger>
          <TabsTrigger value="changes_requested" className="flex-1 min-w-[110px] text-xs py-1.5">Changes Requested</TabsTrigger>
        </TabsList>
      </Tabs>

      {pageError ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <QueueSkeleton />
        ) : submissions.length === 0 ? (
          <EmptyState title="No submissions in this view" />
        ) : (
          submissions.map((submission) => (
            <button
              key={submission.id}
              className={cn(
                "w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md",
                selectedId === submission.id ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20" : "border-border/60",
              )}
              onClick={() => onSelect(submission.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{submission.tool_name}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
                    <UserRound className="size-3.5 shrink-0" />
                    <span className="truncate">{submitterLabel(submission)}</span>
                  </p>
                </div>
                <Badge className={cn("shrink-0", statusClass(submission.status))} variant="outline">
                  {submissionStatusLabels[submission.status]}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" />
                  {formatDate(submission.created_at)}
                </span>
                <span className="capitalize">Tool {submission.tool_status}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
