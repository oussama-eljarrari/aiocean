<?php

declare(strict_types=1);

namespace App\Features\Clicks;

use PDO;

final class ClickRepository
{
    public function __construct(private PDO $pdo) {}

    public function record(string $toolId, string $userId): void
    {
        $stmt = $this->pdo->prepare('
            INSERT OR IGNORE INTO tool_clicks (id, tool_id, user_id)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([bin2hex(random_bytes(16)), $toolId, $userId]);
    }

    public function countForTool(string $toolId): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM tool_clicks WHERE tool_id = ?');
        $stmt->execute([$toolId]);

        return (int) $stmt->fetchColumn();
    }
}
