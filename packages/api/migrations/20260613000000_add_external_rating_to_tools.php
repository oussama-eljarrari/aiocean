<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddExternalRatingToTools extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE tools ADD COLUMN external_rating REAL DEFAULT NULL");
        $this->execute("ALTER TABLE tools ADD COLUMN external_rating_count INTEGER DEFAULT NULL");
        $this->execute("ALTER TABLE tools ADD COLUMN external_rating_source TEXT DEFAULT NULL");
        $this->execute("ALTER TABLE tools ADD COLUMN producthunt_slug TEXT DEFAULT NULL");
    }

    public function down(): void
    {
        // Requires SQLite 3.35+ (DROP COLUMN support)
        $this->execute("ALTER TABLE tools DROP COLUMN external_rating");
        $this->execute("ALTER TABLE tools DROP COLUMN external_rating_count");
        $this->execute("ALTER TABLE tools DROP COLUMN external_rating_source");
        $this->execute("ALTER TABLE tools DROP COLUMN producthunt_slug");
    }
}
