<?php

declare(strict_types=1);

namespace App\Features\Users;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

final class UserController extends BaseController
{
    public function __construct(
        private UserService $userService
    ) {}

    public function login(Request $request): Response
    {
        $body = $request->body();
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            return $this->json(['error' => 'Email and password are required'], 400);
        }

        $user = $this->userService->verifyCredentials($email, $password);

        if (!$user) {
            return $this->json(['error' => 'Invalid email or password'], 401);
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_role'] = $user->role;

        return $this->data(['message' => 'Logged in successfully', 'user' => $user->toArray()]);
    }

    public function register(Request $request): Response
    {
        $body     = $request->body();
        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$name || !$email || !$password) {
            return $this->json(['error' => 'Name, email and password are required'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Invalid email address'], 400);
        }

        if (strlen($password) < 8) {
            return $this->json(['error' => 'Password must be at least 8 characters'], 400);
        }

        $result = $this->userService->register($name, $email, $password);

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], 409);
        }

        $user = $result['user'];
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_role'] = $user->role;

        return $this->data(['message' => 'Account created', 'user' => $user->toArray()], 201);
    }

    public function logout(Request $request): Response
    {
        $_SESSION = [];
        if (session_id() !== '') {
            session_destroy();
        }

        // Keep the cookie but clear server-side session
        return $this->data(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): Response
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->json(['error' => 'Not authenticated'], 401);
        }

        $user = $this->userService->getById($_SESSION['user_id']);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 401);
        }

        return $this->data(['user' => $user->toArray()]);
    }


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


}
