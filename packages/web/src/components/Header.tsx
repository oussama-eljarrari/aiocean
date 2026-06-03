import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Link, useNavigate } from "react-router-dom"

export function Header() {
  const navigate = useNavigate()
  const { user } = useAuth()

 
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?"
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/home" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">AIOcean</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/home"
            className="text-foreground/80 transition-colors hover:text-primary"
          >
            Browse
          </Link>
          <Link
            to="/home?submit=true"
            className="text-foreground/80 transition-colors hover:text-primary"
          >
            Submit Tool
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/dashboard"
                  className="text-foreground/80 transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                aria-label="Profile"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:border-primary"
              >
                {user.pfp_url ? (
                  <img
                    src={user.pfp_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </Link>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
