# Signup/Register Wiring

## Overview

Frontend `signup` = UI page + form + hook call.
Backend `register` = actual PHP endpoint, controller, service, repository.

---

## Full Chain

```
SignupForm.tsx
  → signup-form.tsx handleSubmit
    → useAuth().signup(name, email, password)
      → post("/register", { name, email, password })
        → client.ts buildUrl("/register") → "/api/register"
        → fetch("POST /api/register", { body: JSON.stringify(...) })
          → Browser sends HTTP request to Vite dev server
            → Vite proxies /api/* to PHP (localhost:8080)
              → PHP Router resolves POST /api/register
                → Application.php dispatch
                  → matches [UserController::class, 'register']
                  → gets UserController instance
                  → calls $controller->register($request)
                    → UserController::register()
                      → validates fields (name, email, password)
                      → $this->userService->register(name, email, password)
                        → UserService::register()
                          → checks if email already exists
                          → generates id (random hex)
                          → hashes password
                          → $this->userRepository->create(id, name, email, hash)
                            → UserRepository::create()
                              → INSERT INTO users (id, name, email, pass_hash, role)
                              → returns User object
                          → returns ['user' => $user]
                        → returns data to controller
                      → sets $_SESSION['user_id'] and $_SESSION['user_role']
                      → returns JSON response { message, user }
                    → Response sent back to browser
                      → fetch resolves
                        → client.ts handles response
                          → extracts data from envelope
                        → use-auth.tsx sets user state
                          → component re-renders
                            → navigate("/dashboard")
```

---

## File Locations

| Layer | File | Key Part |
|-------|------|----------|
| Form | `packages/web/src/components/signup-form.tsx` | `handleSubmit` calls `signup()` |
| Hook | `packages/web/src/hooks/use-auth.tsx` | `signup()` calls `post("/register", ...)` |
| API client | `packages/web/src/shared/api/client.ts` | `buildUrl` adds `/api` prefix, `request` does `fetch` |
| Route | `packages/api/src/Features/Users/routes.php` | `Router::post('/api/register', [UserController::class, 'register'])` |
| Controller | `packages/api/src/Features/Users/UserController.php` | `register()` validates input, calls service |
| Service | `packages/api/src/Features/Users/UserService.php` | `register()` checks email, hashes password, calls repo |
| Repository | `packages/api/src/Features/Users/UserRepository.php` | `create()` runs `INSERT INTO users` |
| DI | `packages/api/src/Core/Application.php` | `boot()` wires PDO → Repo → Service → Controller |

---

## Key Files

### routes.php
```php
Router::post('/api/register', [UserController::class, 'register']);
```
Says: POST `/api/register` calls `UserController::register()`.

### Application.php (boot)
```php
$userRepo = new UserRepository($pdo);
$emailService = new EmailService(...);
$userService = new UserService($userRepo, $emailService);
$this->controllers[UserController::class] = new UserController($userService);
```
Wires the entire dependency chain.

### Application.php (dispatch)
```php
[$controllerClass, $method] = $handler;
$controller = $this->controllers[$controllerClass];
return $controller->$method($request);
```
Resolves the route handler to the actual controller instance and method.

### UserController::register()
```php
$result = $this->userService->register($name, $email, $password);
$_SESSION['user_id'] = $user->id;
return $this->data(['message' => 'Account created', 'user' => $user->toArray()], 201);
```

### UserService::register()
```php
$id = bin2hex(random_bytes(16));
$hash = password_hash($password, PASSWORD_DEFAULT);
$user = $this->userRepository->create($id, $name, $email, $hash);
return ['user' => $user];
```

### UserRepository::create()
```php
$stmt = $this->pdo->prepare(
  'INSERT INTO users (id, name, email, pass_hash, role) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$id, $name, $email, $passHash, 'user'];
return new User($id, $name, $email, $passHash, 'user', null);
```

### client.ts
```ts
const API_BASE = "/api"
function buildUrl(path) { return `${API_BASE}${path}` }
// post("/register", ...) → fetch("POST /api/register", ...)
```

### use-auth.tsx
```ts
const signup = async (name, email, pass) => {
  const result = await post("/register", { name, email, password: pass });
  setUser(result.user);
};
```

---

## Important Notes

- The frontend page route is `/signup` (browser URL).
- The backend API endpoint is `POST /api/register` (server endpoint).
- They don't need to have the same name — `/signup` page calls `/api/register` API.
- Dependencies are wired once in `Application.php::boot()` — not in individual files.
