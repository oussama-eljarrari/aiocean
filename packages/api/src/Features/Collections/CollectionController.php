<?php

declare(strict_types=1);

namespace App\Features\Collections;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class CollectionController extends BaseController
{
    public function __construct(
        private CollectionService $collections,
        private CurrentUser $currentUser,
    ) {}

    public function index(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        return $this->data(['collections' => $this->collections->list($userId)]);
    }

    public function create(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $body = $request->body();
        return $this->result($this->collections->create($userId, $body['name'] ?? '', $body['is_public'] ?? false), 201);
    }

    public function update(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        return $this->result($this->collections->update((string) $request->param('id'), $userId, $request->body()));
    }

    public function delete(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        return $this->result($this->collections->delete((string) $request->param('id'), $userId));
    }

    public function addTool(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $body = $request->body();
        return $this->result($this->collections->addTool((string) $request->param('id'), $userId, $body['tool_id'] ?? null));
    }

    public function removeTool(Request $request): Response
    {
        $userId = $this->requireUserId();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $body = $request->body();
        return $this->result($this->collections->removeTool((string) $request->param('id'), $userId, $body['tool_id'] ?? null));
    }

    private function requireUserId(): ?string
    {
        return $this->currentUser->id();
    }

    private function result(array $result, int $successStatus = 200): Response
    {
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data($result, $successStatus);
    }
}
