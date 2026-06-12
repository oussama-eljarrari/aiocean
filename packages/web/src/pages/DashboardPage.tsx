import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Search, Loader2, CheckCircle, XCircle, AlertCircle, FileText, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAdminSettings, updateAdminSettings } from "@/shared/api/settings"
import { getAdminSubmissions, type Submission } from "@/shared/api/submissions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, statusClass, submissionStatusLabels, submitterLabel } from "@/components/dashboard/review-ui"

export function DashboardPage() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  // Settings
  const [autoRequestChanges, setAutoRequestChanges] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  const loadSubmissions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAdminSubmissions()
      setSubmissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()

    getAdminSettings()
      .then((settings) => {
        setAutoRequestChanges(settings.agent_auto_request_changes === 'true')
      })
      .catch((err) => {
        console.error("Failed to load settings:", err)
      })
  }, [])

  const handleToggleAutoRequest = async () => {
    const newValue = !autoRequestChanges
    setIsUpdatingSettings(true)
    try {
      const updated = await updateAdminSettings({ agent_auto_request_changes: newValue })
      setAutoRequestChanges(updated.agent_auto_request_changes === 'true')
      toast.success(
        newValue
          ? "AI auto-request changes enabled. Agent will directly request changes when issues are found."
          : "AI auto-request changes disabled. All review transitions will require manual admin approval."
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const total = submissions.length
    const pending = submissions.filter((s) => s.status === "pending").length
    const approved = submissions.filter((s) => s.status === "approved").length
    const rejected = submissions.filter((s) => s.status === "rejected").length
    const changesRequested = submissions.filter((s) => s.status === "changes_requested").length
    return { total, pending, approved, rejected, changesRequested }
  }, [submissions])

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesFilter = filter === "all" || sub.status === filter
      const matchesSearch =
        sub.tool_name.toLowerCase().includes(search.toLowerCase()) ||
        (sub.submitter_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (sub.submitter_email || "").toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [submissions, filter, search])

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 pb-10">
      {/* Admin Control Bar / Settings */}
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight animate-fade-in">Admin Review Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage and verify submitted tools with AI assistance.</p>
          </div>
          
          {/* Settings Section */}
          <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border/80">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Automation</span>
              <label htmlFor="auto-request-toggle" className="text-sm font-medium cursor-pointer">
                Auto-Request Changes on Issue Detection
              </label>
            </div>
            {/* Toggle Switch */}
            <button
              id="auto-request-toggle"
              onClick={handleToggleAutoRequest}
              disabled={isUpdatingSettings}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                autoRequestChanges ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoRequestChanges ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard title="Total Submissions" value={stats.total} icon={<FileText className="size-4 text-blue-500" />} />
          <StatCard title="Pending" value={stats.pending} icon={<Loader2 className="size-4 text-sky-500" />} />
          <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="size-4 text-emerald-500" />} />
          <StatCard title="Changes Requested" value={stats.changesRequested} icon={<AlertCircle className="size-4 text-amber-500" />} />
          <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="size-4 text-rose-500" />} />
        </div>

        {/* Filters and List Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/20 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 h-9 w-full md:w-[600px] gap-1 p-1 bg-muted">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
                <TabsTrigger value="changes_requested" className="text-xs">Changes</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, submitter..."
                className="pl-9 text-sm h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-destructive text-sm">
                {error}
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-base font-semibold text-muted-foreground">No submissions found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filter or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Tool Name</th>
                      <th className="pb-3 px-4">Submitter</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Submitted Date</th>
                      <th className="pb-3 px-4">Tool Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="group hover:bg-muted/10 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-foreground">
                          {sub.tool_name}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{submitterLabel(sub)}</span>
                            <span className="text-xs">{sub.submitter_email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={statusClass(sub.status)} variant="outline">
                            {submissionStatusLabels[sub.status]}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {formatDate(sub.created_at)}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground capitalize">
                          {sub.tool_status}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-muted text-primary hover:text-primary-foreground group-hover:border-primary/40"
                          >
                            Review
                            <ArrowRight className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border border-border/80">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
