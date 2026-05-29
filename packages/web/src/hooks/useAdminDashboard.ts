import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { AgentJob } from "@/shared/api/agent"
import { getAgentRunForSubmission } from "@/shared/api/agent"
import { decideSubmission, getAdminSubmissions, type Submission } from "@/shared/api/submissions"
import type { SubmissionFilter } from "@/components/dashboard/review-ui"

export function useAdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubmissionFilter>("all")
  
  const [agentJob, setAgentJob] = useState<AgentJob | null>(null)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  const [isDeciding, setIsDeciding] = useState<"approved" | "rejected" | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const selectedSubmission = useMemo(
    () => submissions.find((s) => s.id === selectedId) ?? submissions[0] ?? null,
    [selectedId, submissions],
  )

  const selectedSubmissionId = selectedSubmission?.id ?? null
  const selectedSubmissionNotes = selectedSubmission?.admin_notes ?? ""

  const visibleSubmissions = useMemo(() => {
    if (filter === "all") return submissions
    return submissions.filter((s) => s.status === filter)
  }, [filter, submissions])

  const loadSubmissions = useCallback(async () => {
    setPageError(null)
    setIsLoading(true)
    try {
      const nextSubmissions = await getAdminSubmissions()
      setSubmissions(nextSubmissions)
      setSelectedId((currentId) => {
        if (currentId && nextSubmissions.some((s) => s.id === currentId)) {
          return currentId
        }
        return nextSubmissions[0]?.id ?? null
      })
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load submissions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAgentRun = useCallback(async (submissionId: string, options: { quiet?: boolean } = {}) => {
    if (!options.quiet) setIsAgentLoading(true)
    setAgentError(null)
    try {
      const run = await getAgentRunForSubmission(submissionId)
      setAgentJob(run)
    } catch (error) {
      setAgentJob(null)
      setAgentError(error instanceof Error ? error.message : "No agent run found")
    } finally {
      if (!options.quiet) setIsAgentLoading(false)
    }
  }, [])

  const refreshSelectedAgentRun = useCallback(async () => {
    if (!selectedSubmissionId) return
    await loadAgentRun(selectedSubmissionId)
  }, [loadAgentRun, selectedSubmissionId])

  const decide = useCallback(async (status: "approved" | "rejected") => {
    if (!selectedSubmission) return
    setIsDeciding(status)
    setPageError(null)
    try {
      const updated = await decideSubmission(selectedSubmission.id, status, adminNotes)
      setSubmissions((current) =>
        current.map((sub) => (sub.id === updated.id ? updated : sub)),
      )
      setAdminNotes(updated.admin_notes ?? "")
      
      const emailNote = updated.submitter_email ? `Email sent to ${updated.submitter_email}` : "No email for submitter"
      toast.success(`Submission ${status === "approved" ? "Approved" : "Rejected"}`, {
        description: emailNote,
        action: {
          label: "View Tool",
          onClick: () => window.open(`/tools/${updated.tool_id}`, "_blank")
        }
      })
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : `Could not mark as ${status}`
      setPageError(msg)
      toast.error(msg)
    } finally {
      setIsDeciding(null)
    }
  }, [adminNotes, selectedSubmission])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  useEffect(() => {
    if (!selectedSubmissionId) {
      setAgentJob(null)
      setAgentError(null)
      return
    }
    setAdminNotes(selectedSubmissionNotes)
    void loadAgentRun(selectedSubmissionId)
  }, [loadAgentRun, selectedSubmissionId, selectedSubmissionNotes])

  useEffect(() => {
    if (!selectedSubmissionId) return
    const shouldPoll = agentJob?.status === "running" || agentError !== null
    if (!shouldPoll) return

    const timer = window.setInterval(() => {
      void loadAgentRun(selectedSubmissionId, { quiet: true })
    }, 5000)

    return () => window.clearInterval(timer)
  }, [agentError, agentJob?.status, loadAgentRun, selectedSubmissionId])

  return {
    visibleSubmissions,
    selectedSubmission,
    filter,
    onFilterChange: setFilter,
    onSelectSubmission: setSelectedId,
    agentJob,
    agentError,
    adminNotes,
    onUpdateNotes: setAdminNotes,
    isLoading,
    isAgentLoading,
    isDeciding,
    pageError,
    loadSubmissions,
    refreshSelectedAgentRun,
    decide
  }
}
