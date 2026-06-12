<?php

declare(strict_types=1);

namespace App\Features\Submissions;

use App\Features\Users\UserRepository;
use App\Shared\EmailService;

final class SubmissionService
{
    private const STATUSES = ['pending', 'approved', 'rejected', 'changes_requested'];

    public function __construct(
        private SubmissionRepository $submissions,
        private UserRepository $users,
        private ?EmailService $emailService = null,
        private string $agentWebhookUrl = '',
        private string $frontendUrl = 'http://localhost:5173',
    ) {}

    /** @return array{submission?: array, error?: string, status?: int} */
    public function submit(string $userId, array $body): array
    {
        $name = trim((string) ($body['name'] ?? ''));
        $shortDescription = trim((string) ($body['short_description'] ?? ''));

        if ($name === '' || $shortDescription === '') {
            return ['error' => 'Name and short_description are required', 'status' => 400];
        }

        $toolId = $this->submissions->createTool([
            'name' => $name,
            'url' => $body['url'] ?? null,
            'short_description' => $shortDescription,
            'description' => $body['description'] ?? null,
            'pricing_model' => $body['pricing_model'] ?? null,
            'category_id' => $body['category_id'] ?? null,
            'submitted_by' => $userId,
        ]);
        $submission = $this->submissions->createSubmission($toolId, $userId);

        $this->fireAgentWebhook($submission['id'], [
            'name' => $name,
            'url' => $body['url'] ?? null,
            'short_description' => $shortDescription,
            'description' => $body['description'] ?? null,
            'pricing_model' => $body['pricing_model'] ?? null,
        ]);

        $user = $this->users->findById($userId);
        if ($user !== null) {
            $this->tryEmail(fn() => $this->emailService?->sendSubmissionReceived($user->email, $user->name, $name));
        }

        return ['submission' => $submission];
    }

    public function listMine(string $userId): array
    {
        return $this->submissions->findForUser($userId);
    }

    public function listAdmin(?string $status): array
    {
        return $this->submissions->findAll($status ?: null);
    }

    /** @return array{submission?: array, error?: string, status?: int} */
    public function decide(string $id, mixed $status, mixed $adminNotes): array
    {
        $status = (string) $status;
        if (!in_array($status, self::STATUSES, true) || $status === 'pending') {
            return ['error' => 'Status must be approved, rejected, or changes_requested', 'status' => 400];
        }

        if ($status === 'changes_requested') {
            $submission = $this->submissions->findById($id);
            if ($submission === null) {
                return ['error' => 'Submission not found', 'status' => 404];
            }
            if ($submission['revision_count'] >= $submission['max_revisions']) {
                return ['error' => 'Maximum revisions (' . $submission['max_revisions'] . ' rounds) reached. You must make a final decision (Approve or Reject).', 'status' => 400];
            }
        }

        $submission = $this->submissions->decide($id, $status, trim((string) ($adminNotes ?? '')) ?: null);
        if ($submission === null) {
            return ['error' => 'Submission not found', 'status' => 404];
        }

        $user = $this->users->findById($submission['submitted_by']);
        if ($user !== null) {
            if ($status === 'approved') {
                $this->tryEmail(fn() => $this->emailService?->sendSubmissionApproved($user->email, $user->name, $submission['tool_name']));
            } elseif ($status === 'rejected') {
                $reason = $submission['admin_notes'] ?: 'No reason provided';
                $this->tryEmail(fn() => $this->emailService?->sendSubmissionRejected($user->email, $user->name, $submission['tool_name'], $reason));
            } elseif ($status === 'changes_requested') {
                $reason = $submission['admin_notes'] ?: 'No reason provided';
                $prefilledUrl = rtrim($this->frontendUrl, '/') . '/submit?id=' . $id;
                $this->tryEmail(fn() => $this->emailService?->sendChangesRequested($user->email, $user->name, $submission['tool_name'], $reason, $prefilledUrl));
            }
        }

        return ['submission' => $submission];
    }

    /** @return array{submission?: array, error?: string, status?: int} */
    public function resubmit(string $submissionId, string $userId, array $body): array
    {
        $submission = $this->submissions->findById($submissionId);
        if ($submission === null) {
            return ['error' => 'Submission not found', 'status' => 404];
        }

        if ($submission['submitted_by'] !== $userId) {
            return ['error' => 'Forbidden', 'status' => 403];
        }

        if ($submission['status'] !== 'changes_requested') {
            return ['error' => 'Submission does not require changes', 'status' => 400];
        }

        $name = trim((string) ($body['name'] ?? ''));
        $shortDescription = trim((string) ($body['short_description'] ?? ''));

        if ($name === '' || $shortDescription === '') {
            return ['error' => 'Name and short_description are required', 'status' => 400];
        }

        $toolData = [
            'name' => $name,
            'url' => $body['url'] ?? null,
            'short_description' => $shortDescription,
            'description' => $body['description'] ?? null,
            'pricing_model' => $body['pricing_model'] ?? null,
            'category_id' => $body['category_id'] ?? null,
        ];

        $this->submissions->resubmit($submissionId, $submission['tool_id'], $toolData);

        // Re-fire agent webhook
        $this->fireAgentWebhook($submissionId, [
            'name' => $name,
            'url' => $body['url'] ?? null,
            'short_description' => $shortDescription,
            'description' => $body['description'] ?? null,
            'pricing_model' => $body['pricing_model'] ?? null,
        ]);

        $updatedSubmission = $this->submissions->findById($submissionId);
        return ['submission' => $updatedSubmission];
    }

    public function getSingleAdmin(string $id): array
    {
        $submission = $this->submissions->findById($id);
        if ($submission === null) {
            return ['error' => 'Submission not found', 'status' => 404];
        }
        return ['submission' => $submission];
    }

    private function fireAgentWebhook(string $submissionId, array $toolData = []): void
    {
        if ($this->agentWebhookUrl === '') {
            return;
        }

        try {
            $payload = array_merge(['submission_id' => $submissionId], $toolData);
            $ctx = stream_context_create([
                'http' => [
                    'method'  => 'POST',
                    'header'  => 'Content-Type: application/json',
                    'content' => json_encode($payload),
                    'timeout' => 5,
                ],
            ]);
            @file_get_contents($this->agentWebhookUrl, false, $ctx);
        } catch (\Throwable) {
            // Fire-and-forget; do not block the submission flow.
        }
    }

    private function tryEmail(callable $send): void
    {
        try {
            $send();
        } catch (\Throwable) {
            // Email is a side effect; do not fail the core submission workflow.
        }
    }
}
