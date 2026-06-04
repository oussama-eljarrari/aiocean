<?php

declare(strict_types=1);

namespace App\Features\PasswordReset;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

final class PasswordResetController extends BaseController
{
    public function __construct(
        private PasswordResetService $resetService
    ) {}

    public function request(Request $request): Response
    {
        $body = $request->body();
        $email = trim($body['email'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->badRequest('A valid email is required');
        }

        $this->resetService->requestReset($email);

        return $this->data(['message' => 'Check your email']);
    }

    public function reset(Request $request): Response
    {
        $body = $request->body();
        $token = trim($body['token'] ?? '');
        $password = $body['password'] ?? '';

        if (!$token) {
            return $this->badRequest('Token is required');
        }

        if (!$password) {
            return $this->badRequest('Password is required');
        }

        $result = $this->resetService->resetPassword($token, $password);

        if (isset($result['error'])) {
            return $this->badRequest($result['error']);
        }

        return $this->data(['message' => 'Password reset successful']);
    }
}
