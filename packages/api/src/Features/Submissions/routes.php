<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Submissions\SubmissionController;

Router::post('/api/submissions', [SubmissionController::class, 'create']);
Router::get('/api/submissions/mine', [SubmissionController::class, 'mine']);
Router::get('/api/admin/submissions', [SubmissionController::class, 'adminIndex']);
Router::patch('/api/admin/submissions/{id}', [SubmissionController::class, 'decide']);
