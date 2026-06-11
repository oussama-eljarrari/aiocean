<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Clicks\ClickController;

Router::post('/api/tools/{toolId}/click', [ClickController::class, 'record']);
