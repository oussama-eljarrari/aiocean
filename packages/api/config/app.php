<?php

declare(strict_types=1);

/**
 * Application configuration.
 *
 * Reads from .env file if present, falls back to sensible defaults.
 */

// Load .env if it exists
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

return [
    'env'         => $_ENV['APP_ENV']     ?? 'development',
    'debug'       => ($_ENV['APP_DEBUG']  ?? 'true') === 'true',
    'cors_origin' => $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173',

    'db' => [
        'driver' => ($_ENV['DB_DRIVER'] ?? '') ?: 'sqlite',
        'path'   => ($_ENV['DB_PATH'] ?? '') ?: dirname(__DIR__) . '/database.sqlite',
    ],

    'email' => [
        'api_key' => $_ENV['RESEND_API_KEY'] ?? '',
        'from'    => $_ENV['RESEND_FROM']    ?? 'AI Ocean <noreply@aiocean.dev>',
    ],

    'agent_webhook_url' => $_ENV['AGENT_WEBHOOK_URL'] ?? 'http://localhost:3001/api/agent/review',

    'producthunt' => [
        'client_id'     => $_ENV['PRODUCTHUNT_CLIENT_ID']     ?? '',
        'client_secret' => $_ENV['PRODUCTHUNT_CLIENT_SECRET'] ?? '',
    ],

    'oauth' => [
        'issuer'                 => $_ENV['OAUTH_ISSUER']             ?? 'http://localhost:8080',
        'frontend_url'           => $_ENV['FRONTEND_URL']             ?? 'http://localhost:5173',
        'resource_server'        => $_ENV['OAUTH_RESOURCE_SERVER']    ?? 'http://localhost:3001/mcp',
        'private_key_path'       => $_ENV['OAUTH_PRIVATE_KEY_PATH']   ?? dirname(__DIR__) . '/storage/oauth/private.key',
        'public_key_path'        => $_ENV['OAUTH_PUBLIC_KEY_PATH']    ?? dirname(__DIR__) . '/storage/oauth/public.key',
        'encryption_key'         => $_ENV['OAUTH_ENCRYPTION_KEY']     ?? 'dev-encryption-key-please-change-32',
        'auth_code_ttl'          => $_ENV['OAUTH_AUTH_CODE_TTL']      ?? 'PT10M',
        'access_token_ttl'       => $_ENV['OAUTH_ACCESS_TOKEN_TTL']   ?? 'PT1H',
        'refresh_token_ttl'      => $_ENV['OAUTH_REFRESH_TOKEN_TTL']  ?? 'P1M',
        'default_scope'          => $_ENV['OAUTH_DEFAULT_SCOPE']      ?? 'mcp:user',
        'auto_approve'           => ($_ENV['OAUTH_AUTO_APPROVE']      ?? 'true') === 'true',
        'internal_shared_secret' => $_ENV['INTERNAL_SHARED_SECRET']   ?? '',
    ],
];
