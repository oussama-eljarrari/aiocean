# README — Contributions par Oussama

## Commits effectués

### 1. Diagrammes de séquence (12 Mai 2026)
- **`9b17ff0`** — `diagramme sequence se connecter`
- **`5bae2a4`** — `diagramme sequence se connecter`

Fichier créé : `docs/se connecter.md`

Diagramme Mermaid du flux de connexion :
- Utilisateur saisit email + mot de passe
- Validation locale des champs
- Appel `POST /api/auth/login`
- Vérification en base de données
- Hash verification du mot de passe
- Création de session serveur avec cookie HttpOnly
- Redirection vers `/dashboard`

### 2. Fusion branche Jounaidayoub (22 Mai 2026)
- **`62a9cb4`** — `Merge branch 'Jounaidayoub:master' into master`

### 3. Fusion branche Jounaidayoub (31 Mai 2026)
- **`26f59b4`** — `Merge branch 'Jounaidayoub:master' into master`

Intègre les fonctionnalités développées par Ayoub :
- Agent IA de review (PHP + Node.js)
- Endpoints admin (submissions, agent runs)
- Dashboard admin (SubmissionQueue, AgentReviewCard)
- Collections, Reports, Reviews, Votes
- Profile page
- Refonte architecture PHP (Core, Features, Shared)

---

## Fichiers créés (hors commits)

### `docs/guide-complet.md`
Guide technique complet du projet AIOcean :
- Stack technique (React 19, PHP 8.2, SQLite, Tailwind CSS 4)
- Structure du projet (monorepo pnpm)
- Communication Frontend ↔ Backend via proxy Vite
- Procédure pour ajouter une nouvelle fonctionnalité (backend 7 étapes + frontend)
- Conventions et commandes utiles

### `packages/web/src/pages/LandingPage.tsx`
Page d'accueil publique avec :
- Hero section avec animation TextRotate
- Barre de recherche
- Filtres (catégorie, prix, plateforme, note)
- Tri (Featured, Most upvoted, Highest rated, Most popular, Name A-Z)
- Grille d'outils (ToolGrid)

### `packages/web/src/pages/AdminPage.tsx`
Page admin placeholder.

### `filtre.md`
Diagramme Mermaid du flux de filtrage des modèles : sélection des filtres → requête SQL → résultats enrichis → affichage grille.

---

## Modifications en cours (working tree)

### `packages/web/src/App.tsx`
- Ajout de `LandingPage` à la racine `/` (remplace `HomePage`)
- Déplacement de `HomePage` vers `/home` (protégé par `ProtectedRoute`)
- Création de `AdminRoute` — vérifie `user.role === "admin"` et redirige vers `/home` sinon
- Routes `/dashboard` et `/admin` protégées par `AdminRoute`

### `packages/web/src/components/Header.tsx`
- Navigation dynamique : lien "Dashboard" visible uniquement pour les admins
- Affichage du profil utilisateur connecté (initiales ou photo)
- Boutons Sign In / Sign Up pour les visiteurs

### `packages/web/src/pages/HomePage.tsx`
- Page déplacée de `/` vers `/home`
- Ajout de filtres avancés : Pricing, Platform, Rating
- Options de tri (Most upvoted, Highest rated, Most popular, Name A-Z)
- Panneau de filtres rétractable
- Compteur de filtres actifs avec badge
- Meilleure gestion des états (loading, error, empty)

### `packages/web/src/pages/ProfilePage.tsx`
- Affichage des collections et soumissions de l'utilisateur
- Onglets avec `Tabs` (collections / submissions)
- Bouton de déconnexion
- États de chargement et d'erreur

### `packages/web/src/components/login-form.tsx`
- Redirection vers `/home` au lieu de `/dashboard` après connexion

### `packages/web/src/components/ToolGrid.tsx`
- Import du type `Tool` depuis `shared/schema` au lieu de `ToolCard`

### `packages/web/src/shared/api/tools.ts`
- Nettoyage d'import (type `Tool` depuis schema)

### `TASKS.md`
- Nettoyage de commentaire orphelin

### `pnpm-lock.yaml`
- Mise à jour des dépendances (667 nouvelles entrées)

---

## Résumé des contributions

| Domaine | Détail |
|---------|--------|
| **Documentation** | Diagrammes de séquence (connexion, filtrage), guide technique complet |
| **Routing** | Route `/` → LandingPage, `/home` → HomePage, AdminRoute pour `/dashboard` et `/admin` |
| **UI/UX** | Header dynamique (admin link, profil), LandingPage, HomePage filtres/tri, ProfilePage onglets |
| **Sécurité** | Restriction dashboard/admin aux utilisateurs avec rôle `admin` |
| **Refactoring** | Types centralisés dans `shared/schema`, redirection login vers `/home` |
