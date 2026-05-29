<?php

declare(strict_types=1);

namespace App\Features\Submissions;

use App\Features\Users\UserRepository;
use App\Shared\EmailService;

final class SubmissionService
{
    private const STATUSES = ['pending', 'approved', 'rejected'];

    public function __construct(
        private SubmissionRepository $submissions,
        private UserRepository $users,
        private ?EmailService $emailService = null,
        private string $agentWebhookUrl = '',
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
            return ['error' => 'Status must be approved or rejected', 'status' => 400];
        }

        $submission = $this->submissions->decide($id, $status, trim((string) ($adminNotes ?? '')) ?: null);
        if ($submission === null) {
            return ['error' => 'Submission not found', 'status' => 404];
        }

        $user = $this->users->findById($submission['submitted_by']);
        if ($user !== null) {
            if ($status === 'approved') {
                $this->tryEmail(fn() => $this->emailService?->sendSubmissionApproved($user->email, $user->name, $submission['tool_name']));
            } else {
                $reason = $submission['admin_notes'] ?: 'No reason provided';
                $this->tryEmail(fn() => $this->emailService?->sendSubmissionRejected($user->email, $user->name, $submission['tool_name'], $reason));
            }
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
