<?php

declare(strict_types=1);
namespace App\Features\PasswordReset;

use App\Core\Router;

Router::post('/api/forgot-password', [PasswordResetController::class, 'request']);
Router::post('/api/reset-password',  [PasswordResetController::class, 'reset']);
