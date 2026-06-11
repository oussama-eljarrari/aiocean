<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\OAuth\OAuthController;

Router::get('/.well-known/oauth-authorization-server', [OAuthController::class, 'metadata']);
Router::post('/register', [OAuthController::class, 'register']);
// Cloudflare WAF bypass route
Router::post('/api/oauth/register', [OAuthController::class, 'register']);
Router::post('/token', [OAuthController::class, 'token']);

Router::get('/api/oauth/authorize-info', [OAuthController::class, 'authorizeInfo']);
Router::post('/api/oauth/consent', [OAuthController::class, 'consent']);
