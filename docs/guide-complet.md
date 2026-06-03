# Guide Complet — AIOcean

## 1. Qu'est-ce qu'AIOcean ?

**AIOcean** (AI Tools Discovery Platform) est une plateforme communautaire de découverte d'outils IA. Elle permet de parcourir, rechercher et filtrer une bibliothèque d'outils IA (assistants d'écriture, générateurs d'images, agents de codage, apps de productivité, etc.) dans une interface calme et non promotionnelle.

---

## 2. Stack Technique

| Couche | Technologie |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite 7 |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **Routing** | React Router DOM v7 |
| **Animations** | Motion (Framer Motion API) + OGL (WebGL) |
| **Backend** | PHP 8.2+ (vanilla, sans framework) |
| **Base de données** | SQLite (dev), MySQL prévu pour la prod |
| **Auth** | Sessions PHP (cookies HttpOnly) |
| **Package Manager** | pnpm (monorepo) |

---

## 3. Structure du Projet

```
aiocean/
├── docs/                          # Documentation
├── packages/
│   ├── api/                       # Backend PHP
│   │   ├── config/app.php         # Configuration (DB, CORS, etc.)
│   │   ├── public/index.php       # Point d'entrée (front controller)
│   │   ├── bin/seed.php           # Script d'initialisation de la DB
│   │   ├── src/
│   │   │   ├── Core/              # Micro-framework maison
│   │   │   │   ├── Application.php    # Kernel (boot, middleware, dispatch)
│   │   │   │   ├── Router.php         # Router statique
│   │   │   │   ├── Request.php        # Wrapper requête HTTP
│   │   │   │   ├── Response.php       # Builder réponse JSON
│   │   │   │   ├── BaseController.php # Controller de base
│   │   │   │   └── Middleware/        # Pipeline (CORS, Session, JSON)
│   │   │   └── Features/          # Fonctionnalités
│   │   │       ├── Tools/         # Outils (complet)
│   │   │       └── Users/         # Utilisateurs (complet)
│   │   └── database.sqlite        # Base de données
│   └── web/                       # Frontend React
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx            # Router React
│           ├── hooks/             # Hooks personnalisés
│           │   ├── use-auth.tsx   # Contexte d'authentification
│           │   └── use-api.ts     # Hook générique de fetch
│           ├── pages/             # Pages (HomePage, ToolDetailPage, etc.)
│           ├── components/        # Composants (ui/, fancy/, Header, etc.)
│           └── shared/api/        # Client HTTP + fonctions API
│               ├── client.ts      # get() / post() avec credentials
│               └── tools.ts       # Fonction getTools()
```

---

## 4. Communication Frontend ↔ Backend

### 4.1 Architecture générale

```
Navigateur (React :5173)
       │
       │  fetch('/api/tools')
       │
       ▼
Vite Proxy (vite.config.ts)
       │
       │  proxy /api → http://localhost:8080
       │
       ▼
PHP Backend (:8080)
       │
       ├── CORS
       ├── Session
       ├── JSON Body Parser
       ├── Router → Controller → Service → Repository
       └── Response JSON
```

### 4.2 Le proxy Vite

