<?php

declare(strict_types=1);

namespace App\Features\Reviews;

use PDO;

final class ReviewRepository
{
    public function __construct(private PDO $pdo) {}

    /** @return array<int, array<string, mixed>> */
    public function findForTool(string $toolId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT r.*, u.name AS author_name, u.pfp_url AS author_pfp_url
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.tool_id = ?
            ORDER BY r.updated_at DESC
        ');
        $stmt->execute([$toolId]);

        return array_map(fn(array $row) => $this->format($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function upsert(string $toolId, string $userId, int $rating, string $comment): array
    {
        $existing = $this->findRawForUser($toolId, $userId);

        if ($existing !== null) {
            $stmt = $this->pdo->prepare('
                UPDATE reviews
                SET rating = ?, comment = ?, updated_at = datetime(\'now\')
                WHERE tool_id = ? AND user_id = ?
            ');
            $stmt->execute([$rating, $comment, $toolId, $userId]);

            return $this->findById($existing['id']);
        }

        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO reviews (id, tool_id, user_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$id, $toolId, $userId, $rating, $comment]);

        return $this->findById($id);
    }

    private function findById(string $id): array
    {
        $stmt = $this->pdo->prepare('
            SELECT r.*, u.name AS author_name, u.pfp_url AS author_pfp_url
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.id = ?
        ');
        $stmt->execute([$id]);

        return $this->format($stmt->fetch(PDO::FETCH_ASSOC));
    }

    private function findRawForUser(string $toolId, string $userId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM reviews WHERE tool_id = ? AND user_id = ?');
        $stmt->execute([$toolId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function format(array $row): array
    {
        return [
            'id' => $row['id'],
            'tool_id' => $row['tool_id'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'author' => [
                'id' => $row['user_id'],
                'name' => $row['author_name'],
                'pfp_url' => $row['author_pfp_url'] ?? null,
            ],
        ];
    }
}
