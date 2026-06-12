<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSettingsAndStructuredData extends AbstractMigration
{
    public function up(): void
    {
        // 1. Add structured_data to agent_jobs
        $this->execute("ALTER TABLE agent_jobs ADD COLUMN structured_data JSON DEFAULT NULL");

        // 2. Create settings table
        $this->execute("
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ");

        // 3. Seed default settings
        $this->execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('agent_auto_request_changes', 'false')");
    }

    public function down(): void
    {
        // Drop settings table
        $this->execute("DROP TABLE IF EXISTS settings");

        // Recreate agent_jobs without structured_data
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
                tool_snapshot JSON DEFAULT NULL
            )
        ");
        $this->execute("INSERT INTO agent_jobs (id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at, tool_snapshot) SELECT id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at, tool_snapshot FROM agent_jobs_old");
        $this->execute("DROP TABLE agent_jobs_old");
        $this->execute("PRAGMA foreign_keys = ON");
    }
}