Dans `packages/web/vite.config.ts` :

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
}
```

Toute requête vers `/api/*` depuis le frontend est **automatiquement redirigée** vers le backend PHP. Cela évite les problèmes de CORS en développement.

### 4.3 Le client HTTP

Dans `packages/web/src/shared/api/client.ts` :

```typescript
// GET avec cookies de session
export async function get<T>(path: string): Promise<T>

// POST avec JSON body + cookies de session
export async function post<T>(path: string, data: unknown): Promise<T>
```

Toutes les requêtes incluent `credentials: "include"` pour envoyer les cookies de session PHP.

### 4.4 Les endpoints API existants

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tools?search=&category=` | Liste des outils (filtres optionnels) |
| `GET` | `/api/tools/{id}` | Détail d'un outil |
| `GET` | `/api/categories` | Liste des catégories |
| `POST` | `/api/login` | Connexion (email + password) |
| `POST` | `/api/logout` | Déconnexion |
| `GET` | `/api/me` | Récupérer l'utilisateur connecté |

### 4.5 Cycle de vie d'une requête

Exemple avec la page d'accueil qui charge les outils :

1. `HomePage.tsx`  appelle `getTools({ search, category })`
2. `getTools()` dans `shared/api/tools.ts`  construit une query string et appelle `get<ToolsResponse>('/tools?...')`
3. Le **proxy Vite** intercepte `/tools?...` et le redirige vers `http://localhost:8080/api/tools?...`
4. `public/index.php`  boote l'application et appelle `Application::run()`
5. Le **middleware pipeline** s'exécute : CORS → Session → JSON Body Parser
6. Le **Router** résout la route `GET /api/tools` → `ToolController::index()`
7. Le **Controller** lit les query params et appelle `ToolService::list()`
8. Le **Service** applique les filtres et interroge le **Repository**
9. Le **Repository** retourne les données (in-memory ou SQLite)
10. La réponse JSON remonte le pipeline jusqu'au frontend

---

## 5. Comment Ajouter une Nouvelle Feature

### 5.1 Backend — Les 7 étapes

#### Étape 1 : Créer le dossier de la feature

```
packages/api/src/Features/<NomFeature>/
├── <Nom>Controller.php
├── <Nom>Service.php
├── <Nom>RepositoryInterface.php
├── <Nom>Repository.php
├── <Nom>.php                    # Entité (modèle)
└── routes.php                   # Définition des routes
```

#### Étape 2 : Définir l'entité (modèle)

```php
<?php

declare(strict_types=1);

namespace App\Features\Reviews;

final class Review
{
    public function __construct(
        public readonly string $id,
        public readonly string $toolId,
        public readonly string $userId,
        public readonly string $content,
        public readonly int $rating,
        public readonly string $createdAt,
    ) {}
}
```

#### Étape 3 : Définir les routes

```php
<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Reviews\ReviewController;

Router::get('/api/reviews',       [ReviewController::class, 'index']);
Router::get('/api/reviews/{id}',  [ReviewController::class, 'show']);
Router::post('/api/reviews',      [ReviewController::class, 'create']);
```

#### Étape 4 : Créer le Repository

```php
<?php

declare(strict_types=1);

namespace App\Features\Reviews;

final class ReviewRepository implements ReviewRepositoryInterface
{
    public function __construct(
        private \PDO $pdo,
    ) {}

    public function findAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM reviews');
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM reviews WHERE id = ?');
        $stmt->execute([$id]);
        $data = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $data ?: null;
    }
}
```

#### Étape 5 : Créer le Service

```php
<?php

declare(strict_types=1);

namespace App\Features\Reviews;

final class ReviewService
{
    public function __construct(
        private ReviewRepositoryInterface $repository,
    ) {}

    public function list(): array
    {
        return $this->repository->findAll();
    }

    public function getById(string $id): ?array
    {
        return $this->repository->findById($id);
    }
}
```

#### Étape 6 : Créer le Controller

```php
<?php

declare(strict_types=1);

namespace App\Features\Reviews;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

final class ReviewController extends BaseController
{
    public function __construct(
        private ReviewService $service,
    ) {}

    public function index(Request $request): Response
    {
        return $this->json($this->service->list());
    }

    public function show(Request $request): Response
    {
        $id = $request->param('id');
        $review = $this->service->getById($id);

        if ($review === null) {
            return $this->notFound("Review with id '$id' not found");
        }

        return $this->json($review);
    }

    public function create(Request $request): Response
    {
        $body = $request->body();
        // Validation, création, etc.
        return $this->json(['message' => 'Review created'], 201);
    }
}
```

#### Étape 7 : Enregistrer le Controller dans `Application::boot()`

Dans `packages/api/src/Core/Application.php` :

```php
private function boot(): void
{
    // ... existant ...

    $reviewRepo = new ReviewRepository($pdo);        // ← si besoin de PDO
    $reviewService = new ReviewService($reviewRepo);
    $this->controllers[ReviewController::class] = new ReviewController($reviewService);

    // OU si Repository en mémoire (seed data) :
    // $reviewRepo = new ReviewRepository();
    // ...
}
```

### 5.2 Frontend — Ajouter une page avec appel API

#### Étape 1 : Créer les types et la fonction API

Dans `packages/web/src/shared/api/reviews.ts` :

```typescript
import { get, post } from "./client"

export interface Review {
  id: string
  toolId: string
  userId: string
  content: string
  rating: number
  createdAt: string
}

export async function getReviews(): Promise<Review[]> {
  return get<Review[]>("/reviews")
}

export async function createReview(data: { toolId: string; content: string; rating: number }) {
  return post<{ message: string }>("/reviews", data)
}
```

#### Étape 2 : Créer une page

```tsx
import { useState, useEffect } from "react"
import { getReviews, type Review } from "../shared/api/reviews"

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Reviews</h1>
      {reviews.map((r) => (
        <div key={r.id}>
          <p>{r.content}</p>
          <span>Rating: {r.rating}/5</span>
        </div>
      ))}
    </div>
  )
}
```

#### Étape 3 : Ajouter la route dans `App.tsx`

```tsx
import { ReviewsPage } from "./pages/ReviewsPage"

// Dans les Routes :
<Route path="/reviews" element={<ReviewsPage />} />
```

### 5.3 Résumé du pattern complet

```
BACKEND (PHP)
──────────────────────────────────────────────────
1. packages/api/src/Features/<Name>/routes.php
2. packages/api/src/Features/<Name>/<Name>Controller.php
3. packages/api/src/Features/<Name>/<Name>Service.php
4. packages/api/src/Features/<Name>/<Name>RepositoryInterface.php
5. packages/api/src/Features/<Name>/<Name>Repository.php
6. packages/api/src/Core/Application.php → boot() ← ENREGISTRER LE CONTROLLER

FRONTEND (React/TypeScript)
──────────────────────────────────────────────────
7. packages/web/src/shared/api/<name>.ts      ← fonctions API
8. packages/web/src/pages/<Name>Page.tsx       ← page (optionnel)
9. packages/web/src/App.tsx                    ← route React (optionnel)
```

---

## 6. Résumé des Conventions

- **Backend** : Controller lit la requête → Service contient la logique métier → Repository gère les données
- **Frontend** : Les appels API se font via `shared/api/client.ts` avec `credentials: "include"`
- **Routes API** : Définies dans `routes.php` de chaque feature (auto-découvertes par `Application::discoverRoutes()`)
- **Controllers** : Doivent être enregistrés dans `Application::boot()` pour être résolus par le Router
- **Base de données** : PDO accessible via `$this->config['db']` dans Application.php

---

## 7. Commandes Utiles

```bash
# Lancer le backend (PHP)
pnpm dev:api            # → http://localhost:8080

# Lancer le frontend (Vite)
pnpm dev:web            # → http://localhost:5173

# Lancer les deux en parallèle
pnpm dev

# Initialiser la base de données
php packages/api/bin/seed.php

# Tester un endpoint
curl http://localhost:8080/api/health
curl http://localhost:8080/api/tools
```
