<?php

declare(strict_types=1);

namespace App\Features\Agent;

use App\Features\Submissions\SubmissionService;
use App\Features\Settings\SettingsRepository;

final class AgentService
{
    private const VALID_STATUSES = ['running', 'completed', 'failed'];

    public function __construct(
        private AgentRepository $agent,
        private SubmissionService $submissions,
        private SettingsRepository $settings,
    ) {}

    public function create(string $submissionId, ?string $toolSnapshot = null): array
    {
        return $this->agent->create($submissionId, $toolSnapshot);
    }

    public function updateStatus(string $id, string $status): array
    {
        if (!in_array($status, self::VALID_STATUSES, true)) {
            return ['error' => 'Status must be running, completed, or failed', 'status' => 400];
        }
        $this->agent->updateStatus($id, $status);
        $job = $this->agent->findById($id);
        return $job ? ['agent_job' => $job] : ['error' => 'Agent job not found', 'status' => 404];
    }

    public function updateTodo(string $id, array $todos): array
    {
        $this->agent->updateTodo($id, json_encode($todos));
        $job = $this->agent->findById($id);
        return $job ? ['agent_job' => $job] : ['error' => 'Agent job not found', 'status' => 404];
    }

    public function updateMessages(string $id, array $messages): array
    {
        $this->agent->updateMessages($id, json_encode($messages));
        return ['status' => 'ok'];
    }

    public function saveReport(string $id, string $report, ?array $structuredData = null): array
    {
        $structuredDataJson = $structuredData !== null ? json_encode($structuredData) : null;
        $this->agent->updateReport($id, $report, $structuredDataJson);
        $job = $this->agent->findById($id);

        if ($job !== null && $structuredData !== null) {
            $autoDecide = $this->settings->get('agent_auto_request_changes', 'false') === 'true';
            if ($autoDecide) {
                $requiresChanges = (bool) ($structuredData['requires_changes'] ?? false);
                $feedback = trim((string) ($structuredData['feedback'] ?? ''));

                if ($requiresChanges && $feedback !== '') {
                    $this->submissions->decide($job['submission_id'], 'changes_requested', $feedback);
                }
            }
        }
        return $job ? ['agent_job' => $job] : ['error' => 'Agent job not found', 'status' => 404];
    }

    public function findBySubmissionId(string $submissionId): array
    {
        $job = $this->agent->findBySubmissionId($submissionId);

        if ($job === null) {
            return ['error' => 'No agent job found for this submission', 'status' => 404];
        }

        return ['agent_job' => $job];
    }

    public function findAllBySubmissionId(string $submissionId): array
    {
        return ['agent_runs' => $this->agent->findAllBySubmissionId($submissionId)];
    }
}
