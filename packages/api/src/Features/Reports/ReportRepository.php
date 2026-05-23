<?php

declare(strict_types=1);

namespace App\Features\Reports;

use PDO;

final class ReportRepository
{
    public function __construct(private PDO $pdo) {}

    public function create(string $toolId, string $userId, string $reason, ?string $note): array
    {
        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO reports (id, tool_id, user_id, reason, note)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$id, $toolId, $userId, $reason, $note]);

        return $this->findById($id);
    }

    private function findById(string $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM reports WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'id' => $row['id'],
            'tool_id' => $row['tool_id'],
            'user_id' => $row['user_id'],
            'reason' => $row['reason'],
            'note' => $row['note'],
            'created_at' => $row['created_at'],
        ];
    }
}
