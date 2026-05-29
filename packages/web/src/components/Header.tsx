import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function Header() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-lg">AIOcean</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <a
            href="#"
            className="text-foreground/80 transition-colors hover:text-primary"
          >
            Browse
          </a>
          <a
            href="#"
            className="text-foreground/80 transition-colors hover:text-primary"
          >
            Submit Tool
          </a>
          <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  )
}
