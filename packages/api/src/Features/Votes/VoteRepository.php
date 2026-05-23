<?php

declare(strict_types=1);

namespace App\Features\Votes;

use PDO;

final class VoteRepository
{
    public function __construct(private PDO $pdo) {}

    public function toggle(string $toolId, string $userId): bool
    {
        if ($this->exists($toolId, $userId)) {
            $stmt = $this->pdo->prepare('DELETE FROM votes WHERE tool_id = ? AND user_id = ?');
            $stmt->execute([$toolId, $userId]);

            return false;
        }

        $stmt = $this->pdo->prepare('INSERT INTO votes (id, tool_id, user_id) VALUES (?, ?, ?)');
        $stmt->execute([bin2hex(random_bytes(16)), $toolId, $userId]);

        return true;
    }

    public function countForTool(string $toolId): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM votes WHERE tool_id = ?');
        $stmt->execute([$toolId]);

        return (int) $stmt->fetchColumn();
    }

    private function exists(string $toolId, string $userId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM votes WHERE tool_id = ? AND user_id = ?');
        $stmt->execute([$toolId, $userId]);

        return (bool) $stmt->fetchColumn();
    }
}
