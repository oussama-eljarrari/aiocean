import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { submitTool } from "@/shared/api/submissions"
import { getCategories, type Category } from "@/shared/api/tools"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, CheckCircle, ArrowLeft, Sparkles } from "lucide-react"

export function SubmitToolPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [pricingModel, setPricingModel] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  if (!user) {
    navigate("/login")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !shortDescription.trim()) {
      setError("Name and short description are required")
      return
    }
    setSubmitting(true)
    try {
      await submitTool({
        name: name.trim(),
        short_description: shortDescription.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        pricing_model: pricingModel || undefined,
        category_id: categoryId || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit tool")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="size-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Tool Submitted!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your submission! Our team will review it and you'll be notified once it's approved.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate("/profile")}>
            View My Submissions
          </Button>
          <Button onClick={() => navigate("/home")}>
            Browse Tools
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit a Tool</h1>
        <p className="mt-2 text-muted-foreground">
          Share an AI tool with the community. Our team will review your submission before it goes live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <div>
              <CardTitle>Tool Details</CardTitle>
              <CardDescription>Provide information about the AI tool you want to submit.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                placeholder="e.g. ChatGPT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Input
                id="short_description"
                placeholder="A brief one-liner about the tool"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the tool in detail, its features, use cases, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pricing">Pricing Model</Label>
                <Select value={pricingModel} onValueChange={setPricingModel}>
                  <SelectTrigger id="pricing">
                    <SelectValue placeholder="Select pricing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Freemium">Freemium</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Open Source">Open Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit Tool
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}