<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Agent\AgentController;

// Agent internal endpoints (called by the Node agent service)
Router::post('/api/agent/runs', [AgentController::class, 'createRun']);
Router::patch('/api/agent/runs/{id}/status', [AgentController::class, 'updateStatus']);
Router::patch('/api/agent/runs/{id}/todo', [AgentController::class, 'updateTodo']);
Router::patch('/api/agent/runs/{id}/messages', [AgentController::class, 'updateMessages']);
Router::patch('/api/agent/runs/{id}/report', [AgentController::class, 'saveReport']);

// Admin endpoint
Router::get('/api/admin/agent/runs/{submissionId}', [AgentController::class, 'showForSubmission']);
