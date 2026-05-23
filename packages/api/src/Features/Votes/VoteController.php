<?php

declare(strict_types=1);

namespace App\Features\Votes;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class VoteController extends BaseController
{
    public function __construct(
        private VoteService $votes,
        private CurrentUser $currentUser,
    ) {}

    public function toggle(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $result = $this->votes->toggle((string) $request->param('toolId'), $userId);
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data([
            'voted' => $result['voted'],
            'count' => $result['count'],
        ]);
    }
}
