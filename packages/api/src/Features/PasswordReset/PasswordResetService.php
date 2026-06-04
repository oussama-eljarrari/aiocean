<?php

declare(strict_types=1);

namespace App\Features\PasswordReset;

use App\Features\Users\UserRepositoryInterface;
use App\Shared\EmailService;

final class PasswordResetService
{
    private const TOKEN_BYTES = 64;
    private const EXPIRY_HOURS = 1;

    public function __construct(
        private PasswordResetRepositoryInterface $resetRepository,
        private UserRepositoryInterface $userRepository,
        private EmailService $emailService,
        private string $frontendUrl,
    ) {}

    public function requestReset(string $email): void
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            return;
        }

        $rawToken = bin2hex(random_bytes(self::TOKEN_BYTES));
        $tokenHash = password_hash($rawToken, PASSWORD_DEFAULT);
        $expiresAt = date('c', strtotime('+' . self::EXPIRY_HOURS . ' hour'));

        $id = bin2hex(random_bytes(16));

        $this->resetRepository->markAllAsUsedByUser($user->id);

        $this->resetRepository->create($id, $user->id, $tokenHash, $expiresAt);

        $resetUrl = rtrim($this->frontendUrl, '/') . '/reset-password?token=' . $rawToken;

        $this->emailService->sendPasswordReset($user->email, $user->name, $resetUrl);
    }

    /**
     * @return array{success: true}|array{error: string}
     */
    public function resetPassword(string $token, string $password): array
    {
        if (strlen($password) < 8) {
            return ['error' => 'Password must be at least 8 characters'];
        }

        $userId = $this->findUserIdByToken($token);

        if ($userId === null) {
            return ['error' => 'Invalid or expired reset token'];
        }

        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $this->userRepository->updatePassword($userId, $newHash);

        $this->resetRepository->markAllAsUsedByUser($userId);

        if (session_id() !== '') {
            $_SESSION = [];
            session_destroy();
        }

        return ['success' => true];
    }

    private function findUserIdByToken(string $rawToken): ?string
    {
        $rows = $this->resetRepository->findAllActive();

        foreach ($rows as $row) {
            if (password_verify($rawToken, $row['token_hash'])) {
                return $row['user_id'];
            }
        }

        return null;
    }
}
