<?php

declare(strict_types=1);

namespace App\Features\Submissions;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class SubmissionController extends BaseController
{
    public function __construct(
        private SubmissionService $submissions,
        private CurrentUser $currentUser,
    ) {}

    public function create(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        return $this->result($this->submissions->submit($userId, $request->body()), 201);
    }

    public function mine(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        return $this->data(['submissions' => $this->submissions->listMine($userId)]);
    }

    public function adminIndex(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        return $this->data(['submissions' => $this->submissions->listAdmin($request->query('status'))]);
    }

    public function decide(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $body = $request->body();
        return $this->result($this->submissions->decide(
            (string) $request->param('id'),
            $body['status'] ?? null,
            $body['admin_notes'] ?? null,
        ));
    }

    private function result(array $result, int $successStatus = 200): Response
    {
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data($result, $successStatus);
    }
}
