<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRevalidationLoop extends AbstractMigration
{
    public function up(): void
    {
        // 1. Add tool_snapshot to agent_jobs
        $this->execute("ALTER TABLE agent_jobs ADD COLUMN tool_snapshot JSON DEFAULT NULL");

        // 2. Recreate submissions table to update check constraint
        $this->execute("PRAGMA foreign_keys = OFF");
        
        $this->execute("ALTER TABLE submissions RENAME TO submissions_old");
        
        $this->execute("
            CREATE TABLE submissions (
                id TEXT PRIMARY KEY,
                tool_id TEXT NOT NULL REFERENCES tools(id),
                submitted_by TEXT NOT NULL REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','changes_requested')),
                admin_notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");
        
        $this->execute("INSERT INTO submissions (id, tool_id, submitted_by, status, admin_notes, created_at, updated_at) SELECT id, tool_id, submitted_by, status, admin_notes, created_at, updated_at FROM submissions_old");
        
        $this->execute("DROP TABLE submissions_old");
        
        $this->execute("PRAGMA foreign_keys = ON");
    }

    public function down(): void
    {
        // Revert columns/tables
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
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");
        $this->execute("INSERT INTO agent_jobs (id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at) SELECT id, submission_id, status, messages, todo_list, report, started_at, completed_at, created_at, updated_at FROM agent_jobs_old");
        $this->execute("DROP TABLE agent_jobs_old");

        // Revert submissions status constraint
        $this->execute("ALTER TABLE submissions RENAME TO submissions_old");
        $this->execute("
            CREATE TABLE submissions (
                id TEXT PRIMARY KEY,
                tool_id TEXT NOT NULL REFERENCES tools(id),
                submitted_by TEXT NOT NULL REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
                admin_notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        ");
        $this->execute("INSERT INTO submissions (id, tool_id, submitted_by, status, admin_notes, created_at, updated_at) SELECT id, tool_id, submitted_by, status, admin_notes, created_at, updated_at FROM submissions_old");
        $this->execute("DROP TABLE submissions_old");
        
        $this->execute("PRAGMA foreign_keys = ON");
    }
}
