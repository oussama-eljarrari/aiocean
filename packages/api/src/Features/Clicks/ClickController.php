<?php

declare(strict_types=1);

namespace App\Features\Clicks;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class ClickController extends BaseController
{
    public function __construct(
        private ClickService $clicks,
        private CurrentUser $currentUser,
    ) {}

    public function record(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $result = $this->clicks->record((string) $request->param('toolId'), $userId);
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data([
            'clicked' => $result['clicked'],
            'count' => $result['count'],
        ]);
    }
}
