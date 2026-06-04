<?php

declare(strict_types=1);

namespace App\Features\PasswordReset;

use PDO;

final class PasswordResetRepository implements PasswordResetRepositoryInterface
{
    public function __construct(private PDO $pdo) {}

    public function create(string $id, string $userId, string $tokenHash, string $expiresAt): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$id, $userId, $tokenHash, $expiresAt]);
    }

    public function findActiveByUserId(string $userId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM password_resets
             WHERE user_id = ? AND used_at IS NULL AND expires_at > datetime('now')"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findAllActive(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT pr.*, u.id AS user_id
             FROM password_resets pr
             JOIN users u ON u.id = pr.user_id
             WHERE pr.used_at IS NULL AND pr.expires_at > datetime('now')"
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsUsed(string $id): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE password_resets SET used_at = datetime('now') WHERE id = ?"
        );
        $stmt->execute([$id]);
    }

    public function markAllAsUsedByUser(string $userId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE password_resets SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL"
        );
        $stmt->execute([$userId]);
    }

    public function deleteExpired(): void
    {
        $this->pdo->exec("DELETE FROM password_resets WHERE expires_at <= datetime('now')");
    }
}
