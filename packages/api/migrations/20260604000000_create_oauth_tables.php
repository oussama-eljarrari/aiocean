<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateOauthTables extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE IF NOT EXISTS oauth_clients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                secret_hash TEXT,
                redirect_uris TEXT NOT NULL,
                grant_types TEXT NOT NULL DEFAULT '[\"authorization_code\",\"refresh_token\"]',
                scopes TEXT NOT NULL DEFAULT '[]',
                is_confidential INTEGER NOT NULL DEFAULT 0,
                token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE IF NOT EXISTS oauth_scopes (
                identifier TEXT PRIMARY KEY,
                description TEXT NOT NULL DEFAULT ''
            )
        ");

        $this->execute("
            CREATE TABLE IF NOT EXISTS oauth_auth_codes (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
                user_id TEXT,
                redirect_uri TEXT,
                scopes TEXT NOT NULL DEFAULT '[]',
                resource TEXT,
                expires_at TEXT NOT NULL,
                revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE IF NOT EXISTS oauth_access_tokens (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
                user_id TEXT,
                scopes TEXT NOT NULL DEFAULT '[]',
                resource TEXT,
                expires_at TEXT NOT NULL,
                revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ");

        $this->execute("
            CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
                id TEXT PRIMARY KEY,
                access_token_id TEXT NOT NULL REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ");

        $this->execute("CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client ON oauth_auth_codes(client_id)");
        $this->execute("CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_client ON oauth_access_tokens(client_id)");
        $this->execute("CREATE INDEX IF NOT EXISTS idx_oauth_refresh_tokens_access ON oauth_refresh_tokens(access_token_id)");

        $this->execute("
            INSERT OR IGNORE INTO oauth_scopes (identifier, description) VALUES
                ('mcp:user', 'Access MCP tools as a user'),
                ('mcp:admin', 'Access MCP tools with admin privileges')
        ");
    }

    public function down(): void
    {
        $this->execute('DROP TABLE IF EXISTS oauth_refresh_tokens');
        $this->execute('DROP TABLE IF EXISTS oauth_access_tokens');
        $this->execute('DROP TABLE IF EXISTS oauth_auth_codes');
        $this->execute('DROP TABLE IF EXISTS oauth_scopes');
        $this->execute('DROP TABLE IF EXISTS oauth_clients');
    }
}
