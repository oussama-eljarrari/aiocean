<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateAgentJobsTable extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE agent_jobs (
                id TEXT PRIMARY KEY,
                submission_id TEXT NOT NULL REFERENCES submissions(id),
                status TEXT NOT NULL DEFAULT 'running'
                    CHECK(status IN ('running','completed','failed')),
                messages JSON,
                todo_list JSON,
                report TEXT,
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS agent_jobs');
    }
}
