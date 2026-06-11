<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateToolClicksTable extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE IF NOT EXISTS tool_clicks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, tool_id)
            )
        ");

        $this->execute("
            CREATE INDEX IF NOT EXISTS idx_tool_clicks_tool_id
            ON tool_clicks(tool_id)
        ");
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS tool_clicks');
    }
}
