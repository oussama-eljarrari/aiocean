<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\OAuth\LoginController;
use App\Features\OAuth\OAuthController;

Router::get('/.well-known/oauth-authorization-server', [OAuthController::class, 'metadata']);
Router::get('/register', [OAuthController::class, 'registerForm']);
Router::post('/register', [OAuthController::class, 'register']);
// just for cloudflare , their WAF is blocking /register route for some reason 
Router::post('/api/oauth/register', [OAuthController::class, 'register']);
Router::get('/api/oauth/register', [OAuthController::class, 'registerForm']);
Router::get('/authorize', [OAuthController::class, 'authorize']);
Router::post('/authorize', [OAuthController::class, 'authorize']);
Router::post('/token', [OAuthController::class, 'token']);

Router::get('/api/oauth/authorize-info', [OAuthController::class, 'authorizeInfo']);
Router::post('/api/oauth/consent', [OAuthController::class, 'consent']);

Router::get('/login', [LoginController::class, 'form']);
Router::post('/login', [LoginController::class, 'submit']);
Router::get('/logout', [LoginController::class, 'logout']);
