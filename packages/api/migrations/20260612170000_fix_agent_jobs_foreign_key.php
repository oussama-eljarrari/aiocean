<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FixAgentJobsForeignKey extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("PRAGMA foreign_keys = OFF");
        
        $this->execute("ALTER TABLE agent_jobs RENAME TO agent_jobs_old");
        
        $this->execute("
            CREATE TABLE agent_jobs (
                id TEXT PRIMARY KEY,
                submission_id TEXT NOT NULL REFERENCES submissions(id),
                status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),
                messages JSON,
                todo_list JSON,
                report TEXT,
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                tool_snapshot JSON DEFAULT NULL,
                structured_data JSON DEFAULT NULL
            )
        ");
        
        // Check if there are any columns from previous migrations to copy safely
        $this->execute("
            INSERT INTO agent_jobs (
                id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at, tool_snapshot, structured_data
            ) SELECT 
                id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at, tool_snapshot, structured_data 
            FROM agent_jobs_old
        ");
        
        $this->execute("DROP TABLE agent_jobs_old");
        
        $this->execute("PRAGMA foreign_keys = ON");
    }

    public function down(): void
    {
        // POINTING TO "submissions" IS THE CORRECT STATE, SO NO-OP FOR DOWN
    }
}
