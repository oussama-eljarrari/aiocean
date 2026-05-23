<?php

declare(strict_types=1);

namespace App\Features\Reviews;

use App\Features\Tools\ToolLookupInterface;

final class ReviewService
{
    public function __construct(
        private ReviewRepository $reviews,
        private ToolLookupInterface $tools,
    ) {}

    public function listForTool(string $toolId): ?array
    {
        if (!$this->tools->exists($toolId)) {
            return null;
        }

        return $this->reviews->findForTool($toolId);
    }

    /** @return array{review?: array, error?: string, status?: int} */
    public function upsert(string $toolId, string $userId, mixed $rating, mixed $comment): array
    {
        if (!$this->tools->exists($toolId)) {
            return ['error' => 'Tool not found', 'status' => 404];
        }

        if (!is_numeric($rating) || (int) $rating < 1 || (int) $rating > 5) {
            return ['error' => 'Rating must be an integer from 1 to 5', 'status' => 400];
        }

        $comment = trim((string) $comment);
        if ($comment === '') {
            return ['error' => 'Comment is required', 'status' => 400];
        }

        return ['review' => $this->reviews->upsert($toolId, $userId, (int) $rating, $comment)];
    }
}
