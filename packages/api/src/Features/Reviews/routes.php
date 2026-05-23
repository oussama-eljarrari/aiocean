<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Reviews\ReviewController;

Router::get('/api/tools/{toolId}/reviews', [ReviewController::class, 'index']);
Router::post('/api/tools/{toolId}/reviews', [ReviewController::class, 'upsert']);
