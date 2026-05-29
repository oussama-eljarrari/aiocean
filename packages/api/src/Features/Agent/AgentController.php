<?php

declare(strict_types=1);

namespace App\Features\Agent;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class AgentController extends BaseController
{
    public function __construct(
        private AgentService $agent,
        private CurrentUser $currentUser,
    ) {}

    // --- Agent internal endpoints (no auth for MVP) ---

    public function createRun(Request $request): Response
    {
        $body = $request->body();
        $submissionId = $body['submission_id'] ?? '';

        if ($submissionId === '') {
            return $this->badRequest('submission_id is required');
        }

        return $this->created(['data' => $this->agent->create($submissionId)]);
    }

    public function updateStatus(Request $request): Response
    {
        return $this->result($this->agent->updateStatus(
            (string) $request->param('id'),
            (string) ($request->body()['status'] ?? ''),
        ));
    }

    public function updateTodo(Request $request): Response
    {
        return $this->result($this->agent->updateTodo(
            (string) $request->param('id'),
            $request->body()['todos'] ?? [],
        ));
    }

    public function updateMessages(Request $request): Response
    {
        return $this->result($this->agent->updateMessages(
            (string) $request->param('id'),
            $request->body()['messages'] ?? [],
        ));
    }

    public function saveReport(Request $request): Response
    {
        return $this->result($this->agent->saveReport(
            (string) $request->param('id'),
            (string) ($request->body()['report'] ?? ''),
        ));
    }

    // --- Admin endpoints ---

    public function showForSubmission(Request $request): Response
    {
        $result = $this->agent->findBySubmissionId(
            (string) $request->param('submissionId'),
        );

        return $this->result($result);
    }

    private function result(array $result, int $successStatus = 200): Response
    {
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data($result, $successStatus);
    }
}
