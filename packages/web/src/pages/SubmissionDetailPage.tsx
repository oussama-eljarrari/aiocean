import { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"

import { AgentReviewCard } from "@/components/dashboard/AgentReviewCard"
import { getAdminSubmission, decideSubmission, type Submission } from "@/shared/api/submissions"
import { getAgentHistoryForSubmission, type AgentJob } from "@/shared/api/agent"

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [agentJob, setAgentJob] = useState<AgentJob | null>(null)
  const [agentRuns, setAgentRuns] = useState<AgentJob[]>([])
  const [agentError, setAgentError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  const [isDeciding, setIsDeciding] = useState<"approved" | "rejected" | "changes_requested" | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const loadData = useCallback(async (submissionId: string, options: { quiet?: boolean } = {}) => {
    if (!options.quiet) {
      setIsLoading(true)
      setPageError(null)
    }
    try {
      const subData = await getAdminSubmission(submissionId)
      setSubmission(subData)
      setAdminNotes(subData.admin_notes ?? "")

      if (!options.quiet) setIsAgentLoading(true)
      setAgentError(null)
      try {
        const runs = await getAgentHistoryForSubmission(submissionId)
        setAgentRuns(runs)
        setAgentJob(runs.length > 0 ? runs[runs.length - 1] : null)
      } catch (err) {
        setAgentRuns([])
        setAgentJob(null)
        setAgentError(err instanceof Error ? err.message : "No agent run found")
      } finally {
        if (!options.quiet) setIsAgentLoading(false)
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load submission details")
    } finally {
      if (!options.quiet) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      void loadData(id)
    }
  }, [id, loadData])

  // Poll agent run status if running
  useEffect(() => {
    if (!id || !agentJob) return
    const shouldPoll = agentJob.status === "running" || agentError !== null
    if (!shouldPoll) return

    const timer = window.setInterval(() => {
      void loadData(id, { quiet: true })
    }, 5000)

    return () => window.clearInterval(timer)
  }, [id, agentJob?.status, agentError, loadData])

  const handleRefreshAgent = useCallback(async () => {
    if (!id) return
    setIsAgentLoading(true)
    try {
      const runs = await getAgentHistoryForSubmission(id)
      setAgentRuns(runs)
      setAgentJob(runs.length > 0 ? runs[runs.length - 1] : null)
      setAgentError(null)
      toast.success("Timeline synced with AI agent runs")
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Failed to sync runs")
      toast.error("Failed to sync runs")
    } finally {
      setIsAgentLoading(false)
    }
  }, [id])

  const handleDecide = useCallback(async (status: "approved" | "rejected" | "changes_requested") => {
    if (!id || !submission) return
    setIsDeciding(status)
    try {
      const updated = await decideSubmission(id, status, adminNotes)
      setSubmission(updated)
      setAdminNotes(updated.admin_notes ?? "")

      const emailNote = updated.submitter_email ? `Email sent to ${updated.submitter_email}` : "No email for submitter"
      let toastTitle = "Submission Approved"
      if (status === "rejected") toastTitle = "Submission Rejected"
      else if (status === "changes_requested") toastTitle = "Changes Requested"

      toast.success(toastTitle, {
        description: emailNote,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Could not mark as ${status}`
      toast.error(msg)
    } finally {
      setIsDeciding(null)
    }
  }, [id, submission, adminNotes])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading review details...</p>
      </div>
    )
  }

  if (pageError || !submission) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" />
            Back to Submissions
          </Link>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">Error Loading Submission</p>
          <p className="mt-1 text-sm">{pageError || "Submission not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors">
          <ArrowLeft className="size-4" />
          Back to Submissions list
        </Link>
      </div>

      <div className="animate-fade-in">
        <AgentReviewCard
          agentError={agentError}
          agentJob={agentJob}
          agentRuns={agentRuns}
          adminNotes={adminNotes}
          isAgentLoading={isAgentLoading}
          isDeciding={isDeciding}
          onApprove={() => handleDecide("approved")}
          onRefreshAgent={handleRefreshAgent}
          onReject={() => handleDecide("rejected")}
          onChangesRequested={() => handleDecide("changes_requested")}
          onUpdateNotes={setAdminNotes}
          submission={submission}
        />
      </div>
    </div>
  )
}
