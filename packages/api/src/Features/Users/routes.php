<?php

declare(strict_types=1);
namespace App\Features\Users;

use App\Core\Router;

Router::post('/api/register', [UserController::class, 'register']);
Router::post('/api/login',    [UserController::class, 'login']);
Router::post('/api/logout',   [UserController::class, 'logout']);
Router::get('/api/me',        [UserController::class, 'me']);
Router::patch('/api/me', [UserController::class, 'updateMe']);