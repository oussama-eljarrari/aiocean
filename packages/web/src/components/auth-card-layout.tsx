import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import bgImage from "../assets/wave-blue.png"
import heroImage from "../assets/ai-ocean.png"

interface AuthCardLayoutProps {
  children: ReactNode
}

export function AuthCardLayout({ children }: AuthCardLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 font-sans text-foreground overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>
      <div className="relative w-full max-w-sm md:max-w-3xl z-10">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:min-h-[520px] md:grid-cols-2">
            <div className="flex flex-col justify-center p-6 md:p-8">
              {children}
            </div>
            <div className="relative hidden bg-muted md:block">
              <img
                src={heroImage}
                alt="AI OCEAN"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
