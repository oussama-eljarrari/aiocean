import { AgentReviewCard } from "@/components/dashboard/AgentReviewCard"
import { EmptyState } from "@/components/dashboard/review-ui"
import { SubmissionQueue } from "@/components/dashboard/SubmissionQueue"
import { useAdminDashboard } from "@/hooks/useAdminDashboard"

export function DashboardPage() {
  const {
    agentError,
    agentJob,
    adminNotes,
    decide,
    filter,
    isAgentLoading,
    isDeciding,
    isLoading,
    onFilterChange,
    onSelectSubmission,
    onUpdateNotes,
    pageError,
    refreshSelectedAgentRun,
    selectedSubmission,
    visibleSubmissions,
  } = useAdminDashboard()

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 pb-10">
      <section className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-4 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <SubmissionQueue
          filter={filter}
          isLoading={isLoading}
          onFilterChange={onFilterChange}
          onSelect={onSelectSubmission}
          pageError={pageError}
          selectedId={selectedSubmission?.id ?? null}
          submissions={visibleSubmissions}
        />

        <div className="min-w-0">
          {selectedSubmission ? (
            <AgentReviewCard
              agentError={agentError}
              agentJob={agentJob}
              adminNotes={adminNotes}
              isAgentLoading={isAgentLoading}
              isDeciding={isDeciding}
              onApprove={() => decide("approved")}
              onRefreshAgent={() => refreshSelectedAgentRun()}
              onReject={() => decide("rejected")}
              onUpdateNotes={onUpdateNotes}
              submission={selectedSubmission}
            />
          ) : (
            <EmptyState title="Select a submission" />
          )}
        </div>
      </section>
    </div>
  )
}
