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
];
