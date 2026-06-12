<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Settings\SettingsController;

Router::get('/api/admin/settings', [SettingsController::class, 'index']);
Router::post('/api/admin/settings', [SettingsController::class, 'update']);
