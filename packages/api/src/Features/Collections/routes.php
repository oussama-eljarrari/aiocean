<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Collections\CollectionController;

Router::get('/api/collections', [CollectionController::class, 'index']);
Router::post('/api/collections', [CollectionController::class, 'create']);
Router::patch('/api/collections/{id}', [CollectionController::class, 'update']);
Router::delete('/api/collections/{id}', [CollectionController::class, 'delete']);
Router::post('/api/collections/{id}/tools', [CollectionController::class, 'addTool']);
Router::delete('/api/collections/{id}/tools', [CollectionController::class, 'removeTool']);
