<?php

declare(strict_types=1);

namespace App\Features\Settings;

use PDO;

final class SettingsRepository
{
    public function __construct(private PDO $pdo) {}

    public function get(string $key, string $default = ''): string
    {
        $stmt = $this->pdo->prepare('SELECT value FROM settings WHERE key = ?');
        $stmt->execute([$key]);
        $val = $stmt->fetchColumn();
        return $val !== false ? (string) $val : $default;
    }

    public function set(string $key, string $value): void
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        ');
        $stmt->execute([$key, $value]);
    }

    public function getAll(): array
    {
        $stmt = $this->pdo->query('SELECT key, value FROM settings');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }
        return $settings;
    }
}
