<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRevisionTrackingToSubmissions extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE submissions ADD COLUMN revision_count INTEGER NOT NULL DEFAULT 0");
        $this->execute("ALTER TABLE submissions ADD COLUMN max_revisions INTEGER NOT NULL DEFAULT 3");
    }

    public function down(): void
    {
        // SQLite doesn't support DROP COLUMN in older versions
        // Recreate table without the columns
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

        $this->execute("
            INSERT INTO submissions (id, tool_id, submitted_by, status, admin_notes, created_at, updated_at)
            SELECT id, tool_id, submitted_by, status, admin_notes, created_at, updated_at
            FROM submissions_old
        ");

        $this->execute("DROP TABLE submissions_old");

        $this->execute("PRAGMA foreign_keys = ON");
    }
}
