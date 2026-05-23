<?php

declare(strict_types=1);

namespace App\Features\Reviews;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class ReviewController extends BaseController
{
    public function __construct(
        private ReviewService $reviews,
        private CurrentUser $currentUser,
    ) {}

    public function index(Request $request): Response
    {
        $toolId = (string) $request->param('toolId');
        $reviews = $this->reviews->listForTool($toolId);

        if ($reviews === null) {
            return $this->notFound('Tool not found');
        }

        return $this->data(['reviews' => $reviews]);
    }

    public function upsert(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $body = $request->body();
        $result = $this->reviews->upsert(
            (string) $request->param('toolId'),
            $userId,
            $body['rating'] ?? null,
            $body['comment'] ?? '',
        );

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data(['review' => $result['review']], 200);
    }
}
