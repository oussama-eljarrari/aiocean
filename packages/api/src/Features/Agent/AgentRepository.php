<?php

declare(strict_types=1);

namespace App\Features\Agent;

use PDO;

final class AgentRepository
{
    public function __construct(private PDO $pdo) {}

    public function create(string $submissionId): array
    {
        $id = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare('
            INSERT INTO agent_jobs (id, submission_id)
            VALUES (?, ?)
        ');
        $stmt->execute([$id, $submissionId]);

        return $this->findById($id);
    }

    public function updateStatus(string $id, string $status): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE agent_jobs
            SET status = ?, updated_at = datetime(\'now\')
            WHERE id = ?
        ');
        $stmt->execute([$status, $id]);
    }

    public function updateTodo(string $id, string $todoJson): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE agent_jobs
            SET todo_list = ?, updated_at = datetime(\'now\')
            WHERE id = ?
        ');
        $stmt->execute([$todoJson, $id]);
    }

    public function updateMessages(string $id, string $messagesJson): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE agent_jobs
            SET messages = ?, updated_at = datetime(\'now\')
            WHERE id = ?
        ');
        $stmt->execute([$messagesJson, $id]);
    }

    public function updateReport(string $id, string $report): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE agent_jobs
            SET report = ?, status = \'completed\', completed_at = datetime(\'now\'), updated_at = datetime(\'now\')
            WHERE id = ?
        ');
        $stmt->execute([$report, $id]);
    }

    public function findBySubmissionId(string $submissionId): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT * FROM agent_jobs WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1
        ');
        $stmt->execute([$submissionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->format($row) : null;
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM agent_jobs WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->format($row) : null;
    }

    private function format(array $row): array
    {
        return [
            'id' => $row['id'],
            'submission_id' => $row['submission_id'],
            'status' => $row['status'],
            'messages' => $row['messages'] ? json_decode($row['messages'], true) : null,
            'todo_list' => $row['todo_list'] ? json_decode($row['todo_list'], true) : null,
            'report' => $row['report'],
            'started_at' => $row['started_at'],
            'completed_at' => $row['completed_at'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }
}
