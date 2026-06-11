<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddClientMetadata extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE oauth_clients ADD COLUMN client_uri TEXT");
        $this->execute("ALTER TABLE oauth_clients ADD COLUMN logo_uri TEXT");
    }

    public function down(): void
    {
        // SQLite does not support DROP COLUMN
    }
}
