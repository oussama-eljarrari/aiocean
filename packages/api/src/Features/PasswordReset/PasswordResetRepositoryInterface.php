<?php

declare(strict_types=1);

namespace App\Features\PasswordReset;

interface PasswordResetRepositoryInterface
{
    public function create(string $id, string $userId, string $tokenHash, string $expiresAt): void;

    /** @return array[] */
    public function findActiveByUserId(string $userId): array;

    /** @return array[] */
    public function findAllActive(): array;

    public function markAsUsed(string $id): void;

    public function markAllAsUsedByUser(string $userId): void;

    public function deleteExpired(): void;
}
