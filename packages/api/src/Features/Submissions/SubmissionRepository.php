<?php

declare(strict_types=1);

namespace App\Features\Submissions;

use PDO;

final class SubmissionRepository
{
    public function __construct(private PDO $pdo) {}

    public function createTool(array $data): string
    {
        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO tools (id, name, slug, url, short_description, description, pricing_model, submitted_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'inactive\')
        ');
        $stmt->execute([
            $id,
            $data['name'],
            $this->uniqueSlug($data['name']),
            $data['url'],
            $data['short_description'],
            $data['description'],
            $data['pricing_model'],
            $data['submitted_by'],
        ]);

        if ($data['category_id'] !== null) {
            $stmt = $this->pdo->prepare('INSERT OR IGNORE INTO tool_category (tool_id, category_id) VALUES (?, ?)');
            $stmt->execute([$id, $data['category_id']]);
        }

        return $id;
    }

    public function createSubmission(string $toolId, string $userId): array
    {
        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO submissions (id, tool_id, submitted_by)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$id, $toolId, $userId]);

        return $this->findById($id);
    }

    /** @return array<int, array<string, mixed>> */
    public function findForUser(string $userId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT s.*, t.name AS tool_name, t.status AS tool_status,
                   t.url AS tool_website, t.short_description AS tool_short_description,
                   t.description AS tool_description, t.pricing_model AS tool_pricing,
                   c.name AS tool_category,
                   u.name AS submitter_name, u.email AS submitter_email
            FROM submissions s
            JOIN tools t ON t.id = s.tool_id
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c ON c.id = tc.category_id
            LEFT JOIN users u ON u.id = s.submitted_by
            WHERE s.submitted_by = ?
            ORDER BY s.created_at DESC
        ');
        $stmt->execute([$userId]);

        return array_map(fn(array $row) => $this->format($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /** @return array<int, array<string, mixed>> */
    public function findAll(?string $status = null): array
    {
        $sql = '
            SELECT s.*, t.name AS tool_name, t.status AS tool_status,
                   t.url AS tool_website, t.short_description AS tool_short_description,
                   t.description AS tool_description, t.pricing_model AS tool_pricing,
                   c.name AS tool_category,
                   u.name AS submitter_name, u.email AS submitter_email
            FROM submissions s
            JOIN tools t ON t.id = s.tool_id
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c ON c.id = tc.category_id
            LEFT JOIN users u ON u.id = s.submitted_by
        ';
        $params = [];

        if ($status !== null) {
            $sql .= ' WHERE s.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY s.created_at DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn(array $row) => $this->format($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function decide(string $id, string $status, ?string $adminNotes): ?array
    {
        $submission = $this->findById($id);
        if (!$submission) {
            return null;
        }

        $stmt = $this->pdo->prepare('
            UPDATE submissions
            SET status = ?, admin_notes = ?, updated_at = datetime(\'now\')
            WHERE id = ?
        ');
        $stmt->execute([$status, $adminNotes, $id]);

        if ($status === 'approved') {
            $stmt = $this->pdo->prepare('UPDATE tools SET status = \'active\', updated_at = datetime(\'now\') WHERE id = ?');
            $stmt->execute([$submission['tool_id']]);
        }

        return $this->findById($id);
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT s.*, t.name AS tool_name, t.status AS tool_status,
                   t.url AS tool_website, t.short_description AS tool_short_description,
                   t.description AS tool_description, t.pricing_model AS tool_pricing,
                   c.name AS tool_category,
                   u.name AS submitter_name, u.email AS submitter_email
            FROM submissions s
            JOIN tools t ON t.id = s.tool_id
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c ON c.id = tc.category_id
            LEFT JOIN users u ON u.id = s.submitted_by
            WHERE s.id = ?
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->format($row) : null;
    }

    private function uniqueSlug(string $name): string
    {
        $base = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-')) ?: 'tool';
        $slug = $base;

        while ($this->slugExists($slug)) {
            $slug = $base . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
        }

        return $slug;
    }

    private function slugExists(string $slug): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM tools WHERE slug = ?');
        $stmt->execute([$slug]);

        return (bool) $stmt->fetchColumn();
    }

    private function format(array $row): array
    {
        return [
            'id' => $row['id'],
            'tool_id' => $row['tool_id'],
            'tool_name' => $row['tool_name'],
            'tool_status' => $row['tool_status'],
            'tool_website' => $row['tool_website'] ?? null,
            'tool_short_description' => $row['tool_short_description'] ?? null,
            'tool_description' => $row['tool_description'] ?? null,
            'tool_pricing' => $row['tool_pricing'] ?? null,
            'tool_category' => $row['tool_category'] ?? null,
            'submitted_by' => $row['submitted_by'],
            'submitter_name' => $row['submitter_name'] ?? null,
            'submitter_email' => $row['submitter_email'] ?? null,
            'status' => $row['status'],
            'admin_notes' => $row['admin_notes'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }
}
