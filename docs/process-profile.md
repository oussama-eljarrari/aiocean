# Task A5 — User Profile / Settings
## Goal
Create a `/settings` page where a logged-in user can update:
- name
- email
- avatar URL (`pfp_url`)
Backend endpoint needed:
```txt
PATCH /api/me
1. Backend Route
File:
packages/api/src/Features/Users/routes.php
Add this route:
Router::patch('/api/me', [UserController::class, 'updateMe']);
Final file should include something like:
Router::post('/api/register', [UserController::class, 'register']);
Router::post('/api/login',    [UserController::class, 'login']);
Router::post('/api/logout',   [UserController::class, 'logout']);
Router::get('/api/me',        [UserController::class, 'me']);
Router::patch('/api/me',      [UserController::class, 'updateMe']);
2. Backend Controller Method
File:
packages/api/src/Features/Users/UserController.php
Add this method inside UserController:
public function updateMe(Request $request): Response
{
    if (!isset($_SESSION['user_id'])) {
        return $this->json(['error' => 'Not authenticated'], 401);
    }
    $body = $request->body();
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $pfpUrl = isset($body['pfp_url']) ? trim($body['pfp_url']) : null;
    if (!$name || !$email) {
        return $this->json(['error' => 'Name and email are required'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return $this->json(['error' => 'Invalid email address'], 400);
    }
    $result = $this->userService->updateProfile(
        $_SESSION['user_id'],
        $name,
        $email,
        $pfpUrl ?: null
    );
    if (isset($result['error'])) {
        return $this->json(['error' => $result['error']], 409);
    }
    return $this->data([
        'message' => 'Profile updated',
        'user' => $result['user']->toArray(),
    ]);
}
3. Backend Service Method
File:
packages/api/src/Features/Users/UserService.php
Add this method inside UserService:
public function updateProfile(string $userId, string $name, string $email, ?string $pfpUrl): array
{
    $user = $this->userRepository->findById($userId);
    if (!$user) {
        return ['error' => 'User not found'];
    }
    if ($this->userRepository->falsemail($email, $userId)) {
        return ['error' => 'Email already in use'];
    }
    $updatedUser = $this->userRepository->updateProfile($userId, $name, $email, $pfpUrl);
    if (!$updatedUser) {
        return ['error' => 'Could not update profile'];
    }
    return ['user' => $updatedUser];
}
4. Backend Repository Interface
File:
packages/api/src/Features/Users/UserRepositoryInterface.php
Add these methods:
public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User;
public function falsemail(string $email, string $userId): bool;
Final interface should look like:
interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
    public function findById(string $id): ?User;
    public function create(string $id, string $name, string $email, string $passHash): User;
    public function emailExists(string $email): bool;
    public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User;
    public function falsemail(string $email, string $userId): bool;
}
5. Backend Repository Methods
File:
packages/api/src/Features/Users/UserRepository.php
Add these methods inside UserRepository:
public function updateProfile(string $id, string $name, string $email, ?string $pfpUrl): ?User
{
    $stmt = $this->pdo->prepare(
        'UPDATE users SET name = ?, email = ?, pfp_url = ? WHERE id = ?'
    );
    $stmt->execute([$name, $email, $pfpUrl, $id]);
    return $this->findById($id);
}
public function falsemail(string $email, string $userId): bool
{
    $stmt = $this->pdo->prepare(
        'SELECT 1 FROM users WHERE email = ? AND id != ?'
    );
    $stmt->execute([$email, $userId]);
    return (bool) $stmt->fetch();
}
6. Frontend API Helper
Create file:
packages/web/src/shared/api/users.ts
Add:
import { patch } from "./client"
import type { User } from "@/hooks/use-auth"
export function updateMe(data: {
  name: string
  email: string
  pfp_url?: string | null
}) {
  return patch<{ user: User }>("/me", data)
}
7. Frontend Settings Page
Create file:
packages/web/src/pages/SettingsPage.tsx
Add:
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/shared/api/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
export function SettingsPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [pfpUrl, setPfpUrl] = useState(user?.pfp_url ?? "")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setIsSaving(true)
    try {
      await updateMe({
        name,
        email,
        pfp_url: pfpUrl || null,
      })
      setMessage("Profile updated successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.")
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <p className="text-sm font-medium text-green-600">{message}</p>
            )}
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pfp_url">Avatar URL</Label>
              <Input
                id="pfp_url"
                value={pfpUrl}
                onChange={(e) => setPfpUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            {pfpUrl && (
              <img
                src={pfpUrl}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
8. Add Route In App
File:
packages/web/src/App.tsx
Add import:
import { SettingsPage } from "./pages/SettingsPage"
Add route inside the protected layout area:
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  }
/>
Example:
<Route element={<MainLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/tools/:id" element={<ToolDetailPage />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } />
  <Route path="/settings" element={
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  } />
</Route>
9. Test It
Run backend:
pnpm dev:api
Run frontend:
pnpm dev
Then test:
1. Login.
2. Go to:
/settings
3. Change name, email, or avatar URL.
4. Click save.
5. Refresh page.
6. Check if updated data stayed saved.
Summary Of Files To Touch
packages/api/src/Features/Users/routes.php
packages/api/src/Features/Users/UserController.php
packages/api/src/Features/Users/UserService.php
packages/api/src/Features/Users/UserRepositoryInterface.php
packages/api/src/Features/Users/UserRepository.php
packages/web/src/shared/api/users.ts
packages/web/src/pages/SettingsPage.tsx
packages/web/src/App.tsx