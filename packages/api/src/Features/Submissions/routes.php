<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Submissions\SubmissionController;

Router::post('/api/submissions', [SubmissionController::class, 'create']);
Router::post('/api/submissions/{id}/resubmit', [SubmissionController::class, 'resubmit']);
Router::get('/api/submissions/mine', [SubmissionController::class, 'mine']);
Router::get('/api/admin/submissions', [SubmissionController::class, 'adminIndex']);
Router::get('/api/admin/submissions/{id}', [SubmissionController::class, 'show']);
Router::patch('/api/admin/submissions/{id}', [SubmissionController::class, 'decide']);
