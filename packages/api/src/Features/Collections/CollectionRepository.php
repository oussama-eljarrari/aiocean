<?php

declare(strict_types=1);

namespace App\Features\Collections;

use PDO;

final class CollectionRepository
{
    public function __construct(private PDO $pdo) {}

    /** @return array<int, array<string, mixed>> */
    public function findForUser(string $userId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT c.*,
                   COUNT(ct.tool_id) AS tool_count
            FROM collections c
            LEFT JOIN collection_tools ct ON ct.collection_id = c.id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ');
        $stmt->execute([$userId]);

        return array_map(fn(array $row) => $this->format($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create(string $userId, string $name, bool $isPublic): array
    {
        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO collections (id, user_id, name, is_public)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$id, $userId, $name, $isPublic ? 1 : 0]);

        return $this->findOwned($id, $userId);
    }

    public function update(string $id, string $userId, ?string $name, ?bool $isPublic): ?array
    {
        if (!$this->isOwnedBy($id, $userId)) {
            return null;
        }

        if ($name !== null) {
            $stmt = $this->pdo->prepare('UPDATE collections SET name = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$name, $id, $userId]);
        }

        if ($isPublic !== null) {
            $stmt = $this->pdo->prepare('UPDATE collections SET is_public = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$isPublic ? 1 : 0, $id, $userId]);
        }

        return $this->findOwned($id, $userId);
    }

    public function delete(string $id, string $userId): bool
    {
        if (!$this->isOwnedBy($id, $userId)) {
            return false;
        }

        $stmt = $this->pdo->prepare('DELETE FROM collection_tools WHERE collection_id = ?');
        $stmt->execute([$id]);

        $stmt = $this->pdo->prepare('DELETE FROM collections WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);

        return true;
    }

    public function addTool(string $collectionId, string $userId, string $toolId): ?array
    {
        if (!$this->isOwnedBy($collectionId, $userId)) {
            return null;
        }

        $stmt = $this->pdo->prepare('
            INSERT OR IGNORE INTO collection_tools (collection_id, tool_id)
            VALUES (?, ?)
        ');
        $stmt->execute([$collectionId, $toolId]);

        return $this->findOwned($collectionId, $userId);
    }

    public function removeTool(string $collectionId, string $userId, string $toolId): ?array
    {
        if (!$this->isOwnedBy($collectionId, $userId)) {
            return null;
        }

        $stmt = $this->pdo->prepare('DELETE FROM collection_tools WHERE collection_id = ? AND tool_id = ?');
        $stmt->execute([$collectionId, $toolId]);

        return $this->findOwned($collectionId, $userId);
    }

    /** @return array<int, array<string, mixed>> */
    public function findTools(string $collectionId, string $userId): array
    {
        if (!$this->isOwnedBy($collectionId, $userId)) {
            return [];
        }

        $stmt = $this->pdo->prepare("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id) AS review_count,
                   COUNT(DISTINCT v.id) AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            JOIN collection_tools ct ON ct.tool_id = t.id
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c ON c.id = tc.category_id
            LEFT JOIN reviews r ON r.tool_id = t.id
            LEFT JOIN votes v ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl ON tcl.tool_id = t.id
            WHERE ct.collection_id = ?
            GROUP BY t.id
            ORDER BY t.name
        ");
        $stmt->execute([$collectionId]);

        return array_map(fn(array $row) => $this->formatTool($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function formatTool(array $row): array
    {
        $cats = $row['categories'] ?? '';
        $category = $cats ? explode(',', $cats)[0] : '';

        return [
            'id'            => $row['id'],
            'name'          => $row['name'],
            'logo'          => $row['logo_url'] ?? '',
            'tagline'       => $row['short_description'] ?? '',
            'category'      => $category,
            'pricing'       => $row['pricing_model'] ?? '',
            'platform'      => 'Web',
            'usageCount'    => (int) ($row['click_count'] ?? $row['usage_count'] ?? 0),
            'rating'        => round((float) ($row['avg_rating'] ?? 0), 1),
            'reviewCount'   => (int) ($row['review_count'] ?? 0),
            'voteCount'     => (int) ($row['vote_count'] ?? 0),
            'primaryUseCase'=> '',
            'url'           => $row['url'] ?? null,
            'description'   => $row['description'] ?? null,
            'status'        => $row['status'] ?? 'inactive',
        ];
    }

    private function isOwnedBy(string $id, string $userId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM collections WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);

        return (bool) $stmt->fetchColumn();
    }

    private function findOwned(string $id, string $userId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT c.*,
                   COUNT(ct.tool_id) AS tool_count
            FROM collections c
            LEFT JOIN collection_tools ct ON ct.collection_id = c.id
            WHERE c.id = ? AND c.user_id = ?
            GROUP BY c.id
        ');
        $stmt->execute([$id, $userId]);

        return $this->format($stmt->fetch(PDO::FETCH_ASSOC));
    }

    private function format(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'is_public' => (bool) $row['is_public'],
            'tool_count' => (int) ($row['tool_count'] ?? 0),
            'created_at' => $row['created_at'],
        ];
    }
}
