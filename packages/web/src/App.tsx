import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { MainLayout } from "./layouts/MainLayout"


import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ToolDetailPage } from "./pages/ToolDetailPage"
import { SignUpPage } from "./pages/SignUp"
import { ProfilePage } from "./pages/ProfilePage"

import { AuthProvider, useAuth } from "./hooks/use-auth"
import { Toaster } from "./components/ui/sonner"


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>

            <Route path="/" element={<HomePage />} />
            <Route path="/tools/:id" element={<ToolDetailPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

        </Routes>
      </AuthProvider>
      <Toaster />

    </BrowserRouter>
  )
}

export default App