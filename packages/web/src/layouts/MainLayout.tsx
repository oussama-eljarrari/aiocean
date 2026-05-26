import { Outlet } from "react-router-dom"
import { Header } from "../components/Header"
import { Footer } from "@/components/Footer"

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col font-sans text-foreground">
      <Header />
      <main className="flex flex-1 flex-col items-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}