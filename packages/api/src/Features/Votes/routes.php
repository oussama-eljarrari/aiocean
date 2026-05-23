<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Votes\VoteController;

Router::post('/api/tools/{toolId}/vote', [VoteController::class, 'toggle']);
